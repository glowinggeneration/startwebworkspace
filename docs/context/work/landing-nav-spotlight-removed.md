# Brief and plan: Landing navigation spotlight removed

## Goal

Remove the remaining animated light effect from the home page navigation and keep the
background clean white.

## Screens involved

- `/` (public landing page), top navigation only.

## Data involved

No data or database changes.

## Rules and edge cases

- Keep both links ("How it works", "FAQ") working and scrolling to their sections.
- Keep the pill shape and existing token colors; no hardcoded colors.
- No mouse-following glow, no injected style block, no motion library on the public page.
- Keyboard focus remains visible.

## Existing pieces to reuse

- Existing `scrollToId` helper and semantic surface/border tokens.
- `SpotlightNavbar` stays vendored and unused for possible later use.

## Stages

1. Replace `SpotlightNavbar` with a small static nav in the landing route.
2. Type-check and verify the nav renders static on white with links still scrolling.

## Outcome

The home page nav is a plain pill (active link in foreground, other muted) on the existing
near-white background. Type check passed and Playwright confirmed the FAQ link scrolls the
page with no page errors.
