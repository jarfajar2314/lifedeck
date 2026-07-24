# Product Requirement Document (PRD)

## LifeDeck — Personal & Household Command Center PWA

**Document Version:** 6.1  
**Project Name:** LifeDeck  
**Status:** In Development  
**Date:** July 24, 2026  

---

## 1. Executive Summary & Product Vision

### 1.1 Problem Statement
Fragmented utility apps (separate apps for expenses, task managers, and note pads) introduce context-switching fatigue and friction. Furthermore, personal tracking tools break down when trying to coordinate household finances, shared grocery lists, and family notes with a spouse or partner. Traditional apps also lack deep relationship reasoning—treating notes, tasks, and expenses as isolated silos rather than an interconnected picture of life.

### 1.2 Product Vision
LifeDeck is an all-in-one, mobile-first Personal & Household Command Center built around zero-friction capture and real-time collaboration. It unifies Expense Logging, Task Management, and Micro-Notes into a single, offline-first dashboard.

Powered by a Universal Command Parser, users can type or tap a single input bar to route data in under 3 seconds and sync seamlessly across shared family spaces.

### 1.3 Key Objectives & Metrics
- **Universal Capture Speed:** Average time to log an expense, task, or note is < 3 seconds.
- **Zero Network Dependency:** 100% offline functionality for local creation via IndexedDB with automatic cloud sync.
- **Frictionless Household Sync:** Multi-user collaboration for couples/families with < 3s cross-device latency via SSE + PostgreSQL LISTEN/NOTIFY, with 10s polling fallback.
- **Payment Source Routing:** Natural language account parsing (`25k lunch @gopay`) resolves tagged accounts to tracked payment sources.
- **Self-Service Settings:** In-app user menu for theme, currency, default payment account, and space management.
- **Graph-Powered AI Insights (Dev Tooling):** Graphify maps the codebase AST, routes, and schemas so AI coding assistants can navigate the full project with zero context waste.
- **Email & Password Authentication:** Standard sign-up and sign-in with email and password.
- **High Accessibility Standards:** 100% WCAG 2.1 AA compliance and mobile thumb-zone ergonomics.

---

## 2. User Stories & Scope

| Module | As a... | I want to... | So that... |
| :--- | :--- | :--- | :--- |
| **Universal Bar** | Mobile User | Type `25k lunch`, `todo Buy groceries`, or `note Idea for project` in one input box | I don't have to switch tabs to log different types of information. |
| **AI Assistant** | Busy User | Ask natural language questions like *"What's connected to our vacation plan?"* | The AI uses Graphify to trace expenses, tasks, and notes tied to that project instantly. |
| **Finances** | Mobile User | Tap a custom numeric keypad or top category chips | I can record cash/e-wallet transactions with one thumb. |
| **Collaboration** | Partner / Spouse | Share a "Home" space with my spouse via invite code | We can track shared expenses, joint grocery lists, and house notes together. |
| **Realtime Sync** | Partner / Spouse | See immediate dashboard updates when my spouse logs a transaction or checks off a task | We stay aligned on household status without texting updates. |
| **Space Selector** | Multi-space User | Toggle effortlessly between Personal and Shared Home spaces | I keep my private expenses separate from family budgets. |
| **Tasks** | Busy User | Quickly add and swipe off daily to-dos | I can keep my day organized without heavy project management bloat. |
| **Notes** | Thinker | Jot down quick micro-notes or scratchpad thoughts | I don't lose fleeting ideas or important reference snippets. |
| **System** | Offline User | Capture data while offline in remote areas | The app saves locally immediately and syncs to Supabase when reconnected. |
| **Account Tagging** | Finance User | Type `25k lunch @gopay` to attach a payment source | Transactions are automatically categorized by account without extra taps. |
| **Balance Tracking** | Finance User | See my GoPay balance decrease by 25,000 when I log `25k lunch @gopay` | I know how much money is left in each payment source without checking a separate app. |
| **Account Suggestion** | Finance User | Type `@` in the command bar and see a popover of my accounts filtered by what I type | I don't need to memorize account names — autocomplete guides me. |
| **Create on Miss** | Finance User | Type `@newaccount` and get a "Create & Retry" button when no account matches | I can create a missing account inline without leaving the expense flow. |
| **Settings** | User | Open a user menu to adjust theme, currency, and default payment | I can tailor the app to my preferences without leaving the dashboard. |

