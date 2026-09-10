# Data model

Last updated 9 September 2026. Source of truth is `supabase/migrations/`.

## Tenancy

One workspace equals one tenant. Every feature table carries `workspace_id`
and is protected by RLS using the security-definer helpers:

- `is_workspace_member(user_id, workspace_id)`
- `has_workspace_role(user_id, workspace_id, role)`
- `is_client_role(user_id, workspace_id)` and
  `can_view_account(user_id, workspace_id, account_id)` for client scoping

Roles are the `workspace_role` enum: owner, admin, sales, pm, member, client.
Roles live in `workspace_members`, never on `profiles`.

Every new public table gets GRANTs in the same migration as its CREATE, then
RLS enabled, then policies.

## Tables by area

**Workspace and people** — `workspaces`, `workspace_members`,
`workspace_invitations`, `profiles` (name, job title, avatar,
`profile_completed`), `audit_log`, `rate_limit_hits`, `numbering_counters`.

**Clients** — `accounts` (type, relationship status, primary service, review
priority, summary, reference client), `contacts`, `account_notes`,
`industries`, `industry_playbooks`.

**Sales** — `deals` (value, status, next step, won and invoiced timestamps),
`packages`, `monthly_targets`, `monthly_plan_lines`, `daily_activity_log`,
`weekly_reviews`.

**Delivery** — `projects`, `project_phases`, `tasks`, `task_assignees`,
`project_templates`, `project_template_phases`, `resource_allocations`,
`deal_handoffs`, `campaigns`.

**Money** — `quotes`, `quote_line_items`, `invoices`, `invoice_line_items`,
`payments`. Invoices carry client sign-off: `signed_at`, `signed_by`,
`signed_note` (all null until the signature is recorded). `quotes`,
`invoices` and `payments` are in the live-updates publication.

**Import** — `import_review_items` (owner and admin only), plus
`import_key` / `import_source` / `source_refs` columns on imported records.

## Notable rules in the database

- `handle_deal_won` creates delivery work when a deal is marked won
- `handle_payment_change` and `recompute_invoice_paid_status` keep invoice
  status in step with payments
- `enforce_payment_within_invoice_total` blocks overpayment
- `handle_task_change` and `recompute_phase_and_project_status` roll task
  status up to phase and project
- `next_document_number` issues quote and invoice numbers per workspace year
- `handle_new_user` creates a profile; `auto_join_invited_workspaces` joins
  an invited user on first sign-in

## Campaigns (current)

`campaigns`: workspace, optional account, name, channel, status
(`planned` | `active` | `paused` | `completed`), start and end date, owner,
next action and date, `planned_cost`, `spent_cost`, notes. Tasks link to a
campaign through the nullable `tasks.campaign_id` (set null on delete).

## Internal tables and functions

`audit_log`, `rate_limit_hits` and `numbering_counters` are internal. Their
API privileges are revoked from `anon` and `authenticated`; only the
database and privileged code touch them. Internal maintenance, numbering and
timestamp functions likewise have execute revoked from the API, and the
workspace and RLS helper functions are revoked from `anon`. Invitation
preview stays readable so an invited person can see what they are joining.

Remaining linter items are recorded as reviewed in
`docs/build-standards/EXCEPTION_REGISTER.md`. Re-run the linter before each
release and close anything new.

## Data today

24 clients, 7 contacts, 19 projects, 16 tasks, 10 account notes, 1 quote,
1 invoice, 0 deals, 0 campaigns, 10 open import review items. Most client
records came from the committed conversation import and carry
`import_key = startweb-whatsapp-2026-09-09:...`.
