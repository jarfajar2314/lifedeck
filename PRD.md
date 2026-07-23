# Product Requirement Document (PRD)

## LifeDeck — Personal & Household Command Center PWA

**Document Version:** 4.0  
**Project Name:** LifeDeck  
**Status:** Approved for Implementation  
**Date:** July 23, 2026  

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
- **Frictionless Household Sync:** Multi-user collaboration for couples/families with < 500ms real-time UI updates via Supabase Realtime.
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
LifeDeck supports dynamic theme switching stored in local preference and synced across sessions:
- **Dark Mode (Default):** Deep slate/zinc dark palette (`#09090b`) to reduce eye strain and battery usage on mobile OLED screens.
- **Light Mode:** High-contrast crisp white/gray theme for clear daylight outdoor visibility.
- **OLED Pitch Black:** True dark theme (`#000000`) for maximum energy efficiency on mobile OLED displays.
- **Accent Theme Presets:** Customizable primary accent color highlights:
  - Emerald Green (Financial focus)
  - Electric Violet (Productivity focus)
  - Ocean Cyan (Calming focus)

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

### 6.3 Real-Time Sync Infrastructure
- Powered by Supabase Realtime (WebSockets).
- When User A records an entry or completes a task, a WebSocket broadcast updates User B's UI instantly without needing pull-to-refresh.

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
CREATE TABLE public.profiles (  
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  
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
CREATE TABLE public.spaces (  
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
  name TEXT NOT NULL, -- e.g., 'Personal', 'Home & Family'  
  invite_code TEXT UNIQUE DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  
  
-- 3. Space Memberships  
CREATE TABLE public.space_members (  
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',  
  joined_at TIMESTAMPTZ DEFAULT NOW(),  
  UNIQUE(space_id, user_id)  
);  
  
-- 4. Payment Accounts Table  
CREATE TABLE public.accounts (  
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  name TEXT NOT NULL,  
  is_default BOOLEAN DEFAULT FALSE,  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  
  
-- 5. Categories Table  
CREATE TABLE public.categories (  
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  name TEXT NOT NULL,  
  icon TEXT,  
  color TEXT,  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  
  
-- 6. Transactions Table  
CREATE TABLE public.transactions (  
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,  
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,  
  amount NUMERIC(12, 2) NOT NULL,  
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),  
  note TEXT,  
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  
  
-- 7. Tasks Table  
CREATE TABLE public.tasks (  
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  
  title TEXT NOT NULL,  
  is_completed BOOLEAN DEFAULT FALSE,  
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',  
  due_date TIMESTAMPTZ,  
  completed_at TIMESTAMPTZ,  
  created_at TIMESTAMPTZ DEFAULT NOW()  
);  
  
-- 8. Notes Table  
CREATE TABLE public.notes (  
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,  
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  
  content TEXT NOT NULL,  
  tags TEXT[],  
  is_pinned BOOLEAN DEFAULT FALSE,  
  created_at TIMESTAMPTZ DEFAULT NOW(),  
  updated_at TIMESTAMPTZ DEFAULT NOW()  
);  
  
-- Row-Level Security (RLS) Policies  
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;  

CREATE POLICY "Users can access transactions in joined spaces" ON public.transactions  
  FOR ALL USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()));  

CREATE POLICY "Users can access tasks in joined spaces" ON public.tasks  
  FOR ALL USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()));  

CREATE POLICY "Users can access notes in joined spaces" ON public.notes  
  FOR ALL USING (space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid()));
```

---

## 9. Implementation Roadmap

- **Phase 1: Architecture, Theme Engine & Graphify Dev Setup (Week 1)**
  - Initialize Next.js, Tailwind CSS, Shadcn UI
  - Apply Leonxlnx/taste-skill UI guidelines & theme provider
  - Install Graphify skill (`graphify install --project`) for AI coding
  - Better Auth setup with email & password (sign-up + sign-in)
  - Dexie.js local tables setup for Offline-First capability

- **Phase 2: Universal Parser & UI Ergonomics (Week 2)**
  - Build Universal Command Input parser logic
  - Develop Numeric Touch Keypad & Category Bar
  - Develop Task list & Quick Notes UI components with haptic feedback

- **Phase 3: Collaboration & Supabase Sync (Week 3)**
  - Apply Postgres schema with Spaces & RLS Policies
  - Implement Space Switcher & QR / Code Invite flow
  - Wire up Supabase Realtime subscriptions for multi-user sync

- **Phase 4: Dashboard Integration & Polish (Week 4)**
  - Assemble LifeDeck Dashboard view (Money, Tasks, Notes widgets)
  - Accessibility (a11y) audit & theme contrast verification
  - Performance verification & deployment on Vercel
