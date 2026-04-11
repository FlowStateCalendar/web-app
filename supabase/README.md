# Supabase backend logic (Plan 2)

This folder contains **code to be deployed to Supabase** to replace the business logic currently in the iOS app. **No iOS code has been removed**; this is additive. Once these Edge Functions are deployed and tested, the web app and iOS app can be updated to call them instead of doing reward/completion logic locally.

## Layout

- **`functions/_shared/`** – Shared TypeScript modules (reward calculation, XP/level, date utils). Mirrors the Swift services; can be reused by other Edge Functions.
- **`functions/complete-event/`** – Self-contained Edge Function that implements the full “complete event” flow. Imports from local files in the same folder so it deploys without depending on `_shared` (Supabase deploys each function directory).
- **`functions/shop-purchase/`** – Edge Function for aquarium shop: validates and applies a purchase (deduct coins, add fish/accessory/tank). Used by Plan 3 web app shop.
- **`functions/task-create/`**, **`functions/task-update/`**, **`functions/task-delete/`** – Task CRUD; server computes base_xp/base_coins. Used by NewTaskForm and TasksList.
- **`functions/user-profile-ensure/`**, **`functions/user-profile-update/`** – Profile upsert and partial update (name, profile_picture). Used by Settings and UserBar.
- **`functions/daily-aquarium-upkeep/`** – Cron-invoked (no user JWT): daily clean_level decrease and fish health decay when last_feed &gt; 24h. Schedule via pg_cron + pg_net; set CRON_SECRET in Edge Function secrets.

## iOS sources mirrored

| This code | iOS source |
|-----------|------------|
| `_shared/reward-calculation.ts` + `complete-event/reward-calculation.ts` | `Flowstate Calendar/App/Services/Utilities/RewardCalculationService.swift` |
| `_shared/xp-level.ts` + `complete-event/xp-level.ts` | `Flowstate Calendar/App/Services/Utilities/UserXPLevelService.swift` |
| `_shared/date-utils.ts` + `complete-event/date-utils.ts` | `Flowstate Calendar/Users/Utils/UserDateUtils.swift` |
| `complete-event/index.ts` flow | `Flowstate Calendar/App/Services/Utilities/TaskCompletionService.swift` + completion flow |

## complete-event Edge Function

- **Endpoint:** `POST /functions/v1/complete-event`
- **Body:** `{ "eventId": "uuid", "completionPercentage": 0.0–1.0 }`
- **Auth:** `Authorization: Bearer <user JWT>`. User may only complete their own events (`user_profile_id` must match).
- **Behaviour:**
  1. Validates session and body.
  2. Loads event; ensures it belongs to the authenticated user.
  3. Computes XP/coins (reward-calculation), applies daily XP cap (xp-level, date-utils).
  4. Inserts into `completed_events`.
  5. Updates `user_profiles` (xp, level, coins, weekly_coins, xp_earned_today, last_xp_award_date).
  6. If completion ≥ 1.0, deletes the event from `events`.
  7. Returns new user stats and rewards.

Uses **service role** client so it can write to `user_profiles`, `completed_events`, and `events`; permission is enforced by checking `event.user_profile_id === userId` from the JWT.

---

## shop-purchase Edge Function (Plan 3)

- **Endpoint:** `POST /functions/v1/shop-purchase`
- **Body:** `{ "itemKey": "tropical_fish" }` (see `functions/shop-purchase/catalog.ts` for all keys).
- **Auth:** `Authorization: Bearer <user JWT>`. User may only spend their own coins; aquarium must belong to user.
- **Behaviour:**
  1. Validates JWT and loads catalog item by `itemKey`.
  2. Checks user has enough coins; for tanks, checks not already owned.
  3. Deducts coins from `user_profiles`.
  4. Updates `aquariums`: appends fish/accessory to JSON or adds tank to `owned_tanks`; for new tank, sets `tank_type` to the purchased tank.
  5. Returns `{ ok, itemKey, name, newCoins, user: { coins } }`.

Catalog keys (examples): `tropical_fish`, `blue_tang`, `clownfish`, `angelfish`, `seaweed`, `rock_cave`, `coral`, `bubble_stone`, `small_tank`, `medium_tank`, `large_tank`.

## Deploying

From the **web-app** repo root (parent of `supabase/`):

```bash
# Deploy all Edge Functions
supabase functions deploy complete-event
supabase functions deploy shop-purchase
supabase functions deploy task-create
supabase functions deploy task-update
supabase functions deploy task-delete
supabase functions deploy user-profile-ensure
supabase functions deploy user-profile-update
supabase functions deploy daily-aquarium-upkeep
```

Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set in the Edge Function secrets (or project env). For **daily-aquarium-upkeep**, set **CRON_SECRET** so only your cron job can invoke it.

**Time-based jobs (pg_cron):**

- **Weekly leaderboard reset:** Applied by migration `20250307000002_weekly_leaderboard_reset_cron.sql` (resets `user_profiles.weekly_coins` every Monday 00:00 UTC). Requires pg_cron.
- **Daily aquarium upkeep:** Deploy `daily-aquarium-upkeep`, set CRON_SECRET, then run the `cron.schedule` + `net.http_post` SQL once in the SQL Editor (see [docs/EDGE-FUNCTIONS-IMPLEMENTATION.md](../docs/EDGE-FUNCTIONS-IMPLEMENTATION.md)). Requires pg_net.

## Profile defaults (optional ops)

- After changing `user-profile-ensure` to default `profile_picture` to `OrangeFish` on insert, **redeploy** that function: `supabase functions deploy user-profile-ensure`.
- Optional one-time SQL for analytics parity with older rows: `update user_profiles set profile_picture = 'OrangeFish' where profile_picture is null;`

## Next steps

- Web app uses `complete-event`, `shop-purchase`, `task-create`, `task-update`, `task-delete`, and `user-profile-update`; deploy all and set service role secret if needed.
- Run migrations for `last_feed` and weekly leaderboard cron; schedule daily-aquarium-upkeep via SQL Editor with your project ref and CRON_SECRET.
- Later: refactor iOS to call these Edge Functions from the app.
