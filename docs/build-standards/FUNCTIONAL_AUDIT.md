# Functional integration and performance audit

Date: 9 September 2026. Scope: every authenticated page plus the shared shell.
Method: source review of the rendered components and hooks, a signed-in browser
pass over all ten pages at 1440x1200 and 390x844, request counting per page, a
rolled-back database probe of the new safeguards, and the automated type/test
suites.

## Audit table

| Page | Control or workflow | Data source or action | Status | Verification |
| --- | --- | --- | --- | --- |
| Shell | Navigation, search, theme, sign out | Router / command palette / Supabase auth | Working | Browser pass, all ten routes reachable |
| Shell | Session gate | `workspace_members` + `workspaces` (now one query) | Improved | Waterfall removed, skeleton added |
| Dashboard | Period tabs, month picker, Log activity, Edit target, table search/filter/export, Schedule block | `daily_activity_log`, `monthly_targets`, `deals` | Working | Browser pass, no console errors |
| Pipeline | New deal, status change, won handoff | `deals`, won-deal trigger | Working | Trigger is idempotent per deal (`projects.deal_id` unique) |
| Accounts | Expand row, add contact | `accounts`, `contacts` | Working | Email field now validated |
| Accounts | Linked deals, projects, outstanding balance | Nested `deals`/`projects`/`invoices` | Added | Rendered in expanded row |
| Projects | Phases, tasks, assignees, status | `projects`, `project_phases`, `tasks`, `task_assignees` | Working | Status cascade invalidates project and phase queries |
| Workload | Weekly allocations | `resource_allocations` (unique per person/project/week) | Working | Browser pass |
| Activity | Daily log, weekly review | `daily_activity_log`, `weekly_reviews` (unique per user/day) | Working | Uniqueness prevents double counting |
| Quotes | Status change, PDF, convert to invoice | `quotes`, `quote_line_items`, `invoices` | Fixed | Duplicate conversion now blocked; converted quotes show their invoice number |
| Invoicing | Expand, status, PDF, record payment | `invoices`, `invoice_line_items`, `payments` | Fixed | Overpayment blocked on the server; outstanding balance shown |
| Statements | Account picker, PDF | Derived from invoices and payments | Working | Refreshes after payment and invoice changes |
| Settings | Team list, invite, copy link, revoke | `workspace_members`, `workspace_invitations` | Working | Browser pass |
| Settings | Your profile name | `profiles` (own row only) | Added | Saves and updates the shell name |
| Auth | Sign in, register, invite acceptance | Supabase auth + invitation function | Working | Gate redirects unauthenticated users to `/auth` |

## Changes made in this pass

Database (migration `20260909100000`, additive only):

- Unique index so one quote can produce only one invoice.
- Server trigger rejecting payments above the invoice total.
- Indexes on the workspace, parent and date columns the app filters and orders by.

Application:

- Quote and invoice lists now fetch line items and payments nested with the
  parent row, removing the per-row request fan-out.
- Payments, invoice changes and quote conversion invalidate the statement and
  workspace payment queries, so pages stay in step without a manual refresh.
- Record payment shows the outstanding balance, caps the amount, and is
  disabled once an invoice is settled.
- Account rows show linked deals, projects and outstanding balance.
- Contact email is validated before saving.
- Signed-in users can update their own display name.
- The authenticated gate resolves membership in one query and shows a stable
  skeleton instead of a blank frame.

## Measurements

Database requests on a warm signed-in load, before and after:

| Page | Before | After |
| --- | --- | --- |
| Accounts | 6 | 4 |
| Quotes | 5 | 4 |
| Invoicing | 5 | 4 |
| Statements | 4 | 3 |

Counts are per page load with existing data volumes; the quote and invoice
reductions scale with row count, since the removed requests were per row.

## Verification performed

- `tsgo --noEmit`: clean.
- `vitest run`: 33 tests pass, including new invoice balance tests.
- Signed-in browser pass over all ten pages: no console or page errors.
- Mobile pass at 390x844 on the invoicing page.
- Rolled-back database probe confirmed the duplicate-invoice and overpayment
  guards both reject the second write, leaving no test records behind.

## Known limitations

- Weekly capacity on Workload is a fixed 40 hours, not a per-person setting.
  Tracked in the exception register.
- Payment guard allows a one cent tolerance for rounding.
- Write workflows were exercised through code review and the database probe
  rather than by creating live records in the production workspace.
- Pre-existing database linter notices about security-definer helper functions
  remain; the function added in this pass is not callable by signed-in users.
