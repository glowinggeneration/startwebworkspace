# Brief and plan: Workload allocation blue gradient

## Goal

Make the weekly hours control use a polished Startweb blue gradient while keeping its current values and interaction unchanged.

## Screens involved

- `/workload`, allocation dialog only.

## Data involved

No data or database changes.

## Rules and edge cases

- Preserve the 0 to 40 hour range and existing save behavior.
- Use semantic design tokens in light and dark themes.
- Keep the range input keyboard accessible and respect reduced motion.

## Existing pieces to reuse

- `AdaptiveSlider`
- Existing Startweb primary and surface tokens

## Stages

1. Add semantic allocation-gradient tokens.
2. Apply the gradient and token-based surfaces to the existing slider.
3. Format, type-check and verify the allocation dialog in preview.

## Files to touch

- `src/styles.css`: allocation-gradient tokens.
- `src/components/vendor/collection/adaptive-slider.tsx`: blue gradient styling.
- `docs/ui-components/COMPONENT_MAP.md`: keep the component integration note current.

## States to cover

Minimum, middle and maximum values; light and dark themes; keyboard focus.

## Risks

Visual-only change to an existing control. No business logic changes.

## Acceptance checks

- Slider fill is a Startweb blue gradient.
- Label and value remain Hours and h.
- Dragging and keyboard adjustment still work.
- Type check passes and the dialog opens without browser errors.

## Out of scope

Workload calculations, allocations, layout and other controls.