---

## 3. UI/UX, Style Preferences & Design Guidelines

### 3.1 Design System & Tooling
- **Component Library:** Built with Shadcn UI components and Tailwind CSS for rapid, consistent utility styling.
- **Styling Skill Integration:** Developers must run `npx skills add Leonxlnx/taste-skill` during layout, UI construction, and styling implementation to ensure high-grade design taste, refined spacing, subtle micro-interactions, and modern aesthetic polish.

### 3.2 Mobile-First Ergonomics & UX Principles
- **Thumb Zone Optimization:** All primary interaction points (Universal Input Bar, Keypad, Navigation Switcher) are anchored at the bottom half of the mobile viewport for comfortable single-hand usage.
- **Touch Target Size:** Minimum touch target size of 48px × 48px for all buttons, chips, and interactive cards.
- **Haptic Feedback:** Subtle vibration cues (via Web Vibration API) on keypad taps, task completion swipes, and transaction saves.
- **Low-Friction Animations:** Micro-transitions (150ms–200ms) for drawer slide-ups, card swipes, and state updates using Framer Motion / Tailwind animate.

### 3.3 Selectable Color Themes

LifeDeck uses a two-tier theme system: **Base modes** (Dark / Amoled / Light) with optional **Accent** presets, plus **Predefined themes** that set all colors independently.

**Theme Key Storage:** A single `themeKey` string is persisted in `localStorage` and synced to `profiles.themePreference`. Format:
- `"dark+emerald"`, `"light+violet"`, `"oled+pink"` — base mode + accent
- `"pink-power"`, `"royal-purple"` — predefined themes (no accent sub-option)

**Base Modes (3):**
- **Dark (Default):** Deep slate/zinc dark palette (`#09090b`) to reduce eye strain and battery usage on mobile OLED screens.
- **Light:** High-contrast crisp white/gray theme for clear daylight outdoor visibility.
- **OLED Pitch Black:** True dark theme (`#000000`) for maximum energy efficiency on mobile OLED displays.

**Accent Presets (4, available when a base mode is active):**
- Emerald Green (Financial focus) — `oklch(0.72 0.18 160)`
- Electric Violet (Productivity focus) — `oklch(0.68 0.22 290)`
- Ocean Cyan (Calming focus) — `oklch(0.72 0.18 195)`
- Vibrant Pink (Energetic focus) — `oklch(0.68 0.22 350)`

**Predefined Themes (2):**
- **Pink Power** — Light pink background (`oklch(0.98 0.015 330)`), vibrant pink primary (`oklch(0.68 0.24 330)`), bright cyan secondary (`oklch(0.6 0.2 190)`), full tree of CSS variables set inline via JS.
- **Royal Purple** — Light purple background (`oklch(0.97 0.02 270)`), vibrant purple primary (`oklch(0.55 0.22 270)`), bright yellow secondary (`oklch(0.72 0.2 80)`), full tree of CSS variables set inline via JS.

**Theme-Aware Semantic Colors:**
A `--success` CSS variable (`oklch(0.55 0.18 142)`) is added alongside `--destructive`. Components that show income/complete states use `text-success` / `bg-success` instead of hardcoded `text-emerald-500` / `bg-emerald-500`, so they adapt to any theme.

### 3.4 Accessibility (a11y) Standards
- **Contrast Compliance:** All text and icon elements strictly meet WCAG 2.1 AA contrast ratios.
- **Screen Reader Support:** Full ARIA labels on custom keypad inputs, space switchers, and gesture targets.
- **Keyboard Navigation:** Native focus outlines and keyboard shortcuts for web desktop fallback users.

---

## 4. Universal Command Parser (The Core Engine)

The bottom sticky bar in LifeDeck acts as a universal router:

