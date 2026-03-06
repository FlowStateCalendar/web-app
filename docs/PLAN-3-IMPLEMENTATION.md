# Plan 3: Implementation Order

Step-by-step implementation for Plan 3 features. Supabase Edge Functions are in `web-app/supabase/functions/`; deploy with `supabase functions deploy <name>`.

---

## Phase 1: Auth & Login

- [ ] **1.1 Forgot password**  
  - Add “Forgot password?” link on login page.  
  - Modal/sheet: email field, submit. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })`.  
  - Show success (“Check your email”) or error.  
  - **Backend:** None (Supabase Auth).

- [ ] **1.2 Set new password**  
  - Add route `app/(auth)/reset-password/page.tsx` (or use `?type=recovery` on existing route).  
  - When Supabase redirects after reset link, read hash from URL; call `supabase.auth.verifyOtp` or `supabase.auth.getSession`; show form for new password; call `supabase.auth.updateUser({ password })`; redirect to dashboard.  
  - **Backend:** None (Supabase Auth).

- [ ] **1.3 Google Sign-In**  
  - In Supabase Dashboard: Authentication → Providers → Google (enable, set Client ID/Secret).  
  - On login page add “Sign in with Google”; call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`.  
  - Handle redirect back (callback route if needed).  
  - **Backend:** None (Supabase Auth).

---

## Phase 2: Dashboard

- [ ] **2.1 User bar with coins**  
  - Add a top bar on dashboard (and optionally other app pages) showing user’s coin count and icon (e.g. coin icon + `user.coins` from `user_profiles`).  
  - Reuse the same bar component where you already show “Hi, {name}” so it’s one consistent header.  
  - **Backend:** None (read `user_profiles.coins` via existing Supabase client).

- [ ] **2.2 Profile modal**  
  - From user bar (e.g. avatar/name), open a modal: display name, email, XP, level, coins.  
  - Optional: “Edit name” that updates `user_profiles.name` via Supabase client.  
  - **Backend:** None (RLS + client updates).

---

## Phase 3: Tasks

- [ ] **3.1 Edit task**  
  - From tasks list, add “Edit” per task; open same form as create (pre-filled).  
  - On submit: `supabase.from('tasks').update({ ... }).eq('id', taskId).eq('user_profile_id', userId)`.  
  - **Backend:** None (client update with RLS).

- [ ] **3.2 Delete task**  
  - “Delete” button with confirmation dialog.  
  - `supabase.from('tasks').delete().eq('id', taskId).eq('user_profile_id', userId)`.  
  - **Backend:** None (client delete with RLS).

- [ ] **3.3 Task notification settings**  
  - In create/edit task form, add fields for notification (e.g. frequency, type, timings array).  
  - Map to `tasks.notification_frequency`, `notification_type`, `notification_timings`, etc., and save with insert/update.  
  - **Backend:** None (client writes).

---

## Phase 4: Aquarium – Shop (uses Edge Function)

- [ ] **4.1 Deploy shop-purchase Edge Function**  
  - Deploy `supabase functions deploy shop-purchase`.  
  - Set secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.  
  - **Backend:** `supabase/functions/shop-purchase/` (see below).

- [ ] **4.2 Shop UI**  
  - From aquarium page, add “Shop” entry (button or link).  
  - Shop page: list items from a catalog (can be static in frontend, or shared with function). Show name, description, price, “Buy” button.  
  - On Buy: confirm; call `POST /functions/v1/shop-purchase` with body `{ "itemKey": "tropical_fish" }` (see function API).  
  - On success: refresh user profile and aquarium (or use response payload); show success message.  
  - **Backend:** Edge Function `shop-purchase` (already added).

- [ ] **4.3 Fish interaction**  
  - In aquarium/tank view, allow selecting a fish (e.g. click); show name, optional “Rename”.  
  - Rename: update aquarium JSON (fish array) and `supabase.from('aquariums').update({ fish: JSON.stringify(updatedFish), updated_at })`.  
  - **Backend:** None (client update aquariums).

- [ ] **4.4 Aquarium stats**  
  - Section on aquarium page: e.g. clean level, fish count, weekly progress (if you have data).  
  - **Backend:** None (read from `user_profiles` / `aquariums`).

---

## Phase 5: Settings

- [ ] **5.1 Expandable sections**  
  - Refactor settings into expandable blocks: General, Notifications, Tasks, Google Classroom, Account, (optional) Developer.  
  - Reuse one `ExpandableSection` component (title + collapse/expand content).  
  - **Backend:** None.

- [ ] **5.2 General toggles**  
  - Sound effects toggle; persist in `localStorage` (e.g. `soundEnabled`).  
  - Optional: “Haptic feedback” label with note “N/A on web” or no-op.  
  - **Backend:** None.

- [ ] **5.3 Notifications / Tasks sections**  
  - Placeholder text (e.g. “Set default notifications here”) or simple dropdowns; persist in localStorage or a `user_preferences` table if you add one later.  
  - **Backend:** None for placeholders.

- [ ] **5.4 Account section**  
  - Group “User: {name}”, “Sign out” under “Account”.  
  - **Backend:** None.

- [ ] **5.5 Edit profile name**  
  - In Settings or Profile modal: text field for name; `supabase.from('user_profiles').update({ name, updated_at }).eq('id', userId)`.  
  - **Backend:** None.

- [ ] **5.6 Google Classroom**  
  - “Connect Google account” (OAuth with Google, store link in Supabase if needed).  
  - “Import from Google Classroom”: can be a later phase; optionally call an Edge Function that uses Google API to fetch assignments and create tasks (not in this implementation plan yet).  
  - **Backend:** Optional future Edge Function; skip or stub for now.

- [ ] **5.7 Developer / Debug**  
  - Optional: dev-only route or flag showing user id, env hint, recent logs.  
  - **Backend:** None.

---

## Phase 6: Other

- [ ] **6.1 Splash after login**  
  - After sign-in/sign-up, show a short splash (e.g. logo + “Loading…”) while fetching `user_profiles` and any initial data; then redirect to dashboard.  
  - **Backend:** None.

---

## Supabase Edge Functions (add to backend)

| Function          | Purpose |
|-------------------|--------|
| `complete-event`  | Already exists (Plan 2). Task completion, rewards, user update. |
| `shop-purchase`   | **New.** Validates and applies a shop purchase: deduct coins, add fish/accessory/tank to aquarium. |

Deploy from repo root:

```bash
supabase functions deploy complete-event
supabase functions deploy shop-purchase
```

Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set in the project (or per-function secrets).

---

## Quick reference: what needs backend

- **complete-event** – already in `supabase/functions/complete-event/`.  
- **shop-purchase** – new in `supabase/functions/shop-purchase/` (see below).  
- Everything else in Plan 3 is frontend + Supabase client (Auth, RLS, direct table access).
