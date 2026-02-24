# Plan 1: ShiftHabits Web App Development (Buildable)

Reference and build order for the Next.js web app. Use this when implementing the frontend and deployment. Check off items as you complete them.

---

## Overview

- **Goal:** Chromebook-compatible web app at **app.shifthabits.co.uk** that mirrors the iOS app (Login, Dashboard, Tasks, **Completing Task**, Leaderboard, Aquarium, Settings).
- **Repo:** This folder (`web-app`). Same Supabase project as iOS; no database migration.
- **Out of scope:** Moving business logic to Supabase (see Plan 2). Web app calls Supabase Auth + DB directly; later it will call Edge Functions from Plan 2.

---

## 1. Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS |
| Backend client | `@supabase/supabase-js` |
| State | Zustand |
| Forms / validation | React Hook Form + Zod |
| Data fetching | Optional: SWR |

**Do not add:** Prisma, Sanity, or any marketing-site CMS dependencies.

---

## 2. UI Sections (parity with iOS)

The web app must include **all** of these sections.

| iOS | Web section | Purpose |
|-----|-------------|---------|
| Auth: Loading → Login → Splash → Home | Auth + protected layout | Loading, login/sign-up, optional splash, then main app |
| **Home** (DashboardView) | **Dashboard** | User bar, “Today’s Upcoming Events”, Start Task |
| **CompletingTask** (full-screen) | **Completing Task** | Timer (Start/Pause/Resume), End Task Early, rewards preview, completion alert, return to Dashboard |
| **Tasks** (TasksView) | **Tasks** | List, create, edit tasks |
| **Calendar** tab (MainLeaderboardView) | **Leaderboard** | Weekly leaderboard (top 50 by `weekly_coins`) |
| **Aquarium** (AquariumView) | **Aquarium** | View tank, clean/feed; optional shop (simplified at first) |
| **Settings** (SettingsView) | **Settings** | Profile, sign out, optional preferences |

---

## 3. Routing (App Router)

- **Auth (unprotected):**
  - `app/(auth)/login/page.tsx` – Login and sign-up (email/password; Google later if needed).

- **App (protected):**
  - `app/(app)/layout.tsx` – Protected layout with nav (bottom nav for mobile/Chromebook or side nav for desktop).
  - `app/(app)/dashboard/page.tsx` – Dashboard.
  - `app/(app)/complete/[eventId]/page.tsx` – **Completing Task** full-screen view (timer, controls, completion).
  - `app/(app)/tasks/page.tsx` – Tasks list and create/edit.
  - `app/(app)/leaderboard/page.tsx` – Leaderboard.
  - `app/(app)/aquarium/page.tsx` – Aquarium.
  - `app/(app)/settings/page.tsx` – Settings.

Use middleware or layout-level auth check to redirect unauthenticated users from `/(app)/*` to `/login`.

---

## 4. Completing Task view (detail)

Mirror the iOS **CompletingTask** flow so users can run a timer and complete events from the web.

- **Entry:** From Dashboard, “Start Task” on an event navigates to `/complete/[eventId]` (or opens a full-screen completing view with that event).
- **Content:**
  - Header: task name.
  - Timer: countdown (e.g. `HH:MM:SS`) from event length; Start → Pause → Resume; optional persistence in `localStorage` so refresh doesn’t lose progress.
  - Task info: category, energy (e.g. bolt icons).
  - Rewards preview: earned XP and coins at current completion % (for “End Task Early”).
  - Controls: main action (Start / Pause / Resume), “End Task Early”, “Return to Dashboard” (when paused or when not started).
- **On completion (natural or early):** Call backend to complete the event (client-side logic for now; later replace with Plan 2 `complete-event` Edge Function). Show success alert/modal with earned XP and coins, then navigate back to Dashboard.
- **Validation:** If event is in the past, show “Cannot complete past event” and return to Dashboard (match iOS).

---

## 5. Auth and protection

- Use **Supabase Auth** (same project as iOS).
- After login, optionally show a short “splash” or loading state while fetching user profile and initial data (mirror iOS `handleSplashLoading`).
- Protected routes: ensure JWT is present; redirect to `/login` if not.

---

## 6. Data and types

- Use the **existing Supabase schema** (see iOS `DATABASE_SCHEMA.md`): `user_profiles`, `tasks`, `events`, `completed_events`, `aquariums`.
- Leaderboard: query `user_profiles` (e.g. `id`, `name`, `weekly_coins`) ordered by `weekly_coins` DESC, limit 50.
- Define **TypeScript types** (or Zod schemas) that match the DB; use snake_case from DB and map to camelCase in the app if desired. Share types between client and server where relevant.

---

## 7. Buildable implementation plan

Execute in order. Each bullet is a concrete, checkable task.

### Phase 1: Bootstrap

- [ ] Initialise Next.js 15 with TypeScript and Tailwind in `web-app` (if not already present).
- [ ] Add `.env.local.example` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; document in README.
- [ ] Create `lib/supabase/client.ts` (browser client for client components).
- [ ] Create `lib/supabase/server.ts` (optional server client for Server Components / route handlers).
- [ ] Add root layout `app/layout.tsx` and global styles (Tailwind).
- [ ] Optional: add `manifest.json` and minimal PWA setup for Chromebook install.

### Phase 2: Auth

