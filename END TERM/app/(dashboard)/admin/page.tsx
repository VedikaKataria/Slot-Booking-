import React from 'react';
import { connectDB } from '@/lib/db/mongodb';
import { Resource as ResourceModel } from '@/lib/models/Resource';
import { Booking as BookingModel } from '@/lib/models/Booking';
import '@/lib/models/User';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { Resource, Booking } from '@/lib/types';
import { getTodayDateString } from '@/lib/constants';

export default async function AdminPage() {
  const user = await getSessionUser();

  // Role-based protection: Only admins allowed
  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  const today = getTodayDateString();

  let resources: Resource[] = [];
  let bookings: (Booking & { user?: { full_name: string } })[] = [];
  let stats = {
    totalBookings: 0,
    mostBookedResource: 'None yet',
    bookingsToday: 0,
  };

  try {
    await connectDB();

    // 1. Fetch all resources (including deactivated ones so admin can re-activate or edit them)
    const resDocs = await ResourceModel.find().sort({ isActive: -1, createdAt: 1 }).lean();
    resources = resDocs.map((r: any) => ({
      id: r._id.toString(),
      name: r.name,
      type: r.type,
      location: r.location,
      description: r.description,
      is_active: r.isActive,
    }));

    // 2. Fetch all bookings
    const bookingDocs = await BookingModel.find()
      .populate('resourceId')
      .populate('userId')
      .sort({ bookingDate: -1, hour: -1 })
      .lean();

    bookings = bookingDocs.map((b: any) => ({
      id: b._id.toString(),
      resource_id: b.resourceId?._id?.toString() || '',
      user_id: b.userId?._id?.toString() || '',
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
      user: b.userId
        ? {
            id: b.userId._id.toString(),
            full_name: b.userId.name,
            role: b.userId.role,
          }
        : undefined,
    }));

    // 3. Compute the 3 simple stats
    // Stat A: Total Bookings (all-time confirmed)
    const totalCount = await BookingModel.countDocuments({ status: 'confirmed' });

    // Stat B: Bookings Today
    const todayCount = await BookingModel.countDocuments({
      bookingDate: today,
      status: 'confirmed',
    });

    // Stat C: Most Booked Resource
    const mostBookedAgg = await BookingModel.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$resourceId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    let mostBookedName = 'No bookings yet';
    if (mostBookedAgg.length > 0) {
      const topResource = await ResourceModel.findById(mostBookedAgg[0]._id).lean();
      if (topResource) {
        mostBookedName = `${(topResource as any).name} (${mostBookedAgg[0].count} bookings)`;
      }
    }

    stats = {
      totalBookings: totalCount,
      mostBookedResource: mostBookedName,
      bookingsToday: todayCount,
    };
  } catch (err) {
    console.error('Failed to load admin data:', err);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Admin Control Center
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Add new facilities, edit details, toggle student visibility, review live metrics, and manage reservations.
        </p>
      </div>

      <AdminDashboardView
        resources={resources}
        bookings={bookings}
        stats={stats}
      />
    </div>
  );
}