```
┌─────────────────────────────────────┐  
│ Universal Command Bar (Input)       │  
└──────────────────┬──────────────────┘  
                   │  
      ┌────────────┼────────────┐  
      │ (Parses String)         │  
      ▼            ▼            ▼  
┌───────────┐ ┌───────────┐ ┌───────────┐  
│ Amount /  │ │ "todo "   │ │ "note "   │  
│ Currency  │ │ Prefix    │ │ or Text   │  
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘  
      │             │             │  
      ▼             ▼             ▼  
[Expense Mod]  [Task Mod]   [Note Mod]  
```

### Routing Rules Logic

1. **Expense Rule:** If the input starts with a number or currency shorthand (e.g., `25k`, `150k`, `$15`), route to Transactions.
   - *Example:* `25k lunch @gopay` ➔ Amount: 25,000, Category: Food, Account: Gopay.
- The `@account` tag is resolved to an `accountId` via Dexie lookup scoped to the current space.
- If no `@` tag is provided, the user's default account for that space (from `space_members.default_account_id`) is used.
- **Inline Account Suggestion Popover:** When the input contains `@`, the CommandBar detects the partial account name after it and shows a floating popover below the input with matching accounts from the current space. Clicking or tapping a suggestion replaces the partial `@` tag with the full account name. If no account matches the partial name, the popover shows a "+ Create" button that creates the account via `POST /api/accounts` then retries the transaction. Case-insensitive matching is used throughout.
2. **Task Rule:** If the input starts with `todo`, `task`, or `[]`, route to Tasks.
   - *Example:* `todo Buy milk tomorrow` ➔ Task: Buy milk, Due: Tomorrow.
3. **Note Rule:** If the input starts with `note` or is plain text without monetary values, route to Quick Notes.
   - *Example:* `note Wifi password is 1234` ➔ Note body saved with current timestamp.

---

## 5. AI-Assisted Development with Graphify

LifeDeck uses Graphify exclusively as a **developer tool** — an AI coding assistant that maps the codebase into a queryable knowledge graph.

```
┌─────────────────────────────────────────────────────────────────────────┐  
│ GRAPHIFY — AI DEVELOPMENT ASSISTANT                                    │  
│                                                                         │  
│ ┌─────────────────────────────────────────────────────────────────┐     │  
│ │ Maps code, AST, SQL schemas, API routes into graph.json         │     │  
│ │ Zero token waste when AI coding in Claude / Cursor / Gemini     │     │  
│ └─────────────────────────────────────────────────────────────────┘     │  
└─────────────────────────────────────────────────────────────────────────┘  
```

### 5.1 Usage
- Developers run `uv tool install graphifyy` and `graphify install --project` to index the LifeDeck codebase, API routes, database schemas, and documentation.
- AI coding assistants (Claude Code, Cursor, Gemini CLI) type `/graphify` to instantly traverse code relationships, pinpoint dependencies, identify "god nodes", and execute changes with full architectural context — without blowing through LLM context limits.

---

## 6. Household Collaboration & Shared Spaces Specification

### 6.1 Spaces Architecture
Data within LifeDeck is scope-bound to a Space:
- **Personal Space:** Created automatically for every user; strictly private.
- **Shared Space (e.g., "Home & Family"):** Shared space accessible by invited members (e.g., husband and wife).

### 6.2 Invitation & Onboarding Flow
1. **Generate Invite:** Owner clicks "Invite Partner" inside Space Settings to generate a 6-digit code or direct link (`lifedeck.app/join?code=HOME-8X92`).
2. **Accept Invite:** Partner enters code or opens link to instantly join `space_members`.
3. **Creator Attribution:** Every shared transaction, task, or note displays a small avatar/badge indicating who created or modified the record.

### 6.4 User Settings & Preferences
- **User Menu:** Avatar/name in the dashboard header opens a bottom-sheet settings drawer.
- **Theme & Accent:** Dark/Light/OLED mode + Emerald/Violet/Cyan accent, persisted to `profiles.theme_preference` and `profiles.accent_color` (synced across devices).
- **Currency:** Default currency per user stored in `profiles.currency`.
- **Default Payment Account:** Per-space default account stored in `space_members.default_account_id`.
  - When a user creates an expense without an `@account` tag, it assigns to this default account.
  - The `default_account_id` column references `accounts(id)` and is nullable.
  - The Default Payment section in UserMenu displays each account's current balance inline.  