- [ ] Create `app/(auth)/layout.tsx` (minimal layout for login).
- [ ] Create `app/(auth)/login/page.tsx` with email/password form (React Hook Form + Zod).
- [ ] Implement sign-in and sign-up (Supabase Auth); show validation errors.
- [ ] Add auth middleware (e.g. `middleware.ts`) or auth check in `(app)/layout.tsx`: redirect unauthenticated users from `/(app)/*` to `/login`; redirect authenticated users from `/login` to `/dashboard`.
- [ ] Optional: after login, show splash/loading screen while fetching user profile and initial data, then redirect to Dashboard.

### Phase 3: Protected app shell

- [ ] Create `app/(app)/layout.tsx` that requires auth and wraps children with a nav component.
- [ ] Implement app navigation (bottom nav or side nav): Dashboard, Tasks, Leaderboard, Aquarium, Settings. Each item links to the correct route.
- [ ] Create placeholder pages for each section so all nav links work: `dashboard`, `tasks`, `leaderboard`, `aquarium`, `settings`.

### Phase 4: Dashboard

- [ ] Create `app/(app)/dashboard/page.tsx`.
- [ ] Add user bar (display name, optional avatar) using `user_profiles` or auth user.
- [ ] Fetch “Today’s Upcoming Events” from `events` (filter by current user and today’s date).
- [ ] Render list of events with task name, time, category, energy; show “Start Task” button per event.
- [ ] “Start Task” navigates to Completing Task view with that event (e.g. `/complete/[eventId]` or equivalent).

### Phase 5: Completing Task view

- [ ] Create `app/(app)/complete/[eventId]/page.tsx` (or equivalent route).
- [ ] Fetch event by `eventId`; ensure it belongs to the current user. If not found or past, redirect to Dashboard (or show “Cannot complete past event” and return).
- [ ] Build Completing Task UI: header (task name), timer display (HH:MM:SS), task info (category, energy), rewards preview (XP/coins at current %).
- [ ] Implement timer state: not started, running, paused. Start / Pause / Resume buttons; “End Task Early” when paused (or when running); “Return to Dashboard” when paused or not started.
- [ ] Optional: persist timer session in `localStorage` (eventId, start time, paused duration, state) and restore on page load so refresh doesn’t lose progress.
- [ ] On “Complete” (natural or “End Task Early”): compute completion %, call backend to record completion (client-side Supabase writes for now; later replace with `complete-event` Edge Function from Plan 2). Show success alert/modal with earned XP and coins; then navigate to Dashboard.
- [ ] Handle “past event”: if event date is in the past, show alert and redirect to Dashboard.

### Phase 6: Tasks

- [ ] Create `app/(app)/tasks/page.tsx` (list view).
- [ ] Fetch tasks for current user from `tasks` (by `user_profile_id`).
- [ ] Display task list (name, date, category, etc.); link or button to create/edit.
- [ ] Create task form (new + edit) with React Hook Form + Zod: name, description, length, category, frequency, date, energy, notification fields as needed. Map to existing `tasks` columns.
- [ ] Persist create/update via Supabase client (insert/update `tasks`). Optional: delete task.

### Phase 7: Leaderboard

- [ ] Create `app/(app)/leaderboard/page.tsx`.
- [ ] Query `user_profiles`: select `id`, `name`, `weekly_coins`, order by `weekly_coins` DESC, limit 50.
- [ ] Render read-only list (e.g. rank, name, weekly coins). Highlight current user if desired.

### Phase 8: Aquarium

- [ ] Create `app/(app)/aquarium/page.tsx`.
- [ ] Fetch user’s aquarium from `aquariums` (by `user_profile_id`). If none, show “Create your first aquarium” or create default (match iOS behaviour if applicable).
- [ ] Display tank state (clean level, fish count, etc.); add “Clean” and “Feed” buttons that update aquarium state and persist to `aquariums` (and user profile if needed).

### Phase 9: Settings

- [ ] Create `app/(app)/settings/page.tsx`.
- [ ] Display profile (name, avatar if present) from `user_profiles`.
- [ ] Optional: edit name/avatar and save via Supabase.
- [ ] Sign out button: call Supabase Auth sign-out and redirect to `/login`.

### Phase 10: Types and polish

- [ ] Add shared TypeScript types or Zod schemas for `user_profiles`, `tasks`, `events`, `completed_events`, `aquariums` (and event/task for Completing Task). Use in components and API calls.
- [ ] Ensure all sections are reachable from nav and back-navigation works. Test auth redirects and Completing Task flow end-to-end.

### Phase 11: Deploy

- [ ] Deploy to Vercel (connect repo, build command, output directory per Next.js 15).
- [ ] Configure production env vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Set up subdomain **app.shifthabits.co.uk** (Vercel project settings + DNS).

---

## 8. Out of scope for this plan

- Implementing Edge Functions or moving business logic (see **Plan 2**).
- Android app.
- Marketing site or CMS.
- Changing Supabase schema or RLS (use existing).

---

## 9. Quick reference: where things live

| Concern | Location |
|---------|----------|
| Supabase client (browser) | `lib/supabase/client.ts` |
| Supabase client (server) | `lib/supabase/server.ts` (optional) |
| Auth guard / redirect | Middleware or `(app)/layout.tsx` |
| Shared types | `types/` or `lib/types.ts` |
| App navigation | `(app)/layout.tsx` (nav component) |
| Completing Task | `app/(app)/complete/[eventId]/page.tsx` |

Once Plan 2 is in place, replace client-side completion/reward logic in the Completing Task view with a call to the `complete-event` Edge Function.
