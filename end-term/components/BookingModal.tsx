'use client';

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { Resource, SlotInfo } from '@/lib/types';
import { bookSlot, cancelBooking, joinWaitlist } from '@/lib/actions/bookings';
import { Calendar, Clock, MapPin, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  slot: SlotInfo | null;
  bookingDate: string;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  resource,
  slot,
  bookingDate,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showJoinWaitlistFallback, setShowJoinWaitlistFallback] = useState(false);

  if (!resource || !slot) return null;

  const handleBook = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowJoinWaitlistFallback(false);

    try {
      const res = await bookSlot(resource.id, bookingDate, slot.hour);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message);
        if (res.message.includes('Someone just booked this slot') || res.message.includes('waitlist')) {
          setShowJoinWaitlistFallback(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await joinWaitlist(resource.id, bookingDate, slot.hour);
      if (res.success) {
        setSuccessMessage(res.message);
        setShowJoinWaitlistFallback(false);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1400);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!slot.bookingId) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await cancelBooking(slot.bookingId);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1400);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel booking.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (slot.status === 'available') return 'Reserve 1-Hour Slot';
    if (slot.status === 'booked') return 'Slot Booked - Join Waitlist';
    if (slot.status === 'my_booking') return 'Manage Your Booking';
    if (slot.status === 'my_waitlist') return 'Waitlist Queue Status';
    return 'Slot Information';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="space-y-4">
        {/* Resource info card */}
        <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
          <div className="font-bold text-gray-900 text-base">{resource.name}</div>
          <div className="flex flex-wrap gap-y-1.5 gap-x-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {resource.location}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {bookingDate}
            </span>
            <span className="flex items-center gap-1 font-semibold text-indigo-700">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              {slot.label} (1 Hour)
            </span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <Alert type="error" title="Notice">
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert type="success" title="Confirmed">
            {successMessage}
          </Alert>
        )}

        {/* Fallback Join Waitlist Button if slot was just taken */}
        {showJoinWaitlistFallback && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
            <span className="text-xs text-amber-900 font-medium">
              Want to join the waitlist for this slot instead?
            </span>
            <Button
              size="sm"
              onClick={handleJoinWaitlist}
              isLoading={isLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Join Waitlist
            </Button>
          </div>
        )}

        {/* 1. Available Slot Content */}
        {slot.status === 'available' && !successMessage && !showJoinWaitlistFallback && (
          <div className="space-y-3">
            <div className="text-xs text-blue-900 bg-blue-50/70 p-3 rounded-lg border border-blue-100">
              <p className="font-semibold mb-1">Booking Guidelines:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
                <li>Fixed 1-hour slot (08:00 to 20:00).</li>
                <li>Maximum 2 confirmed bookings per user per day.</li>
                <li>Protected against simultaneous duplicate booking.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleBook} isLoading={isLoading}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm Reservation
              </Button>
            </div>
          </div>
        )}

        {/* 2. Booked Slot Content (Join Waitlist) */}
        {slot.status === 'booked' && !successMessage && (
          <div className="space-y-3">
            <div className="text-xs text-amber-800 bg-amber-50 p-3.5 rounded-lg border border-amber-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                This slot is currently booked
              </p>
              <p>
                Currently, <span className="font-bold">{slot.waitlistCount}</span> student(s) are on the waitlist.
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                If the current confirmed student cancels, you will automatically be promoted in FIFO order and notified in-app.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                Close
              </Button>
              <Button onClick={handleJoinWaitlist} isLoading={isLoading} variant="primary">
                <Sparkles className="w-4 h-4 mr-1.5" />
                Join Waitlist
              </Button>
            </div>
          </div>
        )}

        {/* 3. My Booking Slot Content (Cancel option) */}
        {slot.status === 'my_booking' && !successMessage && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You currently hold this reservation. If your plans changed, please cancel so a peer on the waitlist can utilize the facility.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                Keep My Slot
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelBooking}
                isLoading={isLoading}
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        )}

        {/* 4. My Waitlist Slot Content */}
        {slot.status === 'my_waitlist' && !successMessage && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You are currently on the waitlist for this slot. You will be automatically booked and notified if the current reservation is cancelled.
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
