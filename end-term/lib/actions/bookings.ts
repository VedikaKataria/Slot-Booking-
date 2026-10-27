'use server';

import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Waitlist } from '@/lib/models/Waitlist';
import { Resource } from '@/lib/models/Resource';
import { Notification } from '@/lib/models/Notification';
import { getSessionUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import {
  OPERATING_START_HOUR,
  OPERATING_END_HOUR,
  MAX_CONFIRMED_BOOKINGS_PER_DAY,
  isSlotInPast,
} from '@/lib/constants';

const isValidBookingDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const requestFailure = 'The request could not be completed. Check your connection and try again.';
export type ActionResponse = {
  success: boolean;
  message: string;
};

/**
 * Books a 1-hour slot with strict validation checks in order:
 * 1. User is logged in
 * 2. Slot is not in the past
 * 3. User has fewer than 2 confirmed bookings that day
 * 4. Slot is free (relying on MongoDB Partial Unique Index)
 */
export async function bookSlot(
  resourceId: string,
  bookingDate: string,
  hour: number
): Promise<ActionResponse> {
  // Check 1: User is logged in
  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to book a slot.',
    };
  }

  // Validate resource, date, and hour before database access.
  if (!mongoose.Types.ObjectId.isValid(resourceId)) return { success: false, message: 'Invalid resource identifier.' };
  if (!Number.isInteger(hour) || hour < OPERATING_START_HOUR || hour >= OPERATING_END_HOUR) {
    return { success: false, message: `Slots are only available between ${OPERATING_START_HOUR}:00 and ${OPERATING_END_HOUR}:00.` };
  }
  if (!isValidBookingDate(bookingDate)) return { success: false, message: 'Enter a valid booking date in YYYY-MM-DD format.' };
  if (isSlotInPast(bookingDate, hour)) return { success: false, message: 'Cannot book slots in the past.' };
  try {
    await connectDB();

    // Verify resource exists and is active
    const resourceDoc = await Resource.findById(resourceId);
    if (!resourceDoc || !resourceDoc.isActive) {
      return {
        success: false,
        message: 'This resource is unavailable or has been deactivated by administration.',
      };
    }

    // Check 3: User has fewer than 2 confirmed bookings that day
    const userBookingsCount = await Booking.countDocuments({
      userId: user.id,
      bookingDate,
      status: 'confirmed',
    });

    if (userBookingsCount >= MAX_CONFIRMED_BOOKINGS_PER_DAY) {
      return {
        success: false,
        message: 'You have already reached the maximum of 2 confirmed bookings for this day.',
      };
    }

    // Check 4: Slot is free. Rely on the MongoDB unique index and catch duplicate key error
    await Booking.create({
      resourceId,
      userId: user.id,
      bookingDate,
      hour,
      status: 'confirmed',
    });

    // Revalidate affected views
    revalidatePath('/');
    revalidatePath(`/resources/${resourceId}`);
    revalidatePath('/my-bookings');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Booking confirmed! Your 1-hour slot has been reserved.',
    };
  } catch (error: any) {
    // E11000 is MongoDB duplicate key error on the partial unique index
    if (error.code === 11000) {
      return {
        success: false,
        message: 'Someone just booked this slot. You can join the waitlist instead!',
      };
    }
    return {
      success: false,
      message: requestFailure,
    };
  }
}

/**
 * Adds a student to the waitlist if slot is booked; prevents duplicate entries
 */
export async function joinWaitlist(
  resourceId: string,
  bookingDate: string,
  hour: number
): Promise<ActionResponse> {
  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to join the waitlist.',
    };
  }

  if (!mongoose.Types.ObjectId.isValid(resourceId)) return { success: false, message: 'Invalid resource identifier.' };
  if (!Number.isInteger(hour) || hour < OPERATING_START_HOUR || hour >= OPERATING_END_HOUR) {
    return { success: false, message: 'Select a valid operating hour.' };
  }
  if (!isValidBookingDate(bookingDate)) return { success: false, message: 'Enter a valid booking date in YYYY-MM-DD format.' };
  if (isSlotInPast(bookingDate, hour)) return { success: false, message: 'Cannot join waitlist for past slots.' };
  try {
    await connectDB();

    // Verify resource exists and is active
    const resourceDoc = await Resource.findById(resourceId);
    if (!resourceDoc || !resourceDoc.isActive) {
      return {
        success: false,
        message: 'This resource is unavailable or has been deactivated.',
      };
    }

    // Prevent joining waitlist if student already holds the confirmed booking
    const ownBooking = await Booking.findOne({
      resourceId,
      bookingDate,
      hour,
      userId: user.id,
      status: 'confirmed',
    });

    if (ownBooking) {
      return {
        success: false,
        message: 'You already hold the confirmed booking for this slot.',
      };
    }

    // Prevent duplicate waitlist entries (pre-check)
    const existingWaitlist = await Waitlist.findOne({
      resourceId,
      bookingDate,
      hour,
      userId: user.id,
      status: 'waiting',
    });

    if (existingWaitlist) {
      return {
        success: false,
        message: 'You are already on the waitlist for this slot.',
      };
    }

    // Insert into waitlist; also protected by MongoDB unique index
    await Waitlist.create({
      resourceId,
      userId: user.id,
      bookingDate,
      hour,
      status: 'waiting',
    });

    revalidatePath('/');
    revalidatePath(`/resources/${resourceId}`);
    revalidatePath('/my-bookings');

    return {
      success: true,
      message: 'Joined waitlist! You will be automatically booked and notified if the slot opens.',
    };
  } catch (error: any) {
    if (error.code === 11000) {
      return {
        success: false,
        message: 'You are already on the waitlist for this slot.',
      };
    }
    return {
      success: false,
      message: requestFailure,
    };
  }
}

