# Subtle square card corners

## What will change
- Set the shared content-card corner radius to 4px.
- Update reusable panel and card primitives to use that shared value.
- Sweep application screens for custom card containers and align them to the same subtle radius.
- Keep pills, avatars, badges, buttons, inputs, menus, dialogs, and circular status elements unchanged.

## Technical details
- Use the existing semantic `--radius-card` token and `card-surface` utility rather than adding page-specific values.
- Replace only card-like `rounded-xl`, `rounded-2xl`, and larger local classes in application code.
- Preserve all layouts, spacing, colors, shadows, interactions, and data behavior.

## Verification
- Format and type-check touched files.
- Review representative Dashboard, Pipeline, Accounts, Projects, and Finance screens at desktop width.
- Confirm no card remains excessively rounded and no controls were unintentionally squared.
