# AGENTS.md — AI Agent Operating Directives

> **CRITICAL PROTOCOL:** All AI agents (Claude Code, Cursor, Copilot, Gemini CLI, etc.) **MUST READ THIS FILE FIRST** prior to executing any user prompt or workspace operation.

---

## 1. Bootstrapping & Source of Truth

* **Read First Directive:** Every interaction/task **MUST** start by reading this `AGENTS.md` file to establish operational constraints and guidelines.
* **Master Requirement Guide:** Refer to `LifeDeck_PRD.md` as the ultimate source of truth for features, architecture, database schemas, color theme requirements, and product vision. Never invent features or architectural patterns that conflict with the PRD.

---

## 2. Codebase Exploration & Knowledge Graph (`graphify`)

* **Read-Only Graph Operations:** Use `graphify` (or `/graphify`) exclusively for reading, querying, and understanding code structures, dependency graphs, AST topologies, and cross-module relationships.
* **Graph Updates:** Do **NOT** run graph re-indexing or graph update commands unless explicitly commanded by the user (e.g., *"Update the graph"*, *"Run graphify index"*).

---

## 3. UI, UX & Styling Guidelines (`taste-skill`)

* **Taste Skill Activation:** Whenever creating, modifying, or refactoring layouts, component UI, Tailwind classes, or page structures, **MUST** use `taste-skill` (`npx skills add Leonxlnx/taste-skill`).
* **Design System Rules:**
  * Framework: **Shadcn UI** + **Tailwind CSS**.
  * Mobile-First First Principle: Target thumb-zone ergonomics with minimum **48px touch targets**.
  * Theme Compliance: Honor user-selected themes (Dark, Light, OLED Pitch Black, Emerald/Violet/Cyan accents) as specified in `LifeDeck_PRD.md`.
  * Accessibility: Ensure WCAG 2.1 AA contrast ratios and accessible Radix primitive ARIA attributes.

---

## 4. Build & Validation Rules (Strict Execution Limits)

* **DO NOT RUN Heavy Server Commands:**
  * ❌ NEVER run `npm run build` or `next build`.
  * ❌ NEVER run `npm run dev` or `next dev`.
* **Type Validation Protocol:** To verify code correctness and syntax integrity, **ONLY** run:
  ```bash
  npx tsc --noEmit
  ```
  Fix all TypeScript errors flagged by `tsc --noEmit` before concluding a task.

---

## 5. Version Control & Git Commit Best Practices

* Before committing, inspect `git status`, `git diff`, and `git log --oneline -10`; stage only intended files and never commit secrets.
* **Logical Grouping:** When asked to commit, group changed files logically into atomic, meaningful commits using **Conventional Commits** syntax:
  * `feat(...)`: New features or functionality additions.
  * `fix(...)`: Bug fixes or logic error corrections.
  * `refactor(...)`: Code restructuring without changing external behavior.
  * `style(...)`: UI layout, styling, or formatting adjustments.
  * `docs(...)`: Documentation or PRD updates.
  * `chore(...)`: Configuration or dependency updates.
* **Commit Message Standard:** Include a concise imperative summary title (max 50 chars) and a bulleted description body explaining *what* and *why*.

---

## 6. Pull Request Protocol (`gh` CLI)

When instructed to create a Pull Request:
1. **Inspect Template:** Read and parse `.github/pull_request_template.md` (or `pull_request_template.md`).
2. **Draft PR Metadata:**
   * **Title:** Follow Conventional Commits format (e.g., `feat(ui): add universal command parser to footer`).
   * **Description:** Populate every section required by the template (Summary, Changes Made, How to Test, Checklist).
3. **Execute PR via GitHub CLI:**
   ```bash
   gh pr create --title "<PR_TITLE>" --body "<PR_DESCRIPTION>"
   ```

---

## 7. Version Bumping & Release Protocol

When instructed to bump the project version:
1. **Run Version Command:**
   ```bash
   npm version patch
   ```
   *(Note: `npm version patch` automatically updates `package.json` and `package-lock.json`, and creates a git commit and version tag).*
2. **Update Documentation:** Manually check and update version strings in `README.md` and `LifeDeck_PRD.md` to keep all project documentation synchronized with the newly bumped version.

---

## 8. Additional AI Agent Guardrails & Best Practices

### 8.1 Minimal Diff Principle
* Keep edits surgical and target-focused. Avoid reformatting or changing white space in files unrelated to the prompt task.

### 8.2 Database & Schema Integrity
* Never modify IndexedDB (Dexie.js) schemas or Supabase PostgreSQL tables without checking for data sync compatibility and migration safety.

### 8.3 Secrets & Environment Safety
* **NEVER** hardcode environment variables, API keys, database connection strings, or Auth secrets into codebase files. Always reference `process.env.*`.

### 8.4 Clean Code Protocol
* Remove temporary `console.log` statements, unused imports, dead variables, and commented-out test blocks before finalizing any task.

---

## 9. Code Conventions

### 9.1 Class Merging
* Use `clsx` + `tailwind-merge` (`cn()` helper from `@/lib/utils`) for all conditional class merging. Never use template literals or `classnames` for Tailwind classes.

### 9.2 Icons
* Use **Lucide React** (`lucide-react`) for all icons. Import only the specific icons needed (tree-shakeable). Never use inline SVGs or other icon libraries.

### 9.3 Component Architecture
* Create a separate component file for any non-trivial UI element. Prefer small, focused, reusable components over monolithic files. Extract repeated patterns into shared components under `@/components/`.

### 9.4 Consistent Component Styling
* Keep styling consistent across **Button**, **Drawer**, **Toast**, and **Confirmation** dialogs:
  * Use Shadcn UI primitives (or their variants) for these components.
  * Maintain uniform spacing, border radius, font sizes, and color tokens.
  * Reuse the same component props and variants for similar states (e.g., `variant="destructive"` for delete actions).

### 9.5 Toast for Every Action
* Use **sonner** (`toast` from `sonner`) for every user-triggered action (create, update, delete, etc.). Always show success feedback or error feedback via toast. Never leave an action silent.

### 9.6 Auto-Commit After Work
* After completing any task or feature, immediately create a commit with a descriptive Conventional Commits message. Do not batch unrelated changes. See Section 5 for commit format.

### 9.7 No Auto-Push
* Commit locally only. **Never push** to remote unless explicitly asked. The user controls when changes are pushed.

