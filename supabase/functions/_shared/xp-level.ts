/**
 * XP and level logic (required XP per level, level from XP, daily cap).
 * Mirrors: Calendar-iOS Flowstate Calendar/App/Services/Utilities/UserXPLevelService.swift
 * Used by complete-event Edge Function for level-up and daily XP cap.
 */

const BASE_XP = 100;
const GROWTH_FACTOR = 1.14;

/** Default daily XP cap (from UserXPLevelService.hasReachedDailyXPCap). */
export const DAILY_XP_CAP = 200;

/**
 * XP required to reach the given level (exponential curve).
 * level 1 -> 100, level 2 -> 114, etc.
 */
export function requiredXPForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(GROWTH_FACTOR, level - 1));
}

/**
 * Level derived from total XP (canonical level-for-XP).
 */
export function levelForXP(totalXP: number): number {
  let level = 1;
  let remainingXP = totalXP;
  while (remainingXP >= requiredXPForLevel(level)) {
    remainingXP -= requiredXPForLevel(level);
    level += 1;
  }
  return level;
}

/**
 * Apply level-up logic: given current level and new total XP, return new level.
 * (iOS TaskCompletionService uses a simpler level * 100 check; UserXPLevelService uses
 * requiredXP/levelForXP. We use UserXPLevelService's curve for consistency.)
 */
export function resolveLevelAfterXP(currentLevel: number, totalXP: number): number {
  return levelForXP(totalXP);
}
