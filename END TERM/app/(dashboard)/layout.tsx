import React from 'react';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { Notification } from '@/lib/models/Notification';
import { Navbar } from '@/components/Navbar';
import { NotificationItem } from '@/lib/types';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  let notifications: NotificationItem[] = [];

  try {
    await connectDB();
    const notifDocs = await Notification.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    notifications = notifDocs.map((n: any) => ({
      id: n._id.toString(),
      user_id: n.userId.toString(),
      message: n.message,
      is_read: n.isRead,
      created_at: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar profile={user} notifications={notifications} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        <p>SlotSync — Campus Resource Booking & Conflict Resolution</p>
      </footer>
    </div>
  );
}
