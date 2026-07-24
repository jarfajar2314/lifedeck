# LifeDeck

**Personal & Household Command Center** — an all-in-one, mobile-first PWA for expense logging, task management, and micro-notes with real-time household collaboration.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://lifedeck-bay.vercel.app)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-000?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa)

---

## Features

- **Universal Command Bar** — One input to log expenses, tasks, and notes. Type `25k lunch @gopay`, `todo Buy milk`, or `note Wifi password`.
- **Account Tagging & Balance Tracking** — Tag transactions with payment sources (`@gopay`, `@bca`). Balances update automatically.
- **Expense Keypad** — Custom numeric keypad for one-thumb expense logging.
- **Task Management** — Swipe to complete/delete, priority labels, due dates.
- **Quick Notes** — Pin, tag, and search micro-notes.
- **Household Collaboration** — Invite family members to shared spaces with invite codes. See updates in real time.
- **Real-time Sync** — SSE + PostgreSQL `LISTEN/NOTIFY` for sub-second cross-device sync, with 10s polling fallback.
- **Offline Queue** — Mutations queue to localStorage when offline, auto-replay on reconnect.
- **Theming** — 3 base modes (Dark / OLED / Light), 4 accent presets, and 2 predefined themes (Pink Power, Royal Purple).
- **PWA** — Installable on mobile and desktop with service worker caching and offline fallback page.
- **Multi-currency** — Per-user currency setting (IDR, USD, EUR, SGD, etc.).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + [Shadcn UI](https://ui.shadcn.com) |
| **Auth** | [Better Auth](https://better-auth.com) (email & password) |
| **Database** | Supabase PostgreSQL |
| **ORM / Query** | Raw SQL via pg.Pool + [Kysely](https://kysely.dev) dialect |
| **Realtime** | SSE + PostgreSQL `LISTEN/NOTIFY` |
| **PWA** | [Serwist](https://serwist.pages.dev) (service worker) |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                    Next.js App                    │
│  ┌──────────────┬──────────────┬──────────────┐   │
│  │  Dashboard   │  Auth Pages  │  API Routes  │   │
│  │  (CSR/PWA)   │  (SSR)       │  (Node.js)   │   │
│  └──────┬───────┴──────┬───────┴──────┬───────┘   │
│         │              │              │           │
│  ┌──────▼──────────────▼──────────────▼───────┐   │
│  │  Shared Cache + Optimistic Updates         │   │
│  │  (lib/data-store.ts)                       │   │
│  └────────────────┬───────────────────────────┘   │
│                   │                                │
└───────────────────┼────────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   Supabase          │
         │   PostgreSQL + RLS  │
         │   Realtime (SSE)    │
         └─────────────────────┘
```

### Key Patterns

- **Optimistic Updates** — All mutations apply to the in-memory cache instantly, roll back on server error.
- **Offline Queue** — When `navigator.onLine === false`, mutations queue to `localStorage` and flush on reconnect.
- **Entity Routes** — Each entity (`/api/transactions`, `/api/tasks`, etc.) has dedicated REST endpoints with camelCase ↔ snake_case mapping.
- **Space Isolation** — Data is scoped to spaces. RLS policies ensure users only see their joined spaces.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project (or local Supabase instance)

### Installation

```bash
git clone https://github.com/jarfajar2314/lifedeck.git
cd lifedeck
npm install
```

### Environment Variables

Create `.env.local`:

```env
# Better Auth
BETTER_AUTH_SECRET=your-random-secret
BETTER_AUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@your-host:6543/postgres

# Optional
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000
```

> Use the Supabase **Transaction Pooler** connection string (port 6543) for the `DATABASE_URL`. Direct connections (port 5432) may not resolve from Vercel.

### Run Locally

```bash
# Development server
npm run dev

# TypeScript check
npx tsc --noEmit
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build (compiles service worker) |
| `npm start` | Start production server |
| `npx tsc --noEmit` | TypeScript type check |
| `npx supabase db push` | Apply database migrations |

---

## Project Structure

```
├── app/
│   ├── (auth)/          # Sign-in / sign-up pages
│   ├── api/             # REST API routes
│   │   ├── accounts/
│   │   ├── auth/
│   │   ├── categories/
│   │   ├── data/        # Legacy sync endpoint
│   │   ├── notes/
│   │   ├── profiles/
│   │   ├── spaces/
│   │   ├── sse/         # Server-Sent Events
│   │   └── transactions/
│   ├── layout.tsx       # Root layout
│   ├── offline/         # PWA offline fallback page
│   └── page.tsx         # Landing / dashboard entry
├── components/
│   ├── ui/              # Shadcn UI primitives
│   ├── dashboard.tsx    # Main dashboard layout
│   ├── command-bar.tsx  # Universal input bar
│   ├── expense-keypad.tsx
│   ├── theme-provider.tsx
│   ├── auth-provider.tsx
│   └── ...
├── hooks/               # React hooks (use-db, use-spaces, etc.)
├── lib/
│   ├── auth.ts          # Better Auth server config
│   ├── auth-client.ts   # Better Auth browser client
│   ├── pool.ts          # pg.Pool singleton
│   ├── data-store.ts    # Shared cache + offline queue
│   ├── command-parser.ts
│   └── db.ts            # TypeScript interfaces
├── supabase/migrations/ # Database schema migrations
├── public/              # Static assets + PWA icons
├── sw.ts                # Service worker (Serwist)
└── next.config.ts       # Next.js + Serwist config
```

---

## Deployment

The app is designed to deploy on **Vercel**.

1. Push your branch to GitHub
2. Import the repo in Vercel
3. Set environment variables (see above)
4. Deploy

The service worker is only enabled in production mode (`NODE_ENV=production`), so it compiles during `next build`.

---

## Database Migrations

Migrations are in `supabase/migrations/`. Apply with the Supabase CLI:

```bash
npx supabase db push
```

Or run the SQL files manually in your Supabase SQL editor.

---

## License

MIT

