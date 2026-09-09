# Current work

Last updated 9 September 2026. Keep this short and true.

## In progress

**Campaign tracker with budgets** — `/campaigns`

- Done: `campaigns` table with RLS and grants, `tasks.campaign_id` link,
  `src/hooks/use-campaigns.ts`, `src/routes/_authenticated/campaigns.tsx`
  with tracker and budget views, sidebar link under Delivery.
- Left: open the page in the preview and confirm both views, empty states
  and the side panel behave at desktop and tablet width.

**Context routine** — this folder. Rules file plus living documents and work
templates. Keep them updated as part of each change.

## Waiting on a decision

**Conversation import** (`startweb-whatsapp-2026-09-09`) — dry run complete:
22 new clients, 7 contacts, 19 projects, 16 tasks, 10 account notes, 10
review items. Nothing committed. Needs the owner to approve the commit in
Settings.

**Security linter findings** — two tables without policies, ten
security-definer functions with broad execute rights. Needs review and, where
intended, an entry in the exception register.

## Recently finished

- Pipeline and Projects cleared of all records on request
- Sign-in and register redesigned to the floating split card layout
- Google sign-in enabled, unsupported social buttons removed
- Team profiles and photos loaded for the four members
- Mobile sign-in blocked with a desktop or tablet message

## Parked

Multi-select tags, pagination, natural-language date entry and ratings from
the supplied component sets are vendored but not wired to a screen.
