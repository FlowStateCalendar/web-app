-- Daily event generation: create events for "tomorrow" from each user's tasks.
-- Run via pg_cron at midnight UTC. Uses UTC for "tomorrow" and for matching task times.

CREATE OR REPLACE FUNCTION generate_events_for_tomorrow()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tomorrow_utc date := ((now() AT TIME ZONE 'UTC')::date + interval '1 day')::date;
  task_rec record;
  event_ts timestamptz;
BEGIN
  FOR task_rec IN
    SELECT t.id, t.user_profile_id, t.title, t.description, t.date, t.length, t.energy_cost, t.category, t.base_xp, t.base_coins
    FROM tasks t
    WHERE (
      (t.frequency = 'once' AND (t.date AT TIME ZONE 'UTC')::date = tomorrow_utc)
      OR (t.frequency = 'daily')
      OR (t.frequency = 'weekly' AND extract(dow from (t.date AT TIME ZONE 'UTC')) = extract(dow from tomorrow_utc))
      OR (t.frequency = 'monthly' AND extract(day from (t.date AT TIME ZONE 'UTC')) = extract(day from tomorrow_utc))
    )
  LOOP
    event_ts := (tomorrow_utc + (task_rec.date AT TIME ZONE 'UTC')::time) AT TIME ZONE 'UTC';
    INSERT INTO events (id, user_profile_id, task_id, title, description, date, length, energy_cost, category, base_xp, base_coins, created_at, updated_at)
    SELECT gen_random_uuid(), task_rec.user_profile_id, task_rec.id, task_rec.title, COALESCE(task_rec.description, ''), event_ts, task_rec.length, task_rec.energy_cost, task_rec.category, task_rec.base_xp, task_rec.base_coins, now(), now()
    WHERE NOT EXISTS (
      SELECT 1 FROM events e WHERE e.task_id = task_rec.id AND (e.date AT TIME ZONE 'UTC')::date = tomorrow_utc
    );
  END LOOP;
END;
$$;

-- Run every day at midnight UTC.
SELECT cron.schedule(
  'daily-event-generation',
  '0 0 * * *',
  $$ SELECT generate_events_for_tomorrow(); $$
);
