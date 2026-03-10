-- Weekly leaderboard reset: set weekly_coins to 0 for all users (e.g. every Monday 00:00 UTC).
-- Requires pg_cron extension (enable in Supabase Dashboard if needed).
SELECT cron.schedule(
  'weekly-leaderboard-reset',
  '0 0 * * 1',
  $$ UPDATE user_profiles SET weekly_coins = 0; $$
);
