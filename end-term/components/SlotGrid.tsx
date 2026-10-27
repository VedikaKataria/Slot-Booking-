'use client';

import React from 'react';
import { Clock, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { SlotInfo } from '@/lib/types';

interface SlotGridProps {
  slots: SlotInfo[];
  onSelectSlot: (slot: SlotInfo) => void;
}

export const SlotGrid: React.FC<SlotGridProps> = ({ slots, onSelectSlot }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {slots.map((slot) => {
        let cardStyles = 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer';
        let badgeStyle = 'bg-gray-100 text-gray-700';
        let statusLabel = 'Available';
        let isClickable = true;

        if (slot.status === 'past') {
          cardStyles = 'bg-gray-50/70 border-gray-100 opacity-60 cursor-not-allowed';
          badgeStyle = 'bg-gray-200 text-gray-500';
          statusLabel = 'Past';
          isClickable = false;
        } else if (slot.status === 'my_booking') {
          cardStyles = 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300 cursor-pointer';
          badgeStyle = 'bg-indigo-600 text-white font-medium';
          statusLabel = 'Your Booking';
        } else if (slot.status === 'my_waitlist') {
          cardStyles = 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300 cursor-pointer';
          badgeStyle = 'bg-purple-600 text-white font-medium';
          statusLabel = 'On Waitlist';
        } else if (slot.status === 'booked') {
          cardStyles = 'bg-amber-50/50 border-amber-200 hover:border-amber-400 cursor-pointer';
          badgeStyle = 'bg-amber-100 text-amber-800';
          statusLabel = 'Booked';
        } else {
          // Available
          cardStyles = 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer';
          badgeStyle = 'bg-emerald-100 text-emerald-800';
          statusLabel = 'Available';
        }

        return (
          <div
            key={slot.hour}
            onClick={() => isClickable && onSelectSlot(slot)}
            className={`p-3 rounded-xl border flex flex-col justify-between transition-all select-none ${cardStyles}`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {slot.label}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between">
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${badgeStyle}`}>
                {statusLabel}
              </span>

              {slot.status === 'booked' && (
                <span
                  className="text-[10px] text-amber-700 flex items-center gap-0.5"
                  title="Students currently on waitlist"
                >
                  <Users className="w-3 h-3" />
                  {slot.waitlistCount}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
