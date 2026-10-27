import React from 'react';
import Link from 'next/link';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/mongodb';
import { Resource as ResourceModel } from '@/lib/models/Resource';
import { Booking as BookingModel } from '@/lib/models/Booking';
import { Waitlist as WaitlistModel } from '@/lib/models/Waitlist';
import { getSessionUser } from '@/lib/auth/session';
import { ResourceDetailView } from '@/components/ResourceDetailView';
import { Resource, SlotInfo } from '@/lib/types';
import {
  SLOT_HOURS,
  formatSlotLabel,
  getTodayDateString,
  isSlotInPast,
} from '@/lib/constants';
import { ArrowLeft, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ResourceDetailPageProps {
  params: {
    id: string;
  };
  searchParams: {
    date?: string;
  };
}

export default async function ResourceDetailPage({
  params,
  searchParams,
}: ResourceDetailPageProps) {
  const user = await getSessionUser();
  const today = getTodayDateString();

  // Validate date is today or onward
  let selectedDate = searchParams.date || today;
  if (selectedDate < today) {
    selectedDate = today;
  }

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Invalid Resource ID</h2>
        <p className="text-sm text-gray-500">
          The requested campus facility identifier does not exist.
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to All Facilities
          </Button>
        </Link>
      </div>
    );
  }

  let resource: Resource | null = null;
  let confirmedBookings: any[] = [];
  let waitlistEntries: any[] = [];
  let errorMessage: string | null = null;

  try {
    await connectDB();

    const resourceDoc = await ResourceModel.findById(params.id).lean();
    if (!resourceDoc) {
      return (
        <div className="max-w-lg mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Facility Not Found</h2>
          <p className="text-sm text-gray-500">
            This resource may have been removed or renamed.
          </p>
          <Link href="/">
            <Button variant="outline" className="mt-2">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to All Facilities
            </Button>
          </Link>
        </div>
      );
    }

    // If deactivated and user is a student, hide it
    if (!(resourceDoc as any).isActive && user?.role !== 'admin') {
      return (
        <div className="max-w-lg mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Facility Unavailable</h2>
          <p className="text-sm text-gray-500">
            This resource has been deactivated and is currently not open for bookings.
          </p>
          <Link href="/">
            <Button variant="outline" className="mt-2">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Browse Active Facilities
            </Button>
          </Link>
        </div>
      );
    }

    resource = {
      id: (resourceDoc as any)._id.toString(),
      name: (resourceDoc as any).name,
      type: (resourceDoc as any).type,
      location: (resourceDoc as any).location,
      description: (resourceDoc as any).description,
      is_active: (resourceDoc as any).isActive,
    };

    // Fetch confirmed bookings for this resource on selected date
    confirmedBookings = await BookingModel.find({
      resourceId: params.id,
      bookingDate: selectedDate,
      status: 'confirmed',
    }).lean();

    // Fetch waitlist entries for this resource on selected date
    waitlistEntries = await WaitlistModel.find({
      resourceId: params.id,
      bookingDate: selectedDate,
      status: 'waiting',
    }).lean();
  } catch (error: any) {
    errorMessage = error.message || 'Failed to load resource availability.';
  }

  if (errorMessage || !resource) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Database Connection Error</h2>
        <p className="text-sm text-gray-500">{errorMessage}</p>
        <Link href="/">
          <Button variant="outline" className="mt-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Facilities
          </Button>
        </Link>
      </div>
    );
  }

  // Construct slots info (8:00 to 20:00)
  const slots: SlotInfo[] = SLOT_HOURS.map((hour) => {
    const slotLabel = formatSlotLabel(hour);
    const isPast = isSlotInPast(selectedDate, hour);

    const booking = confirmedBookings.find((b: any) => b.hour === hour);
    const slotWaitlist = waitlistEntries.filter((w: any) => w.hour === hour);

    const isMyBooking = booking ? booking.userId.toString() === user?.id : false;
    const isMyWaitlist = slotWaitlist.some(
      (w: any) => w.userId.toString() === user?.id
    );

    let status: SlotInfo['status'] = 'available';

    if (isPast) {
      status = 'past';
    } else if (isMyBooking) {
      status = 'my_booking';
    } else if (isMyWaitlist) {
      status = 'my_waitlist';
    } else if (booking) {
      status = 'booked';
    }

    return {
      hour,
      label: slotLabel,
      status,
      bookingId: booking ? booking._id.toString() : undefined,
      bookingUser: booking ? booking.userId.toString() : undefined,
      waitlistCount: slotWaitlist.length,
      isCurrentUserBooked: isMyBooking,
      isCurrentUserWaitlisted: isMyWaitlist,
    };
  });

  return (
    <div className="max-w-5xl mx-auto py-4">
      <ResourceDetailView
        resource={resource}
        selectedDate={selectedDate}
        slots={slots}
      />
    </div>
  );
}
