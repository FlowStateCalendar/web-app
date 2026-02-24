/**
 * Date utilities for Supabase Edge Functions.
 * Mirrors: Calendar-iOS Flowstate Calendar/Users/Utils/UserDateUtils.swift
 */

export function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function isTodayUTC(date: Date): boolean {
  const today = startOfDayUTC(new Date());
  const d = startOfDayUTC(date);
  return d.getTime() === today.getTime();
}

export function toISO8601(date: Date): string {
  return date.toISOString();
}
