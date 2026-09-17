# Role workspaces, website production and record access

## What changed

1. **Roles, menus and guards.** `workspace_role` gained `cto` and `builder`.
   Ndumiso is `cto`, Ntokozo `pm`, Dodi `sales`, Thabo `owner`.
   `src/lib/access/roles.ts` is the single source of truth: each role has a
   landing page, nav groups and extra paths. `startweb-shell.tsx` reads it for
   both the sidebar and the guard — an unauthorised path renders
   `AccessRestricted` instead of the page.

2. **Website production.** `projects.production_stage` carries the thirteen
   stages in `src/lib/production-stages.ts`. New tables `project_tech`,
   `qa_submissions` and `project_blockers` hold the technical record, QA
   sign off and blockers. `/technology` (owner, admin, cto) has Overview,
   Production board, QA and launches, and Support. The QA update policy
   refuses a reviewer who is also the submitter.

3. **Role dashboards.** `/dashboard` now renders by role: executive and sales
   keep the command board, the CTO gets the technology dashboard, delivery
   gets projects, deadlines and unowned work, builders get only their own
   assigned tasks.

4. **Record level access.** `can_view_project()` restricts builders to
   projects they are assigned to (tech record, owner, or task assignment).
   Projects, tasks, phases, deals, quotes and invoices enforce this in RLS,
   so hiding a menu item is never the only control.

## Still open

- No website builder is on the team yet, so the `builder` role is built but
  unassigned.
- Approvals, notifications and the full audit trail from the spec are not
  built; nothing is seeded with invented data.
