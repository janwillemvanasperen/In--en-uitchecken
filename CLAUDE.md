# CLAUDE.md — AI Assistant Guide for In- en Uitchecken

This file provides essential context for AI assistants working in this codebase.

---

## Project Overview

**In- en Uitchecken** (Check-in and Check-out) is a Dutch attendance management system for an educational institution. Students check in/out at physical locations via GPS or QR code. Coaches supervise students, admins manage the system, and a dedicated absence manager (verzuim) handles attendance exceptions.

- **Stack:** Next.js 15 (App Router) + TypeScript + Supabase (PostgreSQL + Auth) + Tailwind CSS + shadcn/ui
- **Language:** All UI text and database content is in Dutch (nl-NL)
- **Deployment:** Vercel (frontend) + Supabase (database + edge functions)

---

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

There is no test runner. There is no CI/CD pipeline.

---

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>    # Admin operations only — never expose client-side
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid-public>     # Web push notifications
VAPID_PRIVATE_KEY=<vapid-private>               # Web push notifications (server-side only)
```

See `.env.example` for the template. Never commit real credentials.

---

## Repository Structure

```
src/
├── app/                     # Next.js App Router pages and layouts
│   ├── auth/                # Login, register, OAuth callback
│   ├── student/             # Student-facing pages
│   ├── coach/               # Coach-facing pages
│   ├── admin/               # Admin-facing pages
│   └── verzuim/             # Absence manager pages
├── components/
│   ├── ui/                  # shadcn/ui primitives (button, dialog, tabs, etc.)
│   ├── student/             # Student-specific components
│   ├── coach/               # Coach-specific components
│   ├── admin/               # Admin-specific components
│   ├── verzuim/             # Verzuim dashboard components
│   └── shared/              # Cross-role shared components
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser-side Supabase client
│   │   ├── server.ts        # Server-side client + admin client
│   │   └── database.types.ts # Auto-generated TypeScript DB types
│   ├── auth.ts              # Auth helpers
│   ├── date-utils.ts        # Date/time utilities (Europe/Amsterdam timezone)
│   ├── geolocation.ts       # GPS location validation (500m radius)
│   ├── schedule-validation.ts # Schedule business logic
│   ├── coach-utils.ts       # Coach-specific utilities
│   ├── push-notifications.ts # Web push subscription management
│   └── utils.ts             # cn() helper (clsx + tailwind-merge)
├── types/                   # Shared TypeScript type definitions
└── middleware.ts            # Session refresh + role-based route guards

supabase/
├── migrations/              # 11 SQL migration files (apply in order)
└── functions/
    └── send-notifications/  # Deno edge function for push notifications
