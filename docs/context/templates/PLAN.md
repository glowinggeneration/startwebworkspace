# Plan: <short title>

Written from the brief in the same folder. No code before this is filled in.

## Stages

Small, reviewable steps, in order. Each stage should leave the app working.

1. Migration (SQL outline, grants, RLS, policies)
2. Data layer (hook file, query keys, mutations, invalidation)
3. Screen (layout, states, controls)
4. Navigation and links
5. Checks and document updates

## Files to touch

List each file and what changes in it.

## States to cover

Loading, empty, error, no permission, long text, many records.

## Risks

Anything destructive, anything that touches money, anything that changes an
existing screen.

## Checks

- `bunx tsgo --noEmit`
- `bunx prettier --write` on touched files
- Preview at desktop and tablet width, no console or page errors
- Documents updated: PRODUCT, ARCHITECTURE, DATA_MODEL, CURRENT_WORK, DECISIONS
