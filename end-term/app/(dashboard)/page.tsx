import React from 'react';
import { connectDB } from '@/lib/db/mongodb';
import { ensureSeedResources } from '@/lib/db/seed';
import { Resource as ResourceModel } from '@/lib/models/Resource';
import { CatalogFilterBar } from '@/components/CatalogFilterBar';
import { ResourceCatalogCard } from '@/components/ResourceCatalogCard';
import { Resource } from '@/lib/types';
import { AlertCircle, CalendarClock } from 'lucide-react';

interface HomePageProps {
  searchParams: {
    type?: string;
    search?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const selectedType = searchParams.type || 'all';
  const searchQuery = searchParams.search || '';

  let resources: Resource[] = [];
  let errorMessage: string | null = null;

  try {
    await connectDB();
    // Auto-seed sample resources if collection is empty
    await ensureSeedResources();

    // Requirement: Deactivated resources must disappear from the student view
    const filter: any = { isActive: true };

    if (selectedType !== 'all') {
      filter.type = selectedType;
    }
    if (searchQuery.trim()) {
      filter.$or = [
        { name: { $regex: searchQuery.trim(), $options: 'i' } },
        { location: { $regex: searchQuery.trim(), $options: 'i' } },
        { description: { $regex: searchQuery.trim(), $options: 'i' } },
      ];
    }

    const resourcesDocs = await ResourceModel.find(filter)
      .sort({ isActive: -1, createdAt: 1 })
      .lean();

    resources = resourcesDocs.map((r: any) => ({
      id: r._id.toString(),
      name: r.name,
      type: r.type,
      location: r.location,
      description: r.description,
      is_active: r.isActive,
    }));
  } catch (error: any) {
    errorMessage = error.message || 'Failed to connect to the database.';
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Campus Facilities & Resources
        </h1>
        <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">
          Browse lab workstations, quiet study spaces, and sports facilities. Click on any resource to view live hourly availability and reserve your slot.
        </p>
      </div>

      {/* Type Filter & Search Box */}
      <CatalogFilterBar
        currentType={selectedType}
        currentSearch={searchQuery}
      />

      {/* Error State */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading facilities: {errorMessage}</span>
        </div>
      )}

      {/* Empty State */}
      {resources.length === 0 && !errorMessage ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CalendarClock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No facilities match your search</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try clearing your filters or searching with different keywords like &quot;lab&quot;, &quot;library&quot;, or &quot;court&quot;.
          </p>
        </div>
      ) : (
        /* Resource Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <ResourceCatalogCard key={res.id} resource={res} />
          ))}
        </div>
      )}
    </div>
  );
}
