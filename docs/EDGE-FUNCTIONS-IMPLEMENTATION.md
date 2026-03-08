# Edge Functions Implementation Guide

Step-by-step instructions for setting up, deploying, and calling Supabase Edge Functions in this project. The app uses **complete-event** (task/event completion and rewards), **shop-purchase** (aquarium shop), **task-create** / **task-update** / **task-delete** (tasks CRUD), and **user-profile-ensure** / **user-profile-update** (profile create/update).

---

## 1. Prerequisites

1. **Install the Supabase CLI**
   - macOS: `brew install supabase/tap/supabase`
   - Or via npm: `npm install -g supabase`

2. **Create or use an existing Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a project (or use the one already set up for this app).

3. **Link the project to this repo**
   - From the **web-app** directory (the folder that contains `supabase/`), run:
     ```bash
     supabase link --project-ref <your-project-ref>
     ```
   - Find your project ref in the Supabase Dashboard: **Project Settings → General → Reference ID**.

4. **Log in to Supabase (if needed)**
   - `supabase login` — opens browser to authenticate the CLI.

---

## 2. Environment and secrets

Edge Functions receive these at runtime:

- **SUPABASE_URL** and **SUPABASE_ANON_KEY** — injected automatically by Supabase when deployed. You only need to set them as secrets if you use a custom URL or key.
- **SUPABASE_SERVICE_ROLE_KEY** — **must be set by you.** The functions use it to perform privileged writes (e.g. `user_profiles`, `completed_events`, `events`, `aquariums`).

**Set the service role secret:**

1. In the Supabase Dashboard: **Project Settings → API**.
2. Copy the **service_role** key (keep it secret; never commit or expose in the client).
3. From the **web-app** directory, run:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<paste-your-service-role-key>
   ```

Optional: to override URL or anon key for a function, set them as secrets:

```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 3. Deploy Edge Functions

Deploy from the **web-app** directory (parent of `supabase/`).

**Deploy all functions:**

```bash
supabase functions deploy complete-event
supabase functions deploy shop-purchase
supabase functions deploy task-create
supabase functions deploy task-update
supabase functions deploy task-delete
supabase functions deploy user-profile-ensure
supabase functions deploy user-profile-update
```

**Deploy a single function:**

```bash
supabase functions deploy <function-name>
```

Example:

```bash
supabase functions deploy complete-event
```

**How deployment works:**

- Each function is deployed from its own folder: `supabase/functions/<function-name>/`.
- The folder `supabase/functions/_shared/` is **not** deployed. The `complete-event` (and any other) function that needs shared logic uses its own copies inside its folder (see [supabase/README.md](../supabase/README.md) for the layout).

After a successful deploy, the functions are available at:

- `https://<your-project-ref>.supabase.co/functions/v1/complete-event`
- `https://<your-project-ref>.supabase.co/functions/v1/shop-purchase`
- `https://<your-project-ref>.supabase.co/functions/v1/task-create`
- `https://<your-project-ref>.supabase.co/functions/v1/task-update`
- `https://<your-project-ref>.supabase.co/functions/v1/task-delete`
- `https://<your-project-ref>.supabase.co/functions/v1/user-profile-ensure`
- `https://<your-project-ref>.supabase.co/functions/v1/user-profile-update`

---

## 4. Call from the app

**Base URL:** `{SUPABASE_URL}/functions/v1/<function-name>`

**Auth:** Every request must include the user’s JWT:

- Header: `Authorization: Bearer <user JWT>`
- Get the session in the web app with `supabase.auth.getSession()` and use `session.data.session?.access_token`.

### complete-event

- **Method:** `POST`
- **URL:** `{SUPABASE_URL}/functions/v1/complete-event`
- **Body:** `{ "eventId": "<uuid>", "completionPercentage": 0.0 }` (number between 0 and 1)
- **Auth:** Required. The event’s `user_profile_id` must match the authenticated user.

Example (pseudo-code):