### 6.3 Cross-Device Sync Infrastructure
- Offline-first: writes go to local Dexie.js (IndexedDB) instantly, then sync to PostgreSQL via `/api/sync`.
- Sync Queue: operations enqueue globally, flush after 2s debounce (or immediately on sign-out).
- True realtime: after `/api/sync` writes to PostgreSQL, it executes `NOTIFY sync_update, payload`. A shared SSE manager (`lib/sse-manager.ts`) maintains a persistent pg `LISTEN` connection and pushes events to connected browser clients.
- Fallback: `useMultiSync` polls `pullAll()` every 10 seconds (tab-visibility aware) if SSE disconnects.

---

## 7. Technical Architecture & Stack

```
┌─────────────────────────────────────────────────────────────┐  
│ LIFEDECK FRONTEND (PWA)                                     │  
│                                                             │  
│ ┌─────────────────────────────────────────────────────┐     │  
│ │ Next.js App Router + Tailwind CSS + Shadcn UI       │     │  
│ │ (Taste-Skill Guidelines + Graphify AI Interface)    │     │  
│ └──────────────────────────┬──────────────────────────┘     │  
│                            │                                │  
│ ┌──────────────────────────▼──────────────────────────┐     │  
│ │ Local Repository / Offline Store                    │     │  
│ │ (Dexie.js / IndexedDB)                              │     │  
│ └──────────────────────────┬──────────────────────────┘     │  
└────────────────────────────┼────────────────────────────────┘  
                             │ (Async Worker & Supabase Realtime)  
                             ▼  
┌─────────────────────────────────────────────────────────────┐  
│ BACKEND & INFRASTRUCTURE                                    │  
│                                                             │  
│ ┌───────────────────────┐         ┌───────────────────────┐ │  
│ │ Next.js API Routes    │         │ Better Auth Engine    │ │  
│ └───────────┬───────────┘         └───────────┬───────────┘ │  
│             │                                 │             │  
│             ├─────────────────────────────────┘             │  
│             ▼                                 ▼             │  
│ ┌───────────────────────┐         ┌───────────────────────┐ │  
│ │ Supabase PostgreSQL   │         │ Graphify Engine /     │ │  
│ │ + Realtime + RLS      │         │ Knowledge Graph API   │ │  
│ └───────────────────────┘         └───────────────────────┘ │  
└─────────────────────────────────────────────────────────────┘  
```

| Layer | Selected Tech | Reason |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | High-performance React framework with serverless routes. |
| **UI & Styling** | Tailwind CSS + Shadcn UI | High-accessibility component primitives; styled using Leonxlnx/taste-skill. |
| **AI Dev Assistant** | Graphify (`graphifyy`) | Codebase knowledge graph for AI coding assistants to navigate the project with full context. |
| **PWA Engine** | `@serwist/next` | Handles service worker caching, push capability, and offline installation. |
| **Local DB** | Dexie.js (IndexedDB) | Instant local reads/writes (< 50ms) before remote sync. |
| **Auth** | Better Auth | Email & password sign-up and sign-in. |
| **Cloud DB & Sync** | Supabase (PostgreSQL + Realtime) | Managed relational database with built-in WebSocket subscriptions and Row-Level Security. |

---

## 8. Comprehensive PostgreSQL Schema Design

