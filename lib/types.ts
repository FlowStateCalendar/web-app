// Shared types aligned with Supabase schema (snake_case from DB)

export type UserProfile = {
  id: string;
  name: string;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
  xp: number;
  level: number;
  coins: number;
  weekly_coins: number;
  xp_earned_today: number;
  last_xp_award_date: string | null;
};

export type TaskRow = {
  id: string;
  user_profile_id: string;
  title: string;
  description: string;
  length: number;
  category: string;
  frequency: string;
  date: string;
  energy_cost: number;
  base_xp: number;
  base_coins: number;
  created_at: string;
  updated_at: string;
};

export type EventRow = {
  id: string;
  user_profile_id: string;
  task_id: string;
  title: string;
  description: string;
  date: string;
  length: number;
  energy_cost: number;
  category: string;
  base_xp: number;
  base_coins: number;
  created_at: string;
  updated_at: string;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  weekly_coins: number;
};

export type AquariumRow = {
  id: string;
  user_profile_id: string;
  title: string;
  tank_type: string;
  clean_level: number;
  created_at: string;
  updated_at: string;
};
