'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Booking, WaitlistItem } from '@/lib/types';
import { formatSlotLabel, TYPE_BADGES } from '@/lib/constants';
import { cancelBooking, leaveWaitlist } from '@/lib/actions/bookings';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { Modal } from './ui/Modal';
import { Calendar, Clock, MapPin, Sparkles, ArrowRight } from 'lucide-react';

interface MyBookingsViewProps {
  confirmedBookings: Booking[];
  waitlistItems: WaitlistItem[];
  pastBookings: Booking[];
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  confirmedBookings,
  waitlistItems,
  pastBookings,
}) => {
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    setIsLoading(true);
    setFeedback(null);

    const res = await cancelBooking(cancellingBookingId);
    setIsLoading(false);
    setCancellingBookingId(null);

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleLeaveWaitlist = async (id: string) => {
    setIsLoading(true);
    setFeedback(null);

    const res = await leaveWaitlist(id);
    setIsLoading(false);

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Confirmed' : 'Error'}
        >
          {feedback.message}
        </Alert>
      )}

      {/* 1. UPCOMING CONFIRMED BOOKINGS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            Upcoming Confirmed Bookings ({confirmedBookings.length})
          </h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full w-fit">
            Daily limit: max 2 bookings/day
          </span>
        </div>

        {confirmedBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center space-y-3">
            <p className="text-sm text-gray-500">
              You don&apos;t have any upcoming reservations.
            </p>
            <Link href="/">
              <Button size="sm" variant="outline">
                Browse Campus Resources <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedBookings.map((b) => {
              const badge = b.resource?.type
                ? TYPE_BADGES[b.resource.type]
                : null;

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 relative overflow-hidden hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {badge && (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1.5 ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      )}
                      <h3 className="font-bold text-gray-900 text-base">
                        {b.resource?.name || 'Campus Resource'}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{b.resource?.location}</span>
                      </p>
                    </div>

                    <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      Confirmed
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-gray-700 border border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      {b.booking_date}
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      {formatSlotLabel(b.hour)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-400">
                      Auto-promotion enabled on cancel
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancellingBookingId(b.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      Cancel Booking
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. MY WAITLIST SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
            My Waitlist ({waitlistItems.length})
          </h2>
          <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full font-medium border border-purple-200">
            FIFO Auto-Promotion Active
          </span>
        </div>

        {waitlistItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
            You are not currently in any waitlist queues. If a desired slot is occupied, click &quot;Join waitlist&quot; to queue for it.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waitlistItems.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm space-y-3 bg-gradient-to-r from-purple-50/30 to-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {w.resource?.name || 'Campus Resource'}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {w.resource?.location}
                    </p>
                  </div>

                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    In Queue
                  </span>
                </div>

                <div className="bg-purple-50/60 p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-purple-900 border border-purple-100">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    {w.booking_date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600" />
                    {formatSlotLabel(w.hour)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-500">
                    Auto-promotes if the current booking cancels
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLeaveWaitlist(w.id)}
                    isLoading={isLoading}
                    className="text-gray-500 hover:text-red-600 text-xs"
                  >
                    Leave Waitlist
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. PAST & CANCELLED BOOKINGS */}
      {pastBookings.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-gray-200">
          <h2 className="text-base font-bold text-gray-700">
            Past & Cancelled Bookings ({pastBookings.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-sm">
            {pastBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600 hover:bg-gray-50/50"
              >
                <div>
                  <span className="font-bold text-gray-900 mr-2 text-sm">
                    {b.resource?.name}
                  </span>
                  <span className="text-gray-500 font-mono">
                    {b.booking_date} ({formatSlotLabel(b.hour)})
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-semibold ${
                      b.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {b.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal for Booking Cancellation Confirmation */}
      <Modal
        isOpen={!!cancellingBookingId}
        onClose={() => setCancellingBookingId(null)}
        title="Confirm Slot Cancellation"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </p>

          <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Automatic Waitlist Promotion</p>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                The oldest student waiting in the queue who is under their 2-booking daily limit will be automatically confirmed and notified in-app.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setCancellingBookingId(null)}
              disabled={isLoading}
            >
              Keep My Slot
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCancel}
              isLoading={isLoading}
            >
              Yes, Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