```sql
-- 1. Profiles Table  
CREATE TABLE IF NOT EXISTS public.profiles (  
  id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,  
  display_name TEXT,  
  avatar_url TEXT,  
  currency TEXT NOT NULL DEFAULT 'IDR',  
  monthly_budget NUMERIC(12, 2) DEFAULT 0.00,  
  theme_preference TEXT DEFAULT 'dark',  
  accent_color TEXT DEFAULT 'emerald',  
  created_at TIMESTAMPTZ DEFAULT NOW(),  
  updated_at TIMESTAMPTZ DEFAULT NOW()  
);  

-- 2. Spaces Table (Collaboration Units)  
CREATE TABLE IF NOT EXISTS public.spaces (  
  id TEXT PRIMARY KEY,  
  name TEXT NOT NULL,  
  invite_code TEXT NOT NULL,  
  personal BOOLEAN NOT NULL DEFAULT FALSE,  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  

-- 3. Space Memberships  
CREATE TABLE IF NOT EXISTS public.space_members (  
  id TEXT PRIMARY KEY,  
  space_id TEXT NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,  
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',  
  default_account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,  
  joined_at TIMESTAMPTZ DEFAULT NOW(),  
  created_at TIMESTAMPTZ DEFAULT NOW(),  
  UNIQUE(space_id, user_id)  
);  

-- 4. Payment Accounts Table  
CREATE TABLE IF NOT EXISTS public.accounts (  
  id TEXT PRIMARY KEY,  
  space_id TEXT NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  name TEXT NOT NULL,  
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,  
  is_default BOOLEAN DEFAULT FALSE,  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  

-- 5. Categories Table  
CREATE TABLE IF NOT EXISTS public.categories (  
  id TEXT PRIMARY KEY,  
  space_id TEXT NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  name TEXT NOT NULL,  
  icon TEXT,  
  color TEXT,  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  

-- 6. Transactions Table  
CREATE TABLE IF NOT EXISTS public.transactions (  
  id TEXT PRIMARY KEY,  
  space_id TEXT NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,  
  account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,  
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,  
  amount NUMERIC(12, 2) NOT NULL,  
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),  
  note TEXT,  
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  

-- 7. Tasks Table  
CREATE TABLE IF NOT EXISTS public.tasks (  
  id TEXT PRIMARY KEY,  
  space_id TEXT NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,  
  assigned_to TEXT REFERENCES "user"(id) ON DELETE SET NULL,  
  title TEXT NOT NULL,  
  is_completed BOOLEAN DEFAULT FALSE,  
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',  
  due_date TIMESTAMPTZ,  
  completed_at TIMESTAMPTZ,  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  

-- 8. Notes Table  
CREATE TABLE IF NOT EXISTS public.notes (  
  id TEXT PRIMARY KEY,  
  space_id TEXT NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,  
  content TEXT NOT NULL,  
  tags TEXT[],  
  is_pinned BOOLEAN DEFAULT FALSE,  
  created_at TIMESTAMPTZ DEFAULT NOW(),  
  updated_at TIMESTAMPTZ DEFAULT NOW()  
);  

-- Row-Level Security (RLS) Policies  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;  

CREATE POLICY "Users can access transactions in joined spaces" ON public.transactions  
  FOR ALL USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()::TEXT));  

CREATE POLICY "Users can access tasks in joined spaces" ON public.tasks  
  FOR ALL USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()::TEXT));  

CREATE POLICY "Users can access notes in joined spaces" ON public.notes  
  FOR ALL USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()::TEXT));  

CREATE POLICY "Users can access accounts in joined spaces" ON public.accounts  
  FOR ALL USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()::TEXT));  

CREATE POLICY "Users can access categories in joined spaces" ON public.categories  
  FOR ALL USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()::TEXT));  

CREATE POLICY "Users can view spaces they belong to" ON public.spaces  
  FOR SELECT USING (id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()::TEXT));  

CREATE POLICY "Users can view members of their spaces" ON public.space_members  
  FOR SELECT USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()::TEXT));
```

---

## 9. Implementation Roadmap

### ✅ Phase 1: Architecture, Theme Engine & Graphify Dev Setup
- ✅ Initialize Next.js 16 + Tailwind CSS v4 + Shadcn UI (base-nova)
- ✅ Apply Leonxlnx/taste-skill UI guidelines & theme provider (Dark/Light/OLED, Emerald/Violet/Cyan accents)
- ✅ Install Graphify skill for AI coding assistance
- ✅ Better Auth v1.6.24 setup with email & password (sign-up + sign-in, PostgreSQL via pg.Pool)
- ✅ Dexie.js local tables setup for Offline-First capability
- ✅ Serwist PWA integration (disabled in dev mode)

