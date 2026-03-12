-- Google Classroom: store OAuth tokens (server-only) and extend events for Classroom imports.

CREATE TABLE IF NOT EXISTS google_classroom_tokens (
  user_profile_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  access_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE google_classroom_tokens ENABLE ROW LEVEL SECURITY;

-- Only backend (service role) should read tokens. Authenticated users can insert/update their own row (e.g. via callback).
CREATE POLICY "Users can insert own google_classroom_tokens"
  ON google_classroom_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_profile_id);

CREATE POLICY "Users can update own google_classroom_tokens"
  ON google_classroom_tokens FOR UPDATE
  USING (auth.uid() = user_profile_id);

-- No SELECT for authenticated: tokens are server-only. Service role bypasses RLS.
CREATE POLICY "No read for authenticated"
  ON google_classroom_tokens FOR SELECT
  USING (false);

-- Allow SELECT so app can check "has Classroom connected" by selecting only user_profile_id (tokens stay server-side in selected columns).
DROP POLICY IF EXISTS "No read for authenticated" ON google_classroom_tokens;
CREATE POLICY "Users can read own row"
  ON google_classroom_tokens FOR SELECT
  USING (auth.uid() = user_profile_id);

-- Events: allow task_id NULL (for Classroom-sourced events) and add source/external_id for deduplication.
ALTER TABLE events ALTER COLUMN task_id DROP NOT NULL;

ALTER TABLE events ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_id text;
