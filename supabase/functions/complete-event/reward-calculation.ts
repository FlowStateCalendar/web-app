/**
 * Reward calculation. Mirrors: RewardCalculationService.swift
 */

export type TaskFrequency = "once" | "daily" | "weekly" | "monthly";

const FREQUENCY_BONUS_XP: Record<TaskFrequency, number> = {
  once: 5,
  daily: 0,
  weekly: 10,
  monthly: 20,
};

const FREQUENCY_BONUS_COINS: Record<TaskFrequency, number> = {
  once: 2,
  daily: 0,
  weekly: 4,
  monthly: 8,
};

export function baseXP(rewardFrequency: TaskFrequency, rewardEnergy: number): number {
  const base = 10;
  const raw = base + rewardEnergy * 5 + (FREQUENCY_BONUS_XP[rewardFrequency] ?? 0);
  return Math.min(100, Math.max(5, raw));
}

export function baseCoins(rewardFrequency: TaskFrequency, rewardEnergy: number): number {
  const base = 2;
  const raw = base + rewardEnergy * 2 + (FREQUENCY_BONUS_COINS[rewardFrequency] ?? 0);
  return Math.min(30, Math.max(1, raw));
}

export function finalXP(
  baseXPVal: number,
  rewardLengthSeconds: number,
  completion: number = 1.0,
  userMultiplier: number = 1.0
): number {
  const lengthFactor = Math.floor(rewardLengthSeconds / 60 / 15);
  const total =
    (baseXPVal + lengthFactor * 5) * userMultiplier * Math.min(Math.max(completion, 0), 1);
  return Math.min(100, Math.max(0, Math.floor(total)));
}

export function finalCoins(
  baseCoinsVal: number,
  rewardLengthSeconds: number,
  completion: number = 1.0,
  userMultiplier: number = 1.0
): number {
  const lengthFactor = Math.floor(rewardLengthSeconds / 60 / 30);
  const total =
    (baseCoinsVal + lengthFactor * 2) * userMultiplier * Math.min(Math.max(completion, 0), 1);
  return Math.min(30, Math.max(0, Math.floor(total)));
}

export type EventForReward = {
  base_xp: number;
  base_coins: number;
  length: number;
};

export function xpForEvent(
  event: EventForReward,
  completion: number = 1.0,
  userMultiplier: number = 1.0
): number {
  return finalXP(event.base_xp, event.length, completion, userMultiplier);
}

export function coinsForEvent(
  event: EventForReward,
  completion: number = 1.0,
  userMultiplier: number = 1.0
): number {
  return finalCoins(event.base_coins, event.length, completion, userMultiplier);
}
