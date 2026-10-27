'use client';

import React, { useState } from 'react';
import { Resource, SlotInfo } from '@/lib/types';
import { TYPE_BADGES } from '@/lib/constants';
import { SlotGrid } from './SlotGrid';
import { BookingModal } from './BookingModal';
import { MapPin, Laptop, BookOpen, Trophy } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  bookingDate: string;
  slots: SlotInfo[];
  onRefresh?: () => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  bookingDate,
  slots,
  onRefresh,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const badge = TYPE_BADGES[resource.type] || {
    label: resource.type,
    bg: 'bg-gray-100',
    text: 'text-gray-800',
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lab':
        return <Laptop className="w-4 h-4 text-blue-600" />;
      case 'study_room':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'court':
        return <Trophy className="w-4 h-4 text-orange-600" />;
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50/50 to-white">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
            >
              {getTypeIcon(resource.type)}
              {badge.label}
            </span>
            {!resource.is_active && (
              <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                Under Maintenance
              </span>
            )}
            {myBookingsCount > 0 && (
              <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                You booked {myBookingsCount} slot(s)
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
            {resource.name}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {resource.location}
          </p>
          {resource.description && (
            <p className="text-xs text-gray-600 mt-1.5 bg-gray-50/80 px-2.5 py-1 rounded-md border border-gray-100 max-w-2xl">
              {resource.description}
            </p>
          )}
        </div>

        <div className="text-left sm:text-right shrink-0">
          <div className="text-xs text-gray-500 font-medium">Availability Today</div>
          <div className="text-sm font-bold text-gray-800">
            <span className={availableCount > 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {availableCount}
            </span>
            <span className="text-gray-400 font-normal"> / 12 slots</span>
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="p-5">
        <div className="text-xs font-medium text-gray-500 mb-3 flex items-center justify-between">
          <span>Click any 1-hour slot (08:00 to 20:00) to book or join waitlist:</span>
        </div>

        <SlotGrid slots={slots} onSelectSlot={handleSelectSlot} />
      </div>

      {/* Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resource={resource}
        slot={selectedSlot}
        bookingDate={bookingDate}
        onSuccess={onRefresh}
      />
    </div>
  );
};
