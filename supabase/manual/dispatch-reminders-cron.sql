-- Schedule dispatch-reminders every 5 minutes (pg_cron + pg_net).
-- Run once in Supabase SQL Editor after:
--   1. Enable extensions: pg_cron, pg_net (Dashboard → Database → Extensions).
--   2. Deploy dispatch-reminders Edge Function and set CRON_SECRET (same as daily-aquarium-upkeep).
--   3. Replace YOUR_PROJECT_REF and YOUR_CRON_SECRET.
--
-- To unschedule: SELECT cron.unschedule('dispatch-reminders');

SELECT cron.schedule(
  'dispatch-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zgelovnhoobwtvmkrebc.supabase.co/functions/v1/dispatch-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', '9ijneviuy34uiob23oihb5ouh6b'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