```

---

## User Roles

There are exactly four roles defined in `src/middleware.ts`:

| Role | Dashboard | Description |
|------|-----------|-------------|
| `student` | `/student/dashboard` | Check in/out, manage schedule, submit leave requests |
| `coach` | `/coach/dashboard` | View and supervise students, write notes, track goals |
| `admin` | `/admin/dashboard` | Full system management: users, locations, schedules |
| `verzuim` | `/verzuim/dashboard` | Attendance and absence management (4-tab dashboard) |

The middleware enforces role isolation: each role prefix (`/student/*`, `/coach/*`, `/admin/*`, `/verzuim/*`) is inaccessible to other roles. Unauthenticated users are redirected to `/auth/login`. Public routes: `/`, `/auth/login`, `/auth/register`, `/auth/callback`.

---

## Supabase Patterns

### Client Selection

Use the correct client for each context:

```typescript
// In Server Components, Route Handlers, Server Actions:
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// In Client Components:
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// For privileged operations (bypass RLS):
import { createAdminClient } from '@/lib/supabase/server'
const supabase = createAdminClient()
// Only use admin client in Server Actions or Route Handlers — NEVER in client code.
```

### Row Level Security (RLS)

All tables have RLS enabled. Policies enforce that:
- Students can only read/write their own data
- Coaches can read their assigned students' data
- Admins have full access via the service role key
- The `verzuim` role has read access to attendance-related tables

Always test new queries against the RLS policies. When writing migrations that add new tables, add appropriate RLS policies in the same migration file.

### Database Type Safety

`src/lib/supabase/database.types.ts` is auto-generated. Do not edit it manually. Regenerate with:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
```

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Extends `auth.users`; holds `role`, `full_name`, `coach_id`, `profile_photo_url` |
| `schedules` | Student weekly schedule entries; workflow: `pending` → `approved`/`rejected` |
| `check_ins` | Attendance records; method: `gps` or `qr`; validated within 500m |
| `locations` | Physical sites with GPS coordinates and QR codes |
| `leave_requests` | Sick/late/appointment requests; workflow: `pending` → `approved`/`rejected` |
| `coaches` | Coach entities linked to `users` |
| `settings` | System-wide config (minimum hours, defaults) |
| `development_goals` | Student goals assigned by coaches; phase-based |
| `notes` | Coach notes on students with label categorization |
| `day_capacities` | Max students per day limits |
| `coach_schedules` | Coach availability/working hours |
| `push_subscriptions` | Web push notification subscriptions |
| `notification_log` | Prevents duplicate push notifications |

---

## Architecture Conventions

### Server vs Client Components

- Default to **Server Components** for data fetching
- Use **Client Components** (`'use client'`) only when you need browser APIs, event handlers, or React state
- Data mutations go through **Server Actions** (functions in `app/` page files or separate `actions.ts` files)

### Styling

- Use **Tailwind CSS** utility classes exclusively — no inline styles, no CSS modules
- Use the `cn()` helper from `@/lib/utils` to merge conditional classes: `cn('base-class', condition && 'conditional-class')`
- Color variables are defined in `tailwind.config.ts` using CSS custom properties; use semantic tokens (e.g., `bg-background`, `text-foreground`) rather than hard-coded colors
- Dark mode is supported via the `dark:` prefix

### Component Patterns

- UI primitives live in `src/components/ui/` and come from shadcn/ui — extend them but don't rewrite them
- Role-specific components live in their respective `src/components/<role>/` subdirectory
- Shared components (used by 2+ roles) go in `src/components/shared/`
- Component files use PascalCase; utility files use kebab-case

### Dates and Timezones

All time handling uses **Europe/Amsterdam** timezone. Use helpers from `src/lib/date-utils.ts` rather than constructing `Date` objects directly. This is critical because the application schedules check-in reminders and notifications based on local Dutch time.

### Geolocation Check-ins

`src/lib/geolocation.ts` validates that a student's GPS position is within **500 meters** of a registered location. QR code scanning is the fallback method when GPS is unavailable or out of range.

---

## Adding New Features

### Adding a new page

1. Create the file at the correct App Router path: `src/app/<role>/<feature>/page.tsx`
2. Add a layout if the page needs shared structure: `src/app/<role>/<feature>/layout.tsx`
3. The middleware automatically protects the route based on path prefix — no additional auth code needed

### Adding a new database table

1. Create a migration file in `supabase/migrations/` with the next sequential number
2. Include `CREATE TABLE`, `ALTER TABLE ENABLE ROW LEVEL SECURITY`, and `CREATE POLICY` statements in the same file
3. Regenerate `database.types.ts` after applying the migration
4. Update `src/types/` if you need shared TypeScript interfaces beyond the generated types

### Adding a new Server Action

Server Actions should be `async` functions marked with `'use server'`. Place them either:
- Inline in a page file (for simple, page-specific mutations)
- In a dedicated `actions.ts` file alongside the page (for complex or reused mutations)

Always use `createClient()` (server) inside Server Actions, never the browser client.

---

## Push Notifications

The `supabase/functions/send-notifications/` Deno edge function handles all push notifications. It is triggered on a schedule and sends:
- 15-minute schedule reminders before check-in time
- Check-in reminders at schedule start time
- Check-out reminders 15 minutes after schedule end
- Schedule approval/rejection notifications
- Leave request approval/rejection notifications

Duplicate prevention is handled via the `notification_log` table. When modifying notification logic, keep this table in sync to avoid re-sending.

---

## What NOT to Do

- **Do not** use `createAdminClient()` in client components or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- **Do not** bypass RLS by always using the admin client — use it only for operations that legitimately need elevated access
- **Do not** hardcode Dutch timezone strings; use the helpers in `date-utils.ts`
- **Do not** add new shadcn/ui components manually — use the CLI: `npx shadcn@latest add <component>`
- **Do not** edit `database.types.ts` by hand — regenerate it
- **Do not** translate the UI to English; this is a Dutch application for Dutch users
- **Do not** add features or refactor code beyond what is explicitly requested

---

## No Testing Infrastructure

This project has no automated tests and no CI/CD pipeline. There is no Jest, Vitest, Playwright, or similar setup. Manual testing against a local Supabase instance is the current verification approach. When adding new features, test manually via `npm run dev` before committing.

---

## Git Branch Convention

Active development happens on feature branches. The current development branch established by Claude Code is `claude/add-claude-documentation-HFjF4`. Use descriptive branch names for new work.
