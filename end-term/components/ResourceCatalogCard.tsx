'use client';

import React from 'react';
import Link from 'next/link';
import { Resource } from '@/lib/types';
import { TYPE_BADGES } from '@/lib/constants';
import { Button } from './ui/Button';
import { MapPin, ArrowRight, Laptop, BookOpen, Trophy, AlertTriangle } from 'lucide-react';

interface ResourceCatalogCardProps {
  resource: Resource;
}

export const ResourceCatalogCard: React.FC<ResourceCatalogCardProps> = ({ resource }) => {
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

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all duration-200 group">
      <div className="p-6 space-y-4">
        {/* Type & Active status */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
          >
            {getTypeIcon(resource.type)}
            {badge.label}
          </span>

          {!resource.is_active ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              <AlertTriangle className="w-3 h-3" /> Maintenance
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Open
            </span>
          )}
        </div>

        {/* Title & Location */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {resource.name}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{resource.location}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50/60 p-2.5 rounded-lg border border-gray-100">
          {resource.description || 'Campus facility available for student reservations.'}
        </p>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-500">
          Daily slots: 08:00 - 20:00
        </span>
        <Link href={`/resources/${resource.id}`}>
          <Button size="sm" variant={resource.is_active ? 'primary' : 'outline'}>
            <span>View Slots</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
