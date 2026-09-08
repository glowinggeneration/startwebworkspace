## Application Build Master Rules

This project follows `docs/build-standards/MASTER_RULES.md` (v1.0, 30 Aug 2026) — the mandatory build standard covering product definition,
architecture, interface/accessibility, security, database migrations,
APIs, AI features, performance, testing and deployment. Known gaps against
it are tracked in `docs/build-standards/EXCEPTION_REGISTER.md`, and the
release checklist lives in `docs/build-standards/BUILD_CHECKLIST.md`.

Apply this instruction at the start of every build or audit task:

> Apply the Application Build Master Rules to this project. First inspect
> the existing product, architecture, database, authentication, APIs, AI
> features, interface states, accessibility, performance, telemetry and
> deployment configuration. Do not make destructive changes or modify the
> production database directly. Propose version-controlled migrations and
> identify high-risk changes before implementation. Preserve existing
> behaviour unless a rule or approved requirement requires a change.
> Implement in small, reviewable stages. After each stage, run the
> relevant type, lint, test, accessibility, security and build checks.
> Record any rule that cannot be satisfied, the reason, the risk, the
> temporary control, the owner and the required follow-up in
> `docs/build-standards/EXCEPTION_REGISTER.md`. Do not claim completion
> while critical errors, hardcoded secrets, client-only permissions,
> untested migrations or broken core journeys remain.

Reusable scaffolding for rules that don't yet apply to a shipped feature
(idempotency keys, rate limiting, AI provider fallback, AI observability,
audit logging, feature flags) lives under `src/lib/platform/` — see
`src/lib/platform/README.md`. It compiles and is tested but is not wired
into any route yet; wire it in when the corresponding feature is built
rather than re-inventing it.

## Supplied UI component library

Every component supplied for this build is vendored under
`src/components/vendor/{collection,magicui,secondary}/` — see
`docs/ui-components/COMPONENT_MAP.md` for the full inventory, what's
already wired into a real screen, and which phase wires in the rest. Reuse
a vendored component before writing a new one-off primitive.

## Multi-tenancy and RBAC

One **workspace** = one tenant. Every feature table carries a
`workspace_id` column and RLS policies backed by
`has_workspace_role(user_id, workspace_id, role)` /
`is_workspace_member(user_id, workspace_id)` (see
`supabase/migrations/20260908000000_workspace_foundation.sql`). Do not add
a hardcoded admin-email shortcut — check `useWorkspaceRole()`
(`src/hooks/use-workspace-role.ts`) or the equivalent server-side RLS
check instead.
