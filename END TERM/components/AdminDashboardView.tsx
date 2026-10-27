'use client';

import React, { useState, useMemo } from 'react';
import { Resource, Booking } from '@/lib/types';
import { TYPE_BADGES, formatSlotLabel } from '@/lib/constants';
import { toggleResourceStatus } from '@/lib/actions/resources';
import { cancelBooking } from '@/lib/actions/bookings';
import { AdminResourceModal } from './AdminResourceModal';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import {
  Plus,
  Power,
  PowerOff,
  Edit,
  Calendar,
  Building,
  CheckCircle2,
  TrendingUp,
  Clock,
  Filter,
  X,
  User,
} from 'lucide-react';

interface AdminDashboardViewProps {
  resources: Resource[];
  bookings: (Booking & { user?: { full_name: string } })[];
  stats: {
    totalBookings: number;
    mostBookedResource: string;
    bookingsToday: number;
  };
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  resources,
  bookings,
  stats,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bookings filter states
  const [filterResourceId, setFilterResourceId] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const handleOpenAdd = () => {
    setEditingResource(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setEditingResource(res);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (resourceId: string, currentStatus: boolean) => {
    setIsToggling(resourceId);
    setFeedback(null);

    try {
      const res = await toggleResourceStatus(resourceId, currentStatus);
      setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    } catch {
      setFeedback({ type: 'error', message: 'Unable to update the facility. Check your connection and try again.' });
    } finally {
      setIsToggling(null);
    }
  };

  const handleAdminCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? If there is an eligible waitlist entry, it will automatically be promoted.')) {
      return;
    }
    setFeedback(null);
    try {
      const res = await cancelBooking(bookingId);
      setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    } catch {
      setFeedback({ type: 'error', message: 'Unable to cancel the booking. Check your connection and try again.' });
    }
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesResource =
        filterResourceId === 'all' ||
        b.resource_id === filterResourceId ||
        b.resource?.id === filterResourceId;

      const matchesDate = !filterDate || b.booking_date === filterDate;

      return matchesResource && matchesDate;
    });
  }, [bookings, filterResourceId, filterDate]);

  return (
    <div className="space-y-8">
      {feedback && (
        <Alert type={feedback.type} title={feedback.type === 'success' ? 'Confirmed' : 'Error'}>
          {feedback.message}
        </Alert>
      )}

      {/* 1. THREE SIMPLE STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Total Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Bookings
            </span>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {stats.totalBookings}
            </p>
          </div>
        </div>

        {/* Stat 2: Most Booked Resource */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Most Booked Facility
            </span>
            <p className="text-sm font-bold text-gray-900 mt-1 truncate" title={stats.mostBookedResource}>
              {stats.mostBookedResource}
            </p>
          </div>
        </div>

        {/* Stat 3: Bookings Today */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Bookings Today
            </span>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {stats.bookingsToday}
            </p>
          </div>
        </div>
      </section>

      {/* 2. RESOURCE MANAGEMENT (ADD, EDIT, DEACTIVATE) */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Campus Facilities Management</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Add, edit, or deactivate resources. Deactivated resources instantly disappear from the student view.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="sm:self-auto self-start">
            <Plus className="w-4 h-4 mr-1.5" /> Add Facility
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-y border-gray-200 text-gray-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {resources.map((res) => {
                const badge = TYPE_BADGES[res.type];
                return (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {res.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge?.bg} ${badge?.text}`}
                      >
                        {badge?.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{res.location}</td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                      {res.description || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {res.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Active (Visible)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-semibold">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          Deactivated (Hidden)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(res)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                          title="Edit Details"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        {/* Deactivate / Activate Button */}
                        <button
                          onClick={() => handleToggleStatus(res.id, res.is_active)}
                          disabled={isToggling === res.id}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                            res.is_active
                              ? 'text-rose-700 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {res.is_active ? (
                            <>
                              <PowerOff className="w-3.5 h-3.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="w-3.5 h-3.5" /> Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. VIEW ALL BOOKINGS WITH FILTERS & ADMIN CANCELLATION */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Campus Reservations Feed</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live audit of student bookings. Admins can cancel any reservation to trigger waitlist auto-promotion.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
            Showing {filteredBookings.length} of {bookings.length} reservations
          </span>
        </div>

        {/* Filters by Resource and Date */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filters:
            </span>

            {/* Filter by Resource */}
            <select
              value={filterResourceId}
              onChange={(e) => setFilterResourceId(e.target.value)}
              className="text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Facilities</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Filter by Date */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-xs bg-transparent focus:outline-none text-gray-700"
              />
            </div>

            {(filterResourceId !== 'all' || filterDate) && (
              <button
                onClick={() => {
                  setFilterResourceId('all');
                  setFilterDate('');
                }}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl space-y-1">
            <p className="font-semibold text-gray-700">No matching reservations found</p>
            <p>Try adjusting your facility or date filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-y border-gray-200 text-gray-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {b.user?.full_name || 'Student'}
                    </td>
                    <td className="py-3.5 px-4 font-medium">{b.resource?.name}</td>
                    <td className="py-3.5 px-4 font-mono">{b.booking_date}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700">
                      {formatSlotLabel(b.hour)}
                    </td>
                    <td className="py-3.5 px-4">
                      {b.status === 'confirmed' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                          Confirmed
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.status === 'confirmed' ? (
                        <button
                          onClick={() => handleAdminCancel(b.id)}
                          className="text-red-600 hover:text-red-800 font-bold hover:underline text-xs"
                        >
                          Cancel Booking
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Admin Add / Edit Resource Modal */}
      <AdminResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resourceToEdit={editingResource}
      />
    </div>
  );
};
