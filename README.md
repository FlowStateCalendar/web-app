# Shift Habits Web App

Chromebook-compatible web app for Shift Habits. Mirrors the iOS app: Login, Dashboard, Tasks, Completing Task, Leaderboard, Aquarium, Settings.

## Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- Supabase (Auth + Postgres, same project as iOS)
- Zustand, React Hook Form, Zod

## Setup

1. Clone and install:

   ```bash
   npm install
   ```

2. Copy env and set your Supabase keys (same project as the iOS app):

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon/public key

3. Run dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Docs

- [Plan 1: Web app development](docs/PLAN-1-WEB-APP-DEVELOPMENT.md) – build order and checklist
- [Plan 2: Supabase backend logic](docs/PLAN-2-SUPABASE-BACKEND-LOGIC.md) – moving logic to Edge Functions

## Deploy

Deploy to Vercel; use subdomain **app.shifthabits.co.uk**. Set the same env vars in the Vercel project.
