-- ==============================================================================
-- SlotSync: Campus Resource Booking Database Schema & Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Roles: 'student' | 'admin')
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')) DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. RESOURCES TABLE (Types: 'lab' | 'study_room' | 'court')
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lab', 'study_room', 'court')),
  location TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. BOOKINGS TABLE (1-hour slots: hour 8 to 19 for 8:00 to 20:00)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  hour INT NOT NULL CHECK (hour >= 8 AND hour < 20),
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3b. PARTIAL UNIQUE INDEX: Strictly prevents double booking at the database level
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_slot_booking 
ON public.bookings (resource_id, booking_date, hour) 
WHERE (status = 'confirmed');

-- 4. WAITLIST TABLE
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  hour INT NOT NULL CHECK (hour >= 8 AND hour < 20),
  status TEXT NOT NULL CHECK (status IN ('waiting', 'promoted', 'cancelled')) DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_slot_waitlist
ON public.waitlist (resource_id, booking_date, hour, user_id)
WHERE (status = 'waiting');

-- 5. NOTIFICATIONS TABLE (In-app alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. AUTO-CREATE PROFILE ON SIGNUP TRIGGER (Default role: 'student')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ATOMIC CANCELLATION & WAITLIST PROMOTION FUNCTION (RPC)
-- Runs in ONE single transaction:
-- - Checks that only the booking owner or an admin can cancel
-- - Marks booking cancelled
-- - Finds oldest waitlist entry for that slot whose user is still under the 2-per-day limit
-- - Creates confirmed booking for them
-- - Deletes their waitlist entry
-- - Inserts in-app notification for them
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_user_daily_count INT;
  v_is_admin BOOLEAN := FALSE;
  v_candidate RECORD;
  v_promoted_user_id UUID := NULL;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();

  -- Check if user is admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM public.profiles
  WHERE id = v_current_user_id;

  -- 1. Find the booking
  SELECT b.*, r.name as resource_name
  INTO v_booking
  FROM public.bookings b
  JOIN public.resources r ON r.id = b.resource_id
  WHERE b.id = p_booking_id AND b.status = 'confirmed';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Confirmed booking not found');
  END IF;

  -- 2. Only the booking owner or an admin can cancel
  IF v_booking.user_id <> v_current_user_id AND NOT COALESCE(v_is_admin, FALSE) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Only the booking owner or an admin can cancel');
  END IF;

  -- 3. Mark the booking cancelled
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  -- 4. Find the oldest waitlist entry for that slot whose user is still under the 2-per-day limit
  FOR v_candidate IN
    SELECT w.*
    FROM public.waitlist w
    WHERE w.resource_id = v_booking.resource_id
      AND w.booking_date = v_booking.booking_date
      AND w.hour = v_booking.hour
      AND w.status = 'waiting'
    ORDER BY w.created_at ASC
    FOR UPDATE
  LOOP
    -- Check how many confirmed bookings this candidate already has on that day
    SELECT COUNT(*) INTO v_user_daily_count
    FROM public.bookings
    WHERE user_id = v_candidate.user_id
      AND booking_date = v_booking.booking_date
      AND status = 'confirmed';

    -- Must be strictly under 2 confirmed bookings that day
    IF v_user_daily_count < 2 THEN
      v_promoted_user_id := v_candidate.user_id;

      -- 4a. Create confirmed booking for them
      INSERT INTO public.bookings (resource_id, user_id, booking_date, hour, status)
      VALUES (v_booking.resource_id, v_candidate.user_id, v_booking.booking_date, v_booking.hour, 'confirmed');

      -- 4b. Delete their waitlist entry
      DELETE FROM public.waitlist
      WHERE id = v_candidate.id;

      -- 4c. Insert notification for them
      INSERT INTO public.notifications (user_id, message)
      VALUES (
        v_candidate.user_id,
        format('Good news! A slot opened up for %s on %s (%s:00-%s:00). You were promoted from the waitlist and your booking is confirmed!',
          v_booking.resource_name,
          v_booking.booking_date,
          to_char(v_booking.hour, 'FM00'),
          to_char(v_booking.hour + 1, 'FM00')
        )
      );

      EXIT; -- Stop at the first eligible candidate
    END IF;
  END LOOP;

  IF v_promoted_user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Booking cancelled and oldest eligible waitlisted student promoted successfully',
      'promoted_user_id', v_promoted_user_id
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Booking cancelled successfully');
END;
$$;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Anyone logged in can read active resources"
  ON public.resources FOR SELECT TO authenticated
  USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Only admins can insert resources"
  ON public.resources FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Only admins can update resources"
  ON public.resources FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Only admins can delete resources"
  ON public.resources FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users view own bookings or admin views all"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings or admin update all"
  ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users view own waitlist or admin views all"
  ON public.waitlist FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can join waitlist"
  ON public.waitlist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waitlist or admin update all"
  ON public.waitlist FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 9. SEED DATA (Exact 6 sample resources: 2 labs, 2 study rooms, 2 courts)
INSERT INTO public.resources (name, type, location, description, is_active)
VALUES
  (
    'Computer Lab 101 - High Performance Workstations',
    'lab',
    'Science & Tech Block, 1st Floor, Room 101',
    'High-performance computing workstations equipped for coding and simulations.',
    true
  ),
  (
    'AI & Robotics Lab',
    'lab',
    'Innovation Center, 2nd Floor, Room 204',
    'Equipped with GPU development rigs and robotics prototyping hardware.',
    true
  ),
  (
    'Silent Study Pod A',
    'study_room',
    'Central Library, 2nd Floor',
    'Soundproof individual study pod for focused and distraction-free study.',
    true
  ),
  (
    'Group Discussion Room 3',
    'study_room',
    'Student Activity Center, Room 108',
    'Collaborative workspace equipped with whiteboard and presentation display.',
    true
  ),
  (
    'Badminton Court 1',
    'court',
    'Indoor Sports Complex',
    'Standard tournament-grade wooden floor indoor badminton court.',
    true
  ),
  (
    'Tennis Court A',
    'court',
    'Outdoor Sports Pavilion',
    'Hardcourt outdoor tennis court with floodlights for evening games.',
    true
  )
ON CONFLICT DO NOTHING;
