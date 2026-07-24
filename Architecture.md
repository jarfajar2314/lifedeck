# Architecture

## Overview

LifeDeck is a Next.js 16 App Router PWA with per-entity API endpoints communicating with a Supabase PostgreSQL database. The client uses an optimistic data-store with SSE-based realtime sync.

---

## File Structure

```
.
├── app/
│   ├── (auth)/sign-in/       Sign-in page
│   ├── (auth)/sign-up/       Sign-up page
│   ├── api/
│   │   ├── accounts/         Account CRUD + balance recalculate
│   │   ├── auth/             Better Auth catch-all route
│   │   ├── categories/       Category CRUD
│   │   ├── category-keywords/  Category keyword mappings
│   │   ├── data/             Legacy monolithic sync endpoint (deprecated)
│   │   ├── notes/            Note CRUD
│   │   ├── profiles/         Profile CRUD
│   │   ├── spaces/           Space CRUD + join
│   │   ├── spaces/members/   Space member CRUD
│   │   ├── sse/              Server-Sent Events for realtime sync
│   │   ├── tasks/            Task CRUD
│   │   └── transactions/     Transaction CRUD
│   ├── offline/              PWA offline fallback page
│   ├── transactions/         Full transaction list page
│   ├── layout.tsx            Root layout (theme, auth, toaster)
│   ├── page.tsx              Dashboard entry
│   └── globals.css           Global Tailwind styles
├── components/
│   ├── ui/                   Shadcn UI primitives
│   ├── dashboard.tsx         Main dashboard orchestrator
│   ├── command-bar.tsx       Universal command input
│   ├── expense-keypad.tsx    Numeric keypad drawer
│   ├── transaction-list.tsx  Transaction list (used in dashboard + /transactions)
│   ├── transaction-detail.tsx  Edit/delete transaction sheet
│   ├── task-list.tsx         Task list
│   ├── task-detail.tsx       Task edit sheet
│   ├── note-list.tsx         Note list
│   ├── note-detail.tsx       Note edit sheet
│   ├── account-detail.tsx    Account detail drawer
│   ├── user-menu.tsx         Settings drawer
│   ├── space-selector.tsx    Space switcher
│   ├── auth-provider.tsx     Auth context provider
│   ├── theme-provider.tsx    Theme context provider
│   ├── theme-meta.tsx        Dynamic theme-color meta tag
│   └── offline-indicator.tsx Offline queue status banner
├── hooks/
│   ├── use-db.ts             Data hooks (useTransactions, useAccounts, etc.)
│   ├── use-spaces.ts         Space + membership state
│   └── use-realtime.ts       SSE connection + invalidate
├── lib/
│   ├── data-store.ts         Optimistic client cache + sync engine
│   ├── categories.ts         matchCategory() helper
│   ├── command-parser.ts     Universal command parser
│   ├── db.ts                 TypeScript interfaces for all entities
│   ├── auth.ts               Better Auth server instance
│   ├── auth-client.ts        Better Auth client config
│   ├── pool.ts               pg.Pool with IPv4 DNS fix
│   ├── sse-manager.ts        Server-side SSE manager with pg LISTEN/NOTIFY
│   ├── api-utils.ts          Shared API helpers (auth, snake/camel, error handling)
│   ├── haptics.ts            Web Vibration API wrapper
│   ├── uid.ts                Unique ID generator
│   ├── utils.ts              cn() helper (clsx + tailwind-merge)
│   └── supabase.ts           Supabase client config
├── supabase/migrations/      PostgreSQL schema migrations
├── public/                   Static assets (icons, manifest, service worker)
├── AGENTS.md                 AI agent operational directives
├── Architecture.md           This file
├── PRD.md                    Product requirement document
└── README.md                 Project README
```

---

## API Endpoints

