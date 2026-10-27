'use server';

import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { createSession, destroySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

const safeFailure = 'The request could not be completed. Check your connection and try again.';

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email and password.' };
  try {
    await connectDB();
    const user = await User.findOne({ email });
    if (!user?.password || !(await bcrypt.compare(password, user.password))) return { error: 'Invalid email or password.' };
    await createSession({ userId: user._id.toString(), name: user.name, email: user.email, role: user.role });
  } catch {
    return { error: safeFailure };
  }
  redirect('/');
}

export async function signup(formData: FormData) {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();
  if (!email || !password || !fullName) return { error: 'Please provide your full name, email, and password.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (fullName.length > 100) return { error: 'Name must be 100 characters or fewer.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };
  try {
    await connectDB();
    const hashedPassword = await bcrypt.hash(password, 10);
    // Public signup can only create student accounts; admin role assignment is not user-controlled.
    const newUser = await User.create({ name: fullName, email, password: hashedPassword, role: 'student' });
    await createSession({ userId: newUser._id.toString(), name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (error: any) {
    if (error?.code === 11000) return { error: 'An account with this email already exists.' };
    return { error: safeFailure };
  }
  redirect('/');
}

export async function logout() {
  await destroySession();
  redirect('/login');
}