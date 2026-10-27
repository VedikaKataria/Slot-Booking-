'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Resource, SlotInfo } from '@/lib/types';
import { TYPE_BADGES, getTodayDateString } from '@/lib/constants';
import { SlotGrid } from './SlotGrid';
import { BookingModal } from './BookingModal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Laptop,
  BookOpen,
  Trophy,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface ResourceDetailViewProps {
  resource: Resource;
  selectedDate: string;
  slots: SlotInfo[];
}

export const ResourceDetailView: React.FC<ResourceDetailViewProps> = ({
  resource,
  selectedDate,
  slots,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayStr = getTodayDateString();

  const handleDateChange = (newDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', newDate);
    router.push(`${pathname}?${params.toString()}`);
  };

  const setRelativeDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    handleDateChange(`${yyyy}-${mm}-${dd}`);
  };

  const badge = TYPE_BADGES[resource.type] || {
    label: resource.type,
    bg: 'bg-gray-100',
    text: 'text-gray-800',
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lab':
        return <Laptop className="w-5 h-5 text-blue-600" />;
      case 'study_room':
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case 'court':
        return <Trophy className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const availableCount = slots.filter((s) => s.status === 'available').length;
  const myBookingsCount = slots.filter((s) => s.status === 'my_booking').length;

  const handleSelectSlot = (slot: SlotInfo) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all resources
        </Link>
      </div>

      {/* Resource Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
              >
                {getTypeIcon(resource.type)}
                {badge.label}
              </span>

              {!resource.is_active ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" /> Maintenance Mode
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Available for Booking
                </span>
              )}

              {myBookingsCount > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                  You reserved {myBookingsCount} slot(s) today
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {resource.name}
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{resource.location}</span>
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 sm:text-right shrink-0">
            <div className="text-xs text-gray-500 font-medium">Slots Availability</div>
            <div className="text-lg font-extrabold text-gray-900 mt-0.5">
              <span className={availableCount > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {availableCount}
              </span>
              <span className="text-gray-400 text-sm font-normal"> / 12 slots</span>
            </div>
          </div>
        </div>

        {resource.description && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {resource.description}
            </p>
          </div>
        )}

        {!resource.is_active && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              This facility is currently under maintenance. New bookings are paused until service completes.
            </span>
          </div>
        )}
      </div>

      {/* Date Selector & Slot Availability Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Select Date & 1-Hour Slot (08:00 - 20:00)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Strict 1-hour slots. Max 2 confirmed bookings per student per day.
            </p>
          </div>

          {/* Date Picker (Today onward only) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none"
              />
            </div>

            {/* Quick shortcuts */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRelativeDate(0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedDate === todayStr
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setRelativeDate(1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Tomorrow
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-gray-700 mr-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-gray-400" /> Legend:
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
          </span>
          <span className="inline-flex items-center gap-1 text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-600" /> Your Booking
          </span>
          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Booked (Join Waitlist)
          </span>
          <span className="inline-flex items-center gap-1 text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> On Waitlist
          </span>
          <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> Past
          </span>
        </div>

        {/* 12-Slot Hourly Grid */}
        <SlotGrid slots={slots} onSelectSlot={handleSelectSlot} />
      </div>

      {/* Booking / Waitlist Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resource={resource}
        slot={selectedSlot}
        bookingDate={selectedDate}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
};
