// Minimal reward calculation for task creation (match iOS RewardCalculationService.baseXP/baseCoins)
const FREQUENCY_BONUS_XP: Record<string, number> = {
  once: 5,
  daily: 0,
  weekly: 10,
  monthly: 20,
};
const FREQUENCY_BONUS_COINS: Record<string, number> = {
  once: 2,
  daily: 0,
  weekly: 4,
  monthly: 8,
};

export function baseXPForTask(frequency: string, energy: number): number {
  const base = 10;
  const energyFactor = energy;
  const bonus = FREQUENCY_BONUS_XP[frequency] ?? 0;
  return Math.min(100, Math.max(5, base + energyFactor * 5 + bonus));
}

export function baseCoinsForTask(frequency: string, energy: number): number {
  const base = 2;
  const energyFactor = energy;
  const bonus = FREQUENCY_BONUS_COINS[frequency] ?? 0;
  return Math.min(30, Math.max(1, base + energyFactor * 2 + bonus));
}

export const TASK_CATEGORIES = ["work", "personal", "health", "learning", "other"] as const;
export const TASK_FREQUENCIES = ["once", "daily", "weekly", "monthly"] as const;