```ts
const { data: { session } } = await supabase.auth.getSession();
const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/complete-event`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ eventId, completionPercentage }),
});
```

### shop-purchase

- **Method:** `POST`
- **URL:** `{SUPABASE_URL}/functions/v1/shop-purchase`
- **Body:** `{ "itemKey": "tropical_fish" }` (see [supabase/functions/shop-purchase/catalog.ts](../supabase/functions/shop-purchase/catalog.ts) for all keys)
- **Auth:** Required. Coins are deducted from the authenticated user; aquarium must belong to that user.

The web app calls **shop-purchase** from the shop UI: [app/(app)/aquarium/shop/ShopView.tsx](../app/(app)/aquarium/shop/ShopView.tsx). The task completion flow calls **complete-event** from [components/CompletingTaskView.tsx](../components/CompletingTaskView.tsx) (rewards and completion are applied server-side).

### task-create

- **Method:** `POST`
- **URL:** `{SUPABASE_URL}/functions/v1/task-create`
- **Body:** `title` (required), `description`, `length` (seconds), `category`, `frequency`, `date` (ISO), `energy_cost`, `notification_frequency`, `notification_type`, `notification_timings`, optional `notifyMinutesBefore`. Server computes `base_xp` and `base_coins`.
- **Auth:** Required. Task is created for the authenticated user.
- **Used by:** [components/NewTaskForm.tsx](../components/NewTaskForm.tsx) when creating a new task.

### task-update

- **Method:** `POST`
- **URL:** `{SUPABASE_URL}/functions/v1/task-update`
- **Body:** `taskId` (required), plus optional fields: `title`, `description`, `length`, `category`, `frequency`, `date`, `energy_cost`, `notification_frequency`, `notification_type`, `notification_timings`. Server recomputes `base_xp`/`base_coins` when relevant.
- **Auth:** Required. Only the task owner can update.
- **Used by:** [components/NewTaskForm.tsx](../components/NewTaskForm.tsx) when editing a task.

### task-delete

- **Method:** `POST`
- **URL:** `{SUPABASE_URL}/functions/v1/task-delete`
- **Body:** `{ "taskId": "uuid" }`
- **Auth:** Required. Only the task owner can delete.
- **Used by:** [components/TasksList.tsx](../components/TasksList.tsx) when deleting a task.

### user-profile-ensure

- **Method:** `POST`
- **URL:** `{SUPABASE_URL}/functions/v1/user-profile-ensure`
- **Body:** Optional `name`, optional `profile_picture`. If no profile exists for the user, one is created; if it exists, optional fields are updated.
- **Auth:** Required. Call after signup or on app load to ensure a profile row exists.
- **Used by:** Optional; call from app layout or after login if you do not rely on a DB trigger to create profiles.

### user-profile-update

- **Method:** `POST`
- **URL:** `{SUPABASE_URL}/functions/v1/user-profile-update`
- **Body:** At least one of `name`, `profile_picture` (partial update).
- **Auth:** Required. Updates only the authenticated user’s profile.
- **Used by:** [app/(app)/settings/SettingsContent.tsx](../app/(app)/settings/SettingsContent.tsx) and [components/UserBar.tsx](../components/UserBar.tsx) when saving display name.

---

## 5. Optional: local development

**Serve functions locally:**

From the **web-app** directory:

```bash
supabase functions serve
```

Optional: use a local env file for secrets (e.g. for a linked remote DB):

```bash
supabase functions serve --env-file .env.local
```

Then call the local endpoint (e.g. `http://localhost:54321/functions/v1/complete-event`) with the same method, headers, and body as in production.

**Full local stack (optional):**

```bash
supabase start
```

Use this if you want to run the database and Auth locally; otherwise `supabase functions serve` is enough to test the function code against your remote project.

---

## 6. Quick reference

| Function                | Method | Body                                                                 | Auth   |
|--------------------------|--------|----------------------------------------------------------------------|--------|
| **complete-event**      | POST   | `{ "eventId": "uuid", "completionPercentage": 0–1 }`                 | JWT    |
| **shop-purchase**       | POST   | `{ "itemKey": "string" }` (see `shop-purchase/catalog.ts`)           | JWT    |
| **task-create**         | POST   | `{ title, length, category, frequency, date, energy_cost, ... }`     | JWT    |
| **task-update**         | POST   | `{ taskId, title?, description?, length?, ... }`                     | JWT    |
| **task-delete**         | POST   | `{ "taskId": "uuid" }`                                               | JWT    |
| **user-profile-ensure** | POST   | `{ name?, profile_picture? }` (optional)                              | JWT    |
| **user-profile-update** | POST   | `{ name?, profile_picture? }` (at least one)                          | JWT    |

For behaviour, shared-code layout, and iOS sources mirrored, see [supabase/README.md](../supabase/README.md).
