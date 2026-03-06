# Supabase backend logic (Plan 2)

This folder contains **code to be deployed to Supabase** to replace the business logic currently in the iOS app. **No iOS code has been removed**; this is additive. Once these Edge Functions are deployed and tested, the web app and iOS app can be updated to call them instead of doing reward/completion logic locally.

## Layout

- **`functions/_shared/`** – Shared TypeScript modules (reward calculation, XP/level, date utils). Mirrors the Swift services; can be reused by other Edge Functions.
- **`functions/complete-event/`** – Self-contained Edge Function that implements the full “complete event” flow. Imports from local files in the same folder so it deploys without depending on `_shared` (Supabase deploys each function directory).
- **`functions/shop-purchase/`** – Edge Function for aquarium shop: validates and applies a purchase (deduct coins, add fish/accessory/tank). Used by Plan 3 web app shop.

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
# Deploy both Edge Functions
supabase functions deploy complete-event
supabase functions deploy shop-purchase
```

Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set in the Edge Function secrets (or project env).

## Next steps (not done yet)

- Deploy `complete-event` and test with the web app (switch Completing Task to call this function instead of client-side Supabase writes).
- Deploy `shop-purchase` and add Shop UI on web app that calls it (Plan 3).
- Optionally add more Edge Functions (e.g. compute-rewards for UI preview, weekly-reset cron).
- Later: refactor iOS to call `complete-event` and optionally `shop-purchase` from the app.
