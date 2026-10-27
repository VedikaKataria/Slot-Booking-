'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

interface CatalogFilterBarProps {
  currentType: string;
  currentSearch: string;
}

export const CatalogFilterBar: React.FC<CatalogFilterBarProps> = ({
  currentType,
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

  const clearFilters = () => {
    router.push(pathname);
  };

  const types = [
    { id: 'all', label: 'All Resources' },
    { id: 'lab', label: 'Labs' },
    { id: 'study_room', label: 'Study Rooms' },
    { id: 'court', label: 'Sports Courts' },
  ];

  const hasActiveFilters = currentType !== 'all' || currentSearch.trim() !== '';

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Search by facility name, building, or room..."
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 hover:bg-white transition-colors"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0 mr-1 font-medium">
          <Filter className="w-3.5 h-3.5" /> Filter by:
        </span>
        {types.map((t) => {
          const isActive = currentType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => updateParam('type', t.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
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
