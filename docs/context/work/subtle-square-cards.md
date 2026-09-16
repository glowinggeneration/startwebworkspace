# Subtle square card corners

## Goal

Make cards and content panels across the application feel less rounded and more structured, without changing layouts, controls, pills, avatars, or workflows.

## Scope

- Change the shared card radius token to 4px.
- Update the shared Card primitive to use the card radius token.
- Replace application-level one-off card radii above 4px with the shared card radius.
- Keep rounded pills, badges, avatars, progress tracks, buttons, inputs, menus, dialogs, and decorative shapes unchanged.
- Preserve all existing data and behavior.

## Acceptance checks

- Dashboard, Pipeline, Accounts, Projects, Workload, Activity, Quotes, Invoicing, Statements, Team, Settings, and authentication cards use subtle 4px corners.
- No card remains heavily rounded because of a local override.
- Controls that rely on rounded geometry remain unchanged.
- Formatting and type checks pass.
- Key authenticated screens render without page errors or overlap at 1280px.
