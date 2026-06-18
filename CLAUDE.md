# NihongoNow — Claude Code Context

NihongoNow is a Japanese language learning app. Users work through lessons, practice vocabulary, do spaced repetition reviews, and track progress with analytics.

## Stack

- **Framework**: Next.js 15 App Router, React 18, TypeScript
- **Database**: Supabase (PostgreSQL) via Prisma ORM
- **Styling**: Tailwind CSS + Radix UI primitives
- **State**: Zustand
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Auth**: Supabase SSR auth helpers

## Directory Structure

```
app/
  dashboard/       — main dashboard after login
  lesson/          — lesson content and exercises
  practice/        — vocabulary drilling
  review/          — spaced repetition (SRS) review sessions
  analytics/       — progress charts and statistics
  settings/        — user preferences
  auth/            — Supabase auth callback route
  login/           — login page
  onboarding/      — new user setup flow
  api/             — API routes

components/        — shared UI components
lib/               — utilities, Supabase client helpers, type definitions
prisma/
  schema.prisma    — database schema
  seed.ts          — seed data
```

## Key Conventions

- Use the existing Supabase client helpers in `lib/` (don't create new client instances)
- Follow the App Router patterns already in use — server components by default, `"use client"` only when needed
- Database mutations go through Prisma in API routes or server actions
- UI components use Radix UI primitives styled with Tailwind — match the existing visual style
- Keep TypeScript strict — no `any` unless unavoidable

## Development

```bash
npm run dev    # start dev server on localhost:3000
npm run build  # production build
npm run lint   # ESLint
```

## Working on Tasks

When implementing a task from a GitHub issue:
1. Read the issue body carefully
2. Explore relevant files before writing code
3. Follow existing patterns in the codebase
4. Commit directly to master with a message like: `feat: <description> (closes #<number>)`
5. Do not create pull requests
