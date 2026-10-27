import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DetailLoading() {
  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      <Skeleton className="h-4 w-36" />

      {/* Header Card Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-2 w-2/3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-16 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      {/* Slots Section Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
