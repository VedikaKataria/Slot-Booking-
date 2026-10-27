'use server';

import { connectDB } from '@/lib/db/mongodb';
import { Resource, ResourceType } from '@/lib/models/Resource';
import { getSessionUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

const validTypes: ResourceType[] = ['lab', 'study_room', 'court'];
const requestFailure = 'The request could not be completed. Check your connection and try again.';

export async function createResource(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return { success: false, message: 'Unauthorized: Only admins can create resources.' };
  }

  const name = (formData.get('name') as string)?.trim();
  const type = formData.get('type') as ResourceType;
  const location = (formData.get('location') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || '';

  if (!name || name.length > 120 || !validTypes.includes(type) || !location || location.length > 200 || description.length > 1000) {
    return { success: false, message: 'Enter a name (up to 120 characters), valid type, location (up to 200 characters), and description (up to 1,000 characters).' };
  }

  try {
    await connectDB();
    await Resource.create({
      name,
      type,
      location,
      description,
      isActive: true,
    });

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: 'Resource created successfully!' };
  } catch (error: any) {
    return { success: false, message: requestFailure };
  }
}

export async function updateResource(formData: FormData) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return { success: false, message: 'Unauthorized: Only admins can edit resources.' };
  }

  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const type = formData.get('type') as ResourceType;
  const location = (formData.get('location') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || '';

  if (!mongoose.Types.ObjectId.isValid(id) || !name || name.length > 120 || !validTypes.includes(type) || !location || location.length > 200 || description.length > 1000) {
    return { success: false, message: 'Enter a valid resource ID, name, type, and location.' };
  }

  try {
    await connectDB();
    const updated = await Resource.findByIdAndUpdate(
      id,
      { name, type, location, description },
      { new: true }
    );

    if (!updated) {
      return { success: false, message: 'Resource not found.' };
    }

    revalidatePath('/');
    revalidatePath(`/resources/${id}`);
    revalidatePath('/admin');
    return { success: true, message: 'Resource updated successfully!' };
  } catch (error: any) {
    return { success: false, message: requestFailure };
  }
}

export async function toggleResourceStatus(
  resourceId: string,
  currentStatus: boolean
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return { success: false, message: 'Unauthorized: Only admins can modify resources.' };
  }

  if (!mongoose.Types.ObjectId.isValid(resourceId)) return { success: false, message: 'Invalid resource identifier.' };

  try {
    await connectDB();
    const newStatus = !currentStatus;
    const updated = await Resource.findByIdAndUpdate(resourceId, { isActive: newStatus });
    if (!updated) return { success: false, message: 'Resource not found.' };
    revalidatePath('/');
    revalidatePath(`/resources/${resourceId}`);
    revalidatePath('/admin');
    return {
      success: true,
      message: newStatus
        ? 'Resource activated and now visible to students.'
        : 'Resource deactivated and hidden from students.',
    };
  } catch (error: any) {
    return { success: false, message: requestFailure };
  }
}
