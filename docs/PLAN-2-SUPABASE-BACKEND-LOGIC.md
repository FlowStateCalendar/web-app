# Plan 2: Moving Business Logic to Supabase

Reference document for moving reward, level, and task-completion logic from the iOS app into Supabase so both the web app and iOS share one backend. Use this when implementing Edge Functions and refactoring clients.

---

## Overview

- **Goal:** Backend owns business logic; clients (iOS and web) only display UI, capture input, and call APIs. No permission or reward rules in the client.
- **Where logic lives today:** Swift services in the iOS app (RewardCalculationService, UserXPLevelService, TaskCompletionService, etc.).
- **Where it will live:** Supabase Edge Functions (and optionally Postgres functions called by them). Same Supabase project and database; no schema change required for the core flow.

---

## 1. Principles

- **Server decides:** Validation, rewards, level-up, and permissions are enforced in Supabase (Edge Functions + RLS).
- **Clients call APIs:** iOS and web call the same Edge Functions; no duplicate formulas or rules in Swift/TypeScript.
- **RLS unchanged:** Keep existing Row Level Security; Edge Functions use the service role only where needed; clients continue to use the anon key with JWT.

---

## 2. Logic to move

### 2.1 Reward and level calculations

**Current iOS location:**

- `Flowstate Calendar/App/Services/Utilities/RewardCalculationService.swift`
  - `baseXP(rewardFrequency, rewardEnergy)`, `baseCoins(...)`
  - `finalXP(baseXP, rewardLength, completion, userMultiplier)`, `finalCoins(...)`
  - `xpForEvent`, `coinsForEvent`, `xpForTask`, `coinsForTask`
- `Flowstate Calendar/App/Services/Utilities/UserXPLevelService.swift`
  - `requiredXP(for: level)` – XP needed for a given level (e.g. base 100, growth 1.14).
  - `levelForXP(_ xp)` – level from total XP.
  - Daily XP cap and level-up logic.

**Target:** Implement the same formulas and rules in **Supabase Edge Functions** (TypeScript/Deno). Optionally expose small helpers (e.g. “compute rewards for this event”) that can be called by the main `complete-event` function. Do not store formulas only in Postgres unless you prefer SQL; Edge Functions are easier to align with the existing Swift logic.

**Reference:** Copy formulas from the Swift files above so Edge Function output matches iOS behaviour.

---

### 2.2 Task / event completion

**Current iOS location:**

- `Flowstate Calendar/App/Services/Utilities/TaskCompletionService.swift`
  - Complete event → create completed_event record → calculate rewards (via RewardCalculationService) → award to user (update user_profiles: xp, coins, weekly_coins, level, xp_earned_today, last_xp_award_date) → level-up check (UserXPLevelService) → remove or update event.

**Target:** One Edge Function that does the same flow server-side.

**Suggested API:**

- **POST** `/functions/v1/complete-event`
- **Body:** `{ "eventId": "uuid", "completionPercentage": 0.0–1.0 }`
- **Auth:** Require valid Supabase JWT (user can only complete their own events; validate `user_profile_id` from event).
- **Steps inside the function:**
  1. Validate session and body.
  2. Load event (and optionally task) from DB; ensure event belongs to the authenticated user.
  3. Compute rewards using the shared reward/level logic (see 2.1).
  4. Update `user_profiles`: add xp, coins, weekly_coins; update level if needed; set xp_earned_today, last_xp_award_date; apply daily XP cap if applicable.
  5. Insert into `completed_events`.
  6. If completion >= 1.0, delete or mark the original event as completed (match current iOS behaviour).
  7. Return updated user stats (e.g. new xp, coins, level) so clients can update UI without an extra fetch.

**Reference:** `TaskCompletionService.swift`, `RewardCalculationService.swift`, `UserXPLevelService.swift`.

---

### 2.3 Optional: event generation from tasks

- **Current:** Events are likely generated from tasks in the iOS app (EventGenerationService / similar).
- **Option A:** Leave generation on clients (iOS and web each generate events from tasks). Simpler; slight risk of drift.
- **Option B:** Move to an Edge Function or cron: “generate events for user for date range”. Use when you need identical behaviour everywhere.

Include in Plan 2 only if you decide to centralise event generation.

---

### 2.4 Aquarium

- **Current:** Aquarium state (clean level, feed, fish) is updated in Swift and persisted to `aquariums` (and possibly user profile).
- **Plan 2 scope:** Keep simple “update aquarium” writes from clients. If you later add rewards for cleaning or anti-cheat, add an Edge Function (e.g. `apply-aquarium-action`) that validates and applies the change. Not required for the first version of Plan 2.

---

## 3. Edge Function layout (suggested)

```
supabase/functions/
  complete-event/     # POST; body: eventId, completionPercentage
    index.ts
  # Optional later:
  # compute-rewards/ # GET or POST; returns xp/coins for given event + completion (for UI preview)
  # weekly-reset/    # Called by cron; reset weekly_coins if needed
```

Implement **complete-event** first; add others as needed.

---

## 4. Implementation order (backend only)

1. **Port formulas** – In a new Supabase project or existing one, add Edge Function(s) that replicate `RewardCalculationService` and `UserXPLevelService` (e.g. in TypeScript). Unit-test against known Swift outputs if possible.
2. **Implement complete-event** – Full flow: validate → load event → compute rewards → update user_profiles → insert completed_events → update/delete event → return new user stats.
3. **RLS / security** – Ensure Edge Function uses service role only for the operations that need it; validate `user_profile_id` on the event matches the authenticated user.
4. **Web app** – Update web app “Start Task” / completion flow to call `complete-event` instead of doing any reward logic in the client (see Plan 1).
5. **iOS refactor** – Replace the in-app completion path (TaskCompletionService, etc.) with a call to the same `complete-event` Edge Function where appropriate; keep local UI updates and sync from the function response.
6. **Optional** – Event generation Edge Function or cron; aquarium action function; weekly reset cron.

---

## 5. Quick reference: iOS files to mirror

| Logic | iOS file |
|-------|----------|
| Base/final XP and coins | `App/Services/Utilities/RewardCalculationService.swift` |
| Level, XP cap, level-up | `App/Services/Utilities/UserXPLevelService.swift` |
| Full completion flow | `App/Services/Utilities/TaskCompletionService.swift` |
| DB types (for request/response) | `DATABASE_SCHEMA.md`; Swift models under `Flowstate Calendar/.../Models/` |

---

## 6. Out of scope for this plan

- Changing Postgres schema or RLS policies for existing tables (only add new ones if you introduce new features).
- Web app UI or routing (Plan 1).
- Android client (future).

Once Plan 2 is done, both the web app and iOS will rely on Supabase for completion and rewards, keeping behaviour consistent and logic in one place.