/**
 * Cancels a confirmed booking with automatic waitlist promotion:
 * 1. Only booking owner or admin can cancel
 * 2. Mark booking cancelled
 * 3. Find oldest waitlist entry whose user is still under the 2-per-day limit
 * 4. Create confirmed booking for them
 * 5. Delete their waitlist entry
 * 6. Insert notification for them
 */
export async function cancelBooking(bookingId: string): Promise<ActionResponse> {
  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to cancel a booking.',
    };
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return {
      success: false,
      message: 'Invalid booking identifier.',
    };
  }

  try {
    await connectDB();

    const booking = await Booking.findOne({ _id: bookingId, status: 'confirmed' });
    if (!booking) {
      return {
        success: false,
        message: 'Confirmed booking not found or already cancelled.',
      };
    }

    // Check: Only booking owner or admin can cancel
    if (booking.userId.toString() !== user.id && user.role !== 'admin') {
      return {
        success: false,
        message: 'Unauthorized: Only the booking owner or an admin can cancel this booking.',
      };
    }

    // 1. Mark booking cancelled
    booking.status = 'cancelled';
    await booking.save();

    // 2. Find oldest waitlist candidates (FIFO: ordered by createdAt ASC)
    const waitlistCandidates = await Waitlist.find({
      resourceId: booking.resourceId,
      bookingDate: booking.bookingDate,
      hour: booking.hour,
      status: 'waiting',
    }).sort({ createdAt: 1 });

    let promotedCandidate: any = null;

    // 3. Find the oldest waitlist candidate whose user is still under the 2-per-day limit
    for (const candidate of waitlistCandidates) {
      const candidateDailyCount = await Booking.countDocuments({
        userId: candidate.userId,
        bookingDate: booking.bookingDate,
        status: 'confirmed',
      });

      if (candidateDailyCount < MAX_CONFIRMED_BOOKINGS_PER_DAY) {
        promotedCandidate = candidate;
        break;
      }
    }

    // 4. If an eligible candidate is found:
    if (promotedCandidate) {
      // 4a. Create a confirmed booking for them
      await Booking.create({
        resourceId: booking.resourceId,
        userId: promotedCandidate.userId,
        bookingDate: booking.bookingDate,
        hour: booking.hour,
        status: 'confirmed',
      });

      // 4b. Delete their waitlist entry
      await Waitlist.findByIdAndDelete(promotedCandidate._id);

      // 4c. Insert notification for them
      const resDoc = await Resource.findById(booking.resourceId);
      const resName = resDoc ? resDoc.name : 'Campus Resource';
      const pad = (n: number) => n.toString().padStart(2, '0');

      await Notification.create({
        userId: promotedCandidate.userId,
        message: `Good news! A slot opened up for ${resName} on ${booking.bookingDate} (${pad(booking.hour)}:00-${pad(booking.hour + 1)}:00). You were promoted from the waitlist and your booking is confirmed!`,
      });

      revalidatePath('/');
      revalidatePath(`/resources/${booking.resourceId.toString()}`);
      revalidatePath('/my-bookings');
      revalidatePath('/admin');

      return {
        success: true,
        message: 'Booking cancelled. The oldest eligible waitlisted student has been automatically promoted!',
      };
    }

    revalidatePath('/');
    revalidatePath(`/resources/${booking.resourceId.toString()}`);
    revalidatePath('/my-bookings');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Booking cancelled successfully.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: requestFailure,
    };
  }
}

/**
 * Removes a student from the waitlist
 */
export async function leaveWaitlist(waitlistId: string): Promise<ActionResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: 'Unauthorized' };
  }

  if (!mongoose.Types.ObjectId.isValid(waitlistId)) {
    return { success: false, message: 'Invalid waitlist identifier.' };
  }

  try {
    await connectDB();
    await Waitlist.findOneAndDelete({ _id: waitlistId, userId: user.id });

    revalidatePath('/');
    revalidatePath('/my-bookings');
    return { success: true, message: 'Left waitlist successfully.' };
  } catch (error: any) {
    return { success: false, message: requestFailure };
  }
}
