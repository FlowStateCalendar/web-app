/**
 * XP/level logic. Mirrors: UserXPLevelService.swift
 */

const BASE_XP = 100;
const GROWTH_FACTOR = 1.14;

export const DAILY_XP_CAP = 200;

export function requiredXPForLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(GROWTH_FACTOR, level - 1));
}

export function levelForXP(totalXP: number): number {
  let level = 1;
  let remainingXP = totalXP;
  while (remainingXP >= requiredXPForLevel(level)) {
    remainingXP -= requiredXPForLevel(level);
    level += 1;
  }
  return level;
}