### ✅ Phase 2: Universal Parser & UI Ergonomics
- ✅ Universal Command Input (parses expense/task/note prefixes)
- ✅ Numeric Touch Keypad (ExpenseKeypad in bottom drawer)
- ✅ Task list with toggle/delete
- ✅ Quick Notes with pin/delete
- ✅ Transaction list (view, edit, delete via bottom sheet)
- ✅ Space Selector (create, join, switch spaces)
- ✅ Custom numeric keypad for expense logging

### ✅ Phase 3: Collaboration & Supabase Sync
- ✅ PostgreSQL schema applied (profiles, spaces, space_members, accounts, categories, transactions, tasks, notes)
- ✅ Better Auth tables (user, session, account, verification)
- ✅ RLS policies on all tables (auth.uid()::TEXT)
- ✅ Space Switcher & invite code flow
- ✅ Sync layer: offline queue (2s debounce flush), camelCase↔snake_case mapping, pull on auth change
- ✅ Cross-device sync: periodic polling (10s interval, respects Page Visibility)
- ✅ Supabase Realtime integration (broadcast channel for live sync notifications)

### ✅ Phase 4: Dashboard Integration & Polish
- ✅ LifeDeck Dashboard view (Money, Tasks, Notes cards with totals)
- ✅ Accessibility (a11y) audit — WCAG 2.1 AA, ARIA labels, skip-to-content, focus management
- ✅ Theme contrast verification across all four themes
- ✅ Mobile-first responsive layout with thumb-zone targets

### ✅ Phase 5: Payment Parsing, User Settings & True Realtime

**Status:** ✅ Completed

- ✅ **Payment Source Parser** — `25k milk @gopay` resolves `@gopay` to an `accountId` via Dexie lookup; ExpenseKeypad gets a payment source selector dropdown; falls back to user's default account if no `@` tag.
- ✅ **User Menu & Settings Drawer** — Bottom-sheet triggered by avatar/name in header; profile info, theme/accent toggles, currency selector, default account per space, space invite settings, sign out.
- ✅ **True Realtime via SSE + PostgreSQL LISTEN/NOTIFY** — Sync API emits `NOTIFY` after writes; shared SSE manager pushes events to connected browser clients; polling remains as 10s fallback.

### 🔄 Phase 6: Account Balance Tracking, Inline Suggestions & Shared Space Fix

**Status:** In Progress

**Overview:** Three interconnected features that complete the finance loop and fix a critical collaboration bug.

---

#### 6A. Balance Deduction on Transaction Create

**Goal:** Expenses deduct from the tagged account's balance; income adds to it.

**DB Change:**
```sql
ALTER TABLE public.accounts ADD COLUMN balance NUMERIC(12, 2) NOT NULL DEFAULT 0;
```

**Server-side Logic (`POST /api/transactions`):**
| Transaction Type | Balance Effect |
|---|---|
| `expense` | `balance = balance - amount` |
| `income` | `balance = balance + amount` |
| `transfer` | TBD — deduct from source, add to target |

- Balance update happens inside the same request within a single DB transaction (BEGIN/COMMIT) using `pg.Pool` client query.
- Only `accountId` on the transaction is needed — no new fields.

**Client-side Updates:**
| Component | Change |
|---|---|
| `lib/db.ts` — `Account` interface | Add `balance: number` field |
| `components/expense-keypad.tsx` | Account chips display `GoPay (Rp450K)` — balance formatted alongside name |
| `components/transaction-list.tsx` | Each row shows an `@account` tag badge next to the amount |
| `components/user-menu.tsx` | Default Payment section shows balances next to each account name |

**Case-Insensitive Account Matching:**
All account resolution throughout the app uses:
```ts
accounts.find(a => a.name.toLowerCase() === accountName.toLowerCase())
```
Required locations:
- `lib/command-parser.ts` — already produces `{ account?: string }` output; matching must be case-insensitive
- `components/dashboard.tsx` — `handleExpense()` resolves account names before posting
- Any other account name → ID resolution path

