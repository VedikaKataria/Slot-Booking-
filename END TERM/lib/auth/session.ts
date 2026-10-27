import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Profile } from '@/lib/types';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
}
const SECRET_KEY = new TextEncoder().encode(jwtSecret);

const COOKIE_NAME = 'slotsync_session';

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

/**
 * Creates and signs a JWT for the user session
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

/**
 * Verifies the JWT and returns the payload (usable in middleware and server components)
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Sets session cookie after successful login or signup
 */
export async function createSession(payload: SessionPayload) {
  const token = await signToken(payload);
  const cookieStore = cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Gets the current authenticated user from cookie
 */
export async function getSessionUser(): Promise<Profile | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    full_name: payload.name,
    role: payload.role,
    created_at: '',
  };
}

/**
 * Destroys session by clearing the cookie
 */
export async function destroySession() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
