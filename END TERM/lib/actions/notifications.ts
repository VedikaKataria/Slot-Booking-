'use server';

import { connectDB } from '@/lib/db/mongodb';
import { Notification } from '@/lib/models/Notification';
import { getSessionUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function markNotificationAsRead(id: string) {
  const user = await getSessionUser();
  if (!user) return { success: false };

  try {
    await connectDB();
    await Notification.findOneAndUpdate(
      { _id: id, userId: user.id },
      { isRead: true }
    );
    revalidatePath('/', 'layout');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markAllNotificationsAsRead() {
  const user = await getSessionUser();
  if (!user) return { success: false };

  try {
    await connectDB();
    await Notification.updateMany(
      { userId: user.id, isRead: false },
      { isRead: true }
    );
    revalidatePath('/', 'layout');
    return { success: true };
  } catch {
    return { success: false };
  }
}
