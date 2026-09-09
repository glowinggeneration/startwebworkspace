# Import the WhatsApp conversation pack into Startweb

The uploaded workbook holds reviewed notes taken from conversations up to 9 September 2026: 23 client records, 10 people, 19 pieces of work, 16 next steps, 10 historical notes and 10 items that need a human decision. Nothing is written to your live data until you approve this.

## How the pack maps onto what you already have

| In the pack | Where it lands | Notes |
| --- | --- | --- |
| Accounts (23) | Client directory | Type, relationship status, main service, priority and summary stored on the client record |
| Contacts (10) | Contacts under each client | Blank emails and phone numbers stay blank |
| Projects (19) | Projects | Each linked to its client; the pack's wording (for example "Paused / payment pending") is kept as a status note, while the project itself gets Active or On hold so existing screens keep working |
| Actions (16) | Tasks inside the matching project | Owner, priority, due date and notes preserved |
| Notes (10) | New "Account notes" list on each client page | Dated historical notes, read only history |
| Review queue (10) | New "Needs a decision" page, visible to owners and admins only | Issue, evidence, decision needed and source references |

Four internal people (Thabo, Dodi, Ntokozo, Ndumiso) are recognised as teammates and become task owners instead of client contacts. Client-side owners stay as contacts.

## Rules the import follows

- Nothing invented. Blank stays blank, no prices, dates, emails or statuses are guessed.
- No quotes, invoices, payments or balances are created from this pack.
- Every record keeps its pack key and its source references, so re-running the import updates the same rows instead of creating duplicates.
- If a value already in your platform is newer or more complete, it is kept and the difference is logged in the review list.
- Everything is tied to your workspace with existing access rules unchanged.
- Statuses are treated as historical observations, so paused, delivered, at-risk or review-required records do not switch on any automatic workflow.

## Preview of what will happen

- Create 23 clients: none of these names exist yet, so no merges. Your two existing clients (including SMAIT Operations Management) are untouched.
- Create 6 client contacts. The 4 internal people are matched to existing team profiles, not created as contacts.
- Create 19 projects. Your existing 2 projects and their 23 tasks stay as they are.
- Create 16 tasks under the new projects.
- Create 10 account notes and 10 review items.
- 0 updates, 0 deletions, 0 conflicts on the current preview.
- Flagged for your attention: Dibuka relationship state, Golgotha price, Future Tech invoice amount, Football Kenya end date, and the three first-name-only clients (Blessing, Bonolo, Lebo).

## Technical detail

- Additive migration only: `import_key` and `import_source` text columns (unique per workspace) on `accounts`, `contacts`, `projects`, `tasks`; new `account_notes` and `import_review_items` tables with workspace RLS, GRANTs, and admin-only read on the review table; indexes on `(workspace_id, import_key)` and task `(project_id, due_date)`.
- Import runs as a server function (`src/lib/conversation-import.functions.ts`) with the pack data as a checked-in JSON fixture under `src/data/`, guarded by `requireSupabaseAuth` plus an owner/admin role check, using the existing idempotency helper with namespace `startweb-whatsapp-2026-09-09`.
- Two screens: a dry-run preview and commit action in Settings, and a "Needs a decision" review list. Both use existing page primitives, live queries, loading/empty/error states, disabled buttons while running, and cache invalidation after commit.
- Status mapping: project status column takes `active` or `on_hold` only; the pack's exact wording is stored alongside so nothing is lost.
- After commit: run the import a second time to prove zero new rows, verify every project points to a valid client and every task to a valid project, and check counts against the manifest.

## What I need from you

Approve this and I will apply the migration, build the preview and review screens, run the dry run, show you the counts, then commit the data.
