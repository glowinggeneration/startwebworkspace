# Startweb Workspace — Context Rules

Version 1.0 · 9 September 2026

This is the rules file for every build, fix or audit task on this project.
Read it first, then read the living documents in `docs/context/` before
writing code. `AGENTS.md` points here.

## 1. Read before you write

Order of reading for any non-trivial task:

1. `docs/context/RULES.md` (this file)
2. `docs/context/PRODUCT.md` — what the product is and who uses it
3. `docs/context/ARCHITECTURE.md` — stack, folders, boundaries
4. `docs/context/DATA_MODEL.md` — tables, tenancy, access rules
5. `docs/context/CURRENT_WORK.md` — what is in flight right now
6. `docs/context/DECISIONS.md` — settled choices, do not relitigate
7. The screen-level specs in `docs/ui-design/` and the build standard in
   `docs/build-standards/MASTER_RULES.md`

## 2. Working routine

Every unit of work runs through the same four stages.

1. **Brief** — copy `docs/context/templates/INITIAL.md` into
   `docs/context/work/<slug>.md` and fill in the goal, the screens and
   tables involved, the acceptance checks and anything explicitly out of
   scope.
2. **Plan** — expand the brief with `docs/context/templates/PLAN.md`:
   files to touch, migration, states, checks. No code before the plan.
3. **Build** — implement in small reviewable stages, reusing existing
   primitives (see section 4).
4. **Close** — run the checks in section 5, then update
   `CURRENT_WORK.md`, `DECISIONS.md` and any document whose facts changed.
   A task is not done until the documents match the code.

## 3. Living documents

The files in `docs/context/` describe the product as it is today, not as it
was planned. Whenever a change lands that alters a fact in them, update the
document in the same change. Stale context is treated as a defect.

- New route or page → `ARCHITECTURE.md` route list and `PRODUCT.md` surface list
- New or changed table, column, policy → `DATA_MODEL.md`
- New settled choice or reversal → `DECISIONS.md`
- Work started, finished or parked → `CURRENT_WORK.md`

## 4. Build rules

- One workspace equals one tenant. Every feature table carries
  `workspace_id` and RLS policies backed by `is_workspace_member` /
  `has_workspace_role`. Never gate on an email address in code.
- All database changes go through version-controlled migrations in
  `supabase/migrations/`. Never edit production data by hand except on an
  explicit, confirmed instruction from the owner.
- Server work uses `createServerFn`; webhooks and public endpoints use
  routes under `src/routes/api/public/`. No edge functions.
- Reuse before you invent: shared page and panel primitives live in
  `src/components/application/shell/`, vendored components in
  `src/components/vendor/` (inventory in `docs/ui-components/COMPONENT_MAP.md`).
- Follow the approved design language in `docs/ui-design/DESIGN_LANGUAGE.md`:
  blue `#164BFA` sidebar, text-only STARTWEB wordmark, pale canvas, white
  cards, ZAR amounts formatted `R30 000`.
- Copy is short and task based. No em dashes.
- Every visible control must work. No placeholder buttons, no fake data.
- Adding functionality never authorises redesigning existing screens.

## 5. Checks before claiming completion

- `bunx tsgo --noEmit` passes
- `bunx prettier --write` on touched files
- The affected screens open in the preview with no console or page errors
- Loading, empty, error and permission states are all reachable
- Any rule that could not be met is recorded in
  `docs/build-standards/EXCEPTION_REGISTER.md` with reason, risk, control,
  owner and follow-up

Do not claim completion while a type error, a broken journey, a hardcoded
secret or an untested migration remains.
