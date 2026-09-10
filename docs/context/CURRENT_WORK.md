# Current work

Last updated 10 September 2026. Keep this short and true.

## Live data snapshot

Workspace `Startweb`, four members. Records today: 24 clients, 7 contacts,
19 projects, 16 tasks, 10 account notes, 1 quote, 1 invoice, 0 deals,
0 campaigns, 10 open import review items.

Pipeline deals and campaigns are deliberately empty. Client work is tracked
through accounts, projects and tasks from the conversation import.

## In progress

**Import review decisions** — `/import-review`

- Done: approve, reject and reopen controls wired to
  `import_review_items`, owner and admin only.
- Left: the ten open items still need a human decision. Each one names the
  record, the evidence and the decision required.

## Waiting on a decision

**Security linter findings** — the remaining items are recorded as reviewed
in `docs/build-standards/EXCEPTION_REGISTER.md`. Re-run the linter before
the next release and close anything new.

## Recently finished

- Conversation import `startweb-whatsapp-2026-09-09` committed: 22 new
  clients, 7 contacts, 19 projects, 16 next steps, 10 notes. AfriBiz Future
  Tech already existed and was left untouched. The import is idempotent.
- Pipeline gained a Clients board: four stage columns derived from each
  account's relationship status, cards showing service, status, linked
  projects and open next steps. Deals and List views kept beside it.
- Campaign tracker with budget view, sidebar link under Delivery.
- Internal tables (`audit_log`, `rate_limit_hits`, `numbering_counters`)
  and internal database functions locked away from the API.
- Backend connection keys rebound twice after they went stale at sign-in.
- Live builds now explicitly receive the generated browser client's public
  backend connection values, preventing the sign-in page from losing them.

## Parked

Multi-select tags, pagination, natural-language date entry and ratings from
the supplied component sets are vendored but not wired to a screen.
