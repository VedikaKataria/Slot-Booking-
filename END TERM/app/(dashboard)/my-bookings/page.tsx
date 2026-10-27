import React from 'react';
import { connectDB } from '@/lib/db/mongodb';
import { Booking as BookingModel } from '@/lib/models/Booking';
import { Waitlist as WaitlistModel } from '@/lib/models/Waitlist';
import '@/lib/models/Resource';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MyBookingsView } from '@/components/MyBookingsView';
import { Booking, WaitlistItem } from '@/lib/types';
import { isSlotInPast } from '@/lib/constants';

export default async function MyBookingsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  let upcomingBookings: Booking[] = [];
  let waitlistItems: WaitlistItem[] = [];
  let pastBookings: Booking[] = [];

  try {
    await connectDB();

    // 1. Fetch all bookings for user
    const allUserBookingDocs = await BookingModel.find({
      userId: user.id,
    })
      .populate('resourceId')
      .sort({ bookingDate: -1, hour: -1 })
      .lean();

    allUserBookingDocs.forEach((b: any) => {
      const item: Booking = {
        id: b._id.toString(),
        resource_id: b.resourceId?._id?.toString() || '',
        user_id: b.userId.toString(),
        booking_date: b.bookingDate,
        hour: b.hour,
        status: b.status,
        created_at: b.createdAt ? new Date(b.createdAt).toISOString() : '',
        resource: b.resourceId
          ? {
              id: b.resourceId._id.toString(),
              name: b.resourceId.name,
              type: b.resourceId.type,
              location: b.resourceId.location,
              description: b.resourceId.description,
              is_active: b.resourceId.isActive,
            }
          : undefined,
      };

      const isPast = isSlotInPast(b.bookingDate, b.hour);

      if (b.status === 'confirmed' && !isPast) {
        upcomingBookings.push(item);
      } else {
        pastBookings.push(item);
      }
    });

    // Sort upcoming ascending (soonest first)
    upcomingBookings.sort((a, b) => {
      if (a.booking_date !== b.booking_date) {
        return a.booking_date.localeCompare(b.booking_date);
      }
      return a.hour - b.hour;
    });

    // 2. Fetch active waitlist entries
    const waitlistDocs = await WaitlistModel.find({
      userId: user.id,
      status: 'waiting',
    })
      .populate('resourceId')
      .sort({ bookingDate: 1, hour: 1 })
      .lean();

    waitlistItems = waitlistDocs
      .filter((w: any) => !isSlotInPast(w.bookingDate, w.hour))
      .map((w: any) => ({
        id: w._id.toString(),
        resource_id: w.resourceId?._id?.toString() || '',
        user_id: w.userId.toString(),
        booking_date: w.bookingDate,
        hour: w.hour,
        status: w.status,
        created_at: w.createdAt ? new Date(w.createdAt).toISOString() : '',
        resource: w.resourceId
          ? {
              id: w.resourceId._id.toString(),
              name: w.resourceId.name,
              type: w.resourceId.type,
              location: w.resourceId.location,
              description: w.resourceId.description,
              is_active: w.resourceId.isActive,
            }
          : undefined,
      }));
  } catch (err) {
    console.error('Failed to load user bookings:', err);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          My Bookings & Waitlists
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review your upcoming reservations, cancel slots to auto-promote waitlisted peers, and track your position in line.
        </p>
      </div>

      <MyBookingsView
        confirmedBookings={upcomingBookings}
        waitlistItems={waitlistItems}
        pastBookings={pastBookings}
      />
    </div>
  );
}
