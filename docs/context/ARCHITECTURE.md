# Architecture

Last updated 9 September 2026.

## Stack

- TanStack Start v1 (React 19, Vite 7), file-based routing
- Tailwind CSS v4 configured through `src/styles.css`
- TanStack Query for reads and mutations
- Lovable Cloud (Supabase) for database, auth and storage
- Hosted on the Lovable edge runtime; published to `workspace.startweb.co.za`

## Folders

```text
src/
  routes/                  file-based routes; _authenticated/ is the gated subtree
  components/
    application/           product components grouped by area
      shell/               page and panel primitives, navigation, buttons
      dashboard/           command board and dashboard cards
      auth/                split auth layout, social buttons
      finance/             payment dialog, line items editor
      settings/            team, invitations, conversation import
    ui/                    shadcn-style primitives
    vendor/                supplied component library (see docs/ui-components)
  hooks/                   one hook file per domain area (use-deals, use-campaigns, ...)
  lib/
    sales/                 currency and sales helpers
    finance/, pdf/, audit/ supporting helpers
    platform/              reusable scaffolding not yet wired to a feature
  integrations/supabase/   generated clients and types, do not edit
supabase/migrations/       every schema change, in order
docs/                      context, build standards, design, ui components
```

## Boundaries

- Authenticated pages live under `src/routes/_authenticated/`. The gate in
  `route.tsx` is integration managed; do not author auth checks per page.
- Public pages (`/auth`, `/register`, landing) never call an authenticated
  server function from a loader.
- Server-only logic uses `createServerFn` in `*.functions.ts`; helpers that
  must never reach the browser use `*.server.ts`.
- `src/integrations/supabase/types.ts` is generated. Project-specific status
  aliases live in `src/integrations/supabase/app-types.ts` so they survive
  regeneration.

## Data flow

Route component → domain hook in `src/hooks/` → Supabase client scoped by
`workspace_id` → RLS enforces membership and role. Mutations invalidate the
matching query keys in the same hook file.

## Shared UI primitives

- `shell/page-parts.tsx` — PageHeader, SegmentedControl, UnderlineTabs, Panel,
  EmptyState, MetricTile, Toolbar
- `shell/panel-parts.tsx` — PanelHeader, PanelTitleBar, PanelSection,
  PanelFooter, StatusPill, ProgressMeter
- `shell/filter-combobox.tsx`, `shell/utility-icon-button.tsx`,
  `shell/loading-indicator.tsx`, `shell/avatar-label-group.tsx`,
  `shell/info-popover.tsx`
- Currency: `src/lib/sales/currency.ts`

## Checks

```bash
bunx tsgo --noEmit          # types
bunx prettier --write <files>
```

Preview verification runs through Playwright at 1280x1800 against
`http://localhost:8080`.
