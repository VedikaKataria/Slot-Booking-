'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Calendar, Filter } from 'lucide-react';
import { getTodayDateString } from '@/lib/constants';

interface ResourceFilterBarProps {
  currentType: string;
  currentDate: string;
  currentSearch: string;
}

export const ResourceFilterBar: React.FC<ResourceFilterBarProps> = ({
  currentType,
  currentDate,
  currentSearch,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const types = [
    { id: 'all', label: 'All Resources' },
    { id: 'lab', label: 'Labs' },
    { id: 'study_room', label: 'Study Rooms' },
    { id: 'court', label: 'Courts' },
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Search resources by name, type, or building..."
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 whitespace-nowrap">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Select Date:</span>
          </div>
          <input
            type="date"
            min={getTodayDateString()}
            value={currentDate}
            onChange={(e) => updateParam('date', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" /> Type:
        </span>
        {types.map((t) => {
          const isActive = currentType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => updateParam('type', t.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
