# Plan 3: Web App Features from iOS

Add features from the iOS app to the web app. Check off each item as you implement it.

**Reference:** Calendar-iOS (Flowstate Calendar). No iOS code is removed; this plan only adds to the web app.

---

## Auth & Login

- [ ] **Google Sign-In** – Add “Sign in with Google” on login page (Supabase Auth with Google provider; match iOS `Login.swift` + `GoogleAuthService`).
- [ ] **Forgot password** – “Forgot password?” link that opens a sheet/modal; user enters email; call Supabase `resetPasswordForEmail` and show success/error (match `ForgotPasswordSheet.swift`).
- [ ] **Set new password** – After user follows reset link, allow setting new password (e.g. route `/reset-password` or modal when Supabase reports recovery session; match `SetNewPasswordView.swift`).

---

## Dashboard

- [ ] **User bar with coins** – Top bar showing coin count (match `UserBar.swift`: coins with icon, frosted style optional).
- [ ] **Profile modal** – Tapping profile/avatar opens modal with user info, XP/level, maybe edit name (match `ProfileModal.swift`).

---

## Tasks

- [ ] **Edit task** – From task list, open edit view/sheet; update title, description, length, category, frequency, date, energy (match iOS edit flow: `NewTaskView` in edit mode, `NewTaskSheetView` per aspect).
- [ ] **Delete task** – Delete button with confirmation dialog; remove from Supabase and list (match `showDeleteAlert` + `deleteTask()` in `NewTaskViewModel`).
- [ ] **Task notification settings** – In create/edit task form, add notification options (frequency, type, timings) and persist to `tasks.notification_*` (match `TaskNotificationsEditingView`; can be simplified on web).

---

## Aquarium

- [ ] **Shop** – Shop entry from aquarium page; list items (fish, accessories, tanks) with prices; purchase with coins and update aquarium (match `ShopView.swift` + `ShopItem`; persist via `aquariums` and optionally `user_profiles.coins`).
- [ ] **Fish interaction** – In tank view, allow selecting a fish and viewing/editing (e.g. rename) (match `FishInteractionView`, `FishNamingSheet`; update aquarium JSON and Supabase).
- [ ] **Aquarium stats** – Section showing stats (e.g. weekly progress, clean level, fish count) (match `AquariumStatsView`, `WeeklyProgressCard`).

---

## Settings

- [ ] **Expandable sections** – Settings grouped in expandable sections: General, Notifications, Tasks, Google Classroom, Account, (optional) Developer (match `SettingsView` + `ExpandableSection`).
- [ ] **General toggles** – Sound effects (and optionally “haptic” placeholder for web); persist in localStorage or user prefs (match “Sound effects”, “Haptic feedback” in Settings).
- [ ] **Notifications section** – Placeholder or simple defaults for notification preferences (match iOS “Set default notifications setting here”).
- [ ] **Tasks section** – Placeholder or simple defaults for task options (match iOS “Set default task options here”).
- [ ] **Google Classroom** – “Connect Google account” and “Import from Google Classroom” (match `GoogleClassroomImportSheet`; requires Google OAuth and Classroom API; can be phased).
- [ ] **Account section** – User name display, Sign out (you have sign out; ensure “Account” grouping and name shown like iOS).
- [ ] **Edit profile name** – In Settings or Profile modal, edit display name and save to `user_profiles.name`.
- [ ] **Developer / Debug** – Optional: debug view (e.g. user id, env, logs) behind a flag or dev-only route (match `DebugView`; low priority).

---

## Other

- [ ] **Splash after login** – Optional loading/splash screen after login while fetching user profile and initial data (match `SplashView` + `handleSplashLoading`).

---

## Summary checklist (copy for quick reference)

| Area      | Items |
|-----------|--------|
| Auth      | Google Sign-In, Forgot password, Set new password |
| Dashboard | User bar with coins, Profile modal |
| Tasks     | Edit task, Delete task, Task notification settings |
| Aquarium  | Shop, Fish interaction, Aquarium stats |
| Settings  | Expandable sections, General toggles, Notifications/Tasks placeholders, Google Classroom, Account, Edit profile name, Optional Debug |
| Other     | Splash after login |

Implement in whatever order you prefer; auth and dashboard items will make the app feel closest to iOS first.