---

#### 6B. Inline Account Suggestion Popover (Command Bar)

**Goal:** When the user types `@` in the CommandBar, a floating popover shows matching accounts as a typeahead, with a create-on-miss fallback.

**Flow:**
1. User types `25k lunch @go` into the CommandBar
2. A floating popover appears below the input, positioned absolutely above the keypad/drawer area
3. Popover shows filtered list of accounts where `name` includes the partial after `@` (case-insensitive)
4. User taps a suggestion → `@go` is replaced with `@GoPay` in the input
5. If no accounts match → popover shows: *"No accounts match '@go'"* with a **"+ Create '@go'"** button
6. Tapping "+ Create" calls `POST /api/accounts { name: "go", space_id }`, then replaces `@go` with `@Go` in the input
7. Hitting Enter with an unmatched `@account` shows a toast: *"Account 'go' not found"* with a **"Create & Retry"** button that creates the account and re-submits the transaction

**Implementation:**
- `components/command-bar.tsx` receives `accounts: Account[]` prop from Dashboard
- On input change, regex detects `@(\w*)$` — extracts partial account name
- Filter logic: `accounts.filter(a => a.name.toLowerCase().includes(partial.toLowerCase()))`
- Popover uses Shadcn's `Popover` or a simple absolutely-positioned `div` with `shadow-lg` and `rounded-lg`
- Each suggestion row: account name + formatted balance (e.g., `GoPay — Rp450K`)
- Create-on-miss: optimistically adds account to local `accounts` array after API success

---

#### 6C. Shared Space Join Fix

**Goal:** Fix broken `joinSpace()` so users can actually join shared spaces.

**Current Bug:**
`joinSpace()` in `hooks/use-spaces.ts` reads from `store.list("spaces")` — which only returns spaces the current user is already a member of. This makes it impossible to find and join a space by invite code.

**Fix:**
Replace local list lookup with a dedicated API endpoint:

```ts
// hooks/use-spaces.ts — joinSpace()
const res = await fetch("/api/spaces/join", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ inviteCode }),
});
const { id, name } = await res.json();
// Add to optimistic cache, set as current space
```

**API Route (`app/api/spaces/join/route.ts`):**
1. Validates `inviteCode` against `spaces.invite_code`
2. Inserts `space_members` row for the requesting user
3. Returns `{ id, name }` of the joined space
4. Returns 404 if invite code not found
5. Returns 409 if already a member

**Client-side Changes:**
- `hooks/use-spaces.ts` — `joinSpace()` uses `fetch POST /api/spaces/join` instead of local Dexie lookup
- `components/invite-dialog.tsx` — shows loading spinner while join request is in flight (disabled button + spinner icon)
- On server error, toast shows the error message; user can retry

---

#### 6D. UI Balance Visibility

**Goal:** Users see account balances at every touchpoint.

| Component | What It Shows |
|---|---|
| **ExpenseKeypad** account selector | Each chip: `GoPay (Rp450K)` |
| **TransactionList** row | Small `@GoPay` badge next to amount |
| **UserMenu → Default Payment section** | Each account: `GoPay — Rp450K` |
| **CommandBar suggestion popover** | Each result: `GoPay — Rp450K` |

**Balance Formatting:**
- Use `Intl.NumberFormat` with the user's selected currency from `profile.currency`
- Zero balance: `GoPay (Rp0)` — show it; don't hide
- Negative balance: `GoPay (-Rp5K)` — prefix with minus sign

---

### 📋 Phase 7: Offline-First & Deployment Preparation

**Status:** ❌ Not Started (moved down; Phase 6 takes priority)

- Dexie.js (IndexedDB) as primary local store with instant reads/writes (< 50ms) before remote sync
- Sync queue: operations enqueue locally, flush after 2s debounce (or immediately on sign-out)
- Background sync: service worker handles pending mutations when connectivity resumes
- Conflict resolution: last-write-wins with server timestamp authority
- Deployment to Vercel or custom domain with environment variable provisioning
