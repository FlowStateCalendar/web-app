/**
 * Date utilities for Supabase Edge Functions.
 * Mirrors: Calendar-iOS Flowstate Calendar/Users/Utils/UserDateUtils.swift
 * Used for daily XP reset (start of day, is today).
 */

/**
 * Start of day in UTC (midnight 00:00:00.000).
 */
export function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Whether the given date is "today" in UTC.
 */
export function isTodayUTC(date: Date): boolean {
  const today = startOfDayUTC(new Date());
  const d = startOfDayUTC(date);
  return d.getTime() === today.getTime();
}

/**
 * ISO8601 string for Supabase timestamps.
 */
export function toISO8601(date: Date): string {
  return date.toISOString();
}
