-- Cross-platform reminders: extend user_settings, push subscription tables, idempotency ledger.
-- Service role writes notification_deliveries; end users manage only their push rows.

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS email_reminders_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_web_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_ios_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS push_subscriptions_web (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_profile_id, endpoint)
);

CREATE TABLE IF NOT EXISTS push_subscriptions_ios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_token text NOT NULL,
  app_version text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_profile_id, device_token)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_ios_user ON push_subscriptions_ios(user_profile_id);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  idempotency_key text PRIMARY KEY,
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  channel text NOT NULL,
  event_id uuid,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_sent ON notification_deliveries(user_profile_id, sent_at);

ALTER TABLE push_subscriptions_web ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions_ios ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Web push: users manage own subscriptions
CREATE POLICY "Users manage own web push subscriptions"
  ON push_subscriptions_web FOR ALL
  USING (auth.uid() = user_profile_id)
  WITH CHECK (auth.uid() = user_profile_id);

-- iOS push tokens
CREATE POLICY "Users manage own ios push subscriptions"
  ON push_subscriptions_ios FOR ALL
  USING (auth.uid() = user_profile_id)
  WITH CHECK (auth.uid() = user_profile_id);

-- Idempotency ledger: only service role (no user policies)
CREATE POLICY "No user access to notification_deliveries"
  ON notification_deliveries FOR ALL
  USING (false)
  WITH CHECK (false);
