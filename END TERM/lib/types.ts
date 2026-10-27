export type UserRole = 'student' | 'admin';

export type ResourceType = 'lab' | 'study_room' | 'court';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Booking {
  id: string;
  resource_id: string;
  user_id: string;
  booking_date: string; // YYYY-MM-DD
  hour: number;         // 8 to 19
  status: 'confirmed' | 'cancelled';
  created_at?: string;
  resource?: Resource;
  user?: Profile;
}

export interface WaitlistItem {
  id: string;
  resource_id: string;
  user_id: string;
  booking_date: string;
  hour: number;
  status: 'waiting' | 'promoted' | 'cancelled';
  created_at?: string;
  resource?: Resource;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at?: string;
}

export type SlotAvailabilityStatus = 
  | 'past'
  | 'my_booking'
  | 'booked'
  | 'my_waitlist'
  | 'available';

export interface SlotInfo {
  hour: number;          // e.g. 8 for 8:00 - 9:00
  label: string;         // "08:00 - 09:00"
  status: SlotAvailabilityStatus;
  bookingId?: string;
  bookingUser?: string;
  waitlistCount: number;
  isCurrentUserBooked: boolean;
  isCurrentUserWaitlisted: boolean;
}
