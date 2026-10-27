import { ResourceType } from './types';

// Campus operating hours: 8:00 to 20:00 (12 one-hour slots)
export const OPERATING_START_HOUR = 8;
export const OPERATING_END_HOUR = 20;

export const SLOT_HOURS = Array.from(
  { length: OPERATING_END_HOUR - OPERATING_START_HOUR },
  (_, i) => OPERATING_START_HOUR + i
); // [8, 9, ..., 19]

export const MAX_CONFIRMED_BOOKINGS_PER_DAY = 2;

export const TYPE_LABELS: Record<ResourceType, string> = {
  lab: 'Computer & Science Labs',
  study_room: 'Quiet Study Rooms',
  court: 'Sports Courts',
};

export const TYPE_BADGES: Record<
  ResourceType,
  { label: string; bg: string; text: string }
> = {
  lab: { label: 'Lab', bg: 'bg-blue-100', text: 'text-blue-800' },
  study_room: { label: 'Study Room', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  court: { label: 'Court', bg: 'bg-orange-100', text: 'text-orange-800' },
};

/**
 * Formats start hour into human-friendly slot text
 * e.g., 8 -> "08:00 - 09:00"
 */
export function formatSlotLabel(hour: number): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hour)}:00 - ${pad(hour + 1)}:00`;
}

/**
 * Returns today's date in YYYY-MM-DD local format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a slot is in the past compared to current local time
 */
export function isSlotInPast(bookingDate: string, hour: number): boolean {
  const now = new Date();
  const [year, month, day] = bookingDate.split('-').map(Number);
  const slotDate = new Date(year, month - 1, day, hour, 0, 0, 0);
  return slotDate.getTime() <= now.getTime();
}