All endpoints are per-entity (no monolithic `/api/sync`). Each supports:
- `GET` — list by `?spaceId=`
- `POST` — upsert (insert or update by `id`)
- `PUT /[id]` — partial update
- `DELETE /[id]` — delete

| Endpoint | Entity | Notes |
|----------|--------|-------|
| `GET/POST /api/accounts` | Account | POST upserts; balance recalculated by transaction writes |
| `PUT/DELETE /api/accounts/[id]` | Account | Updates/deletes |
| `POST /api/accounts/recalculate` | — | Replays all transactions to rebuild account balances |
| `GET/POST /api/categories` | Category | Space-scoped categories |
| `GET/POST /api/category-keywords` | CategoryKeyword | Keyword→category mapping for auto-categorize |
| `GET/POST /api/transactions` | Transaction | POST inserts + updates account balance in same DB transaction |
| `PUT/DELETE /api/transactions/[id]` | Transaction | Reverses old balance effect, applies new effect |
| `GET/POST /api/tasks` | Task | |
| `PUT/DELETE /api/tasks/[id]` | Task | |
| `GET/POST /api/notes` | Note | |
| `PUT/DELETE /api/notes/[id]` | Note | |
| `GET/POST /api/spaces` | Space | |
| `POST /api/spaces/join` | — | Join by invite code; standalone endpoint |
| `GET/POST /api/spaces/members` | SpaceMember | |
| `PUT/DELETE /api/spaces/members/[id]` | SpaceMember | |
| `GET/PUT /api/profiles` | Profile | |
| `GET /api/sse` | — | SSE stream; uses pg LISTEN/NOTIFY |

### Architectural Rule

**Do NOT use monolithic endpoints.** Each entity has its own API route file under `app/api/<entity>/`. The legacy `/api/data` (single endpoint for all tables) is deprecated and should not be extended. All new entities follow the pattern:

```
app/api/<entity>/route.ts      → GET (list), POST (upsert)
app/api/<entity>/[id]/route.ts → PUT (update), DELETE
```

---

## Data Flow

### Write Path
```
Component → useTransactions/tasks/etc
  → store.mutateOptimistic()     ← updates local cache immediately
  → store.persist()              ← POST/PUT/DELETE to entity API
  → API route handler            ← inserts/updates DB + broadcasts SSE
  → SSE event received by all clients → store.invalidate() → re-fetch
```

### Transaction Balance Side Effect
```
POST /api/transactions
  → BEGIN
  → INSERT INTO transactions
  → UPDATE accounts SET balance = balance + (amount * sign)
  → COMMIT
  → SSE broadcast { tables: ["transactions", "accounts"] }

sign = expense/transfer → -1, income → +1
```

### Realtime Sync
```
Server write → sseManager.broadcast("sync", { tables: [...] })
  → pg NOTIFY "sync_update"
  → SSE manager reads NOTIFY via pg LISTEN
  → Pushes EventSource event to all connected browser clients
  → Client useRealtime hook → store.invalidate(tables)
```

---

## Key Architectural Decisions

- **Optimistic concurrency:** All mutations apply to local cache immediately, roll back on server error.
- **Per-entity API routes:** Each table has its own route file with consistent GET/POST/PUT/DELETE pattern.
- **Balance as DB column:** Account balance is stored as a column (not calculated from transactions on read) for O(1) reads. The PUT/DELETE handlers reverse the old balance effect when transactions are edited or deleted.
- **SSE over WebSockets:** Supabase Realtime WebSocket runs alongside SSE for true realtime. SSE is the primary push mechanism with pg LISTEN/NOTIFY; Supabase Realtime is the backup.
- **Transfer pairs as two rows:** A transfer creates two transaction rows (type="transfer" for source, type="income" for target). The client merges them for display via heuristic pairing (same amount + same timestamp within 2s).
- **Auto-categorize via keywords:** A `category_keywords` table maps keywords to category IDs. `matchCategory()` scans the note text at input time and at submit time for live and fallback categorization.
