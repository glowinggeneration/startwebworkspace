# UI Component Map

Every component supplied for this build (three sources, 84 files total) is
vendored into `src/components/vendor/{collection,magicui,secondary}/` —
import paths normalized (`@/components/base-ui/*` → `@/components/ui/*`,
`framer-motion` → `motion/react`) but otherwise kept as supplied. This
table is the audit trail for the Application Build Master Rules
requirement to use every provided element: each row names where it's
already wired into a real screen, or which later phase wires it in.
Update the **Status** column as each row moves from vendored to wired —
don't let this file go stale.

Sources: **C** = `UI_Component_Code_Collection.md` (38 entries → 42 files
after splitting demo/composite files apart), **M** = the magicui-style zip
(17 components + 2 text-only prompts), **S** = the secondary
`UI_Component_Code_Collection.txt` (25 earlier/candidate variants).

## Wired (Phase 0)

| Component                          | Source file                                     | Wired into                                                                                    | Notes                                                                                                             |
| ---------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Split-Screen Registration Page     | `collection/split-screen-registration-page.tsx` | `components/application/auth/split-auth-layout.tsx`, `routes/register.tsx`, `routes/auth.tsx` | Restyled onto our design tokens; real react-hook-form + zod + Supabase auth replace the original's static markup. |
| Social Authentication Buttons      | `collection/social-authentication-buttons.tsx`  | `components/application/auth/social-auth-buttons.tsx`                                         | Same icon-button row, wired to `supabase.auth.signInWithOAuth`.                                                   |
| Animated Theme Toggler             | `magicui/theme-toggler.tsx`                     | `components/core/theme-toggle.tsx`                                                            | Controlled mode, paired with `next-themes`.                                                                       |
| 4-step progress indicator (prompt) | _(text-only prompt, not a source file)_         | `components/core/onboarding-stepper.tsx`                                                      | Hand-built to spec; drives `routes/onboarding.tsx` (Account → Profile → Billing → Complete).                      |

## Wired (Phase 1)

| Component               | Source file                              | Wired into                                      | Notes                                                                                                                         |
| ----------------------- | ---------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Expandable Profile Card | `collection/expandable-profile-card.tsx` | `components/application/pipeline/deal-card.tsx` | Same click-to-expand interaction, rebuilt around a Deal (account/value/next step/date) instead of a lead-gen company profile. |

The desk-card reference content (item #12 below) is surfaced from
`DealCard` via the standard shadcn `ui/popover.tsx` primitive, not a
vendored component — the "Desk card" concept itself came from the sales
tracker brief, not the supplied UI kit.

## Wired (Phase 3)

| Component          | Source file                         | Wired into                                              | Notes                                                                                                                                                        |
| ------------------ | ----------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Animated Accordion | `collection/animated-accordion.tsx` | `components/application/projects/phase-accordion.tsx`   | Same dynamic corner-radius morph between open/adjacent/edge items; generalized from a fixed text string per item to arbitrary content (a phase's task list). |
| Adaptive Slider    | `collection/adaptive-slider.tsx`    | `components/application/workload/allocation-dialog.tsx` | Used as-is for the 0-40h weekly allocation input — its colour-by-load gradient reads naturally as "how full is this week."                                   |

## Planned — later phases

| Component                                             | Source file                                                                   | Target feature                                                        | Phase |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----- |
| Tags Selector                                         | `collection/tags-selector.tsx`                                                | Deal/task labels                                                      | 1     |
| Inline Action                                         | `collection/inline-action.tsx`                                                | Row quick-actions (mark won/lost)                                     | 1     |
| Predictive Text Input                                 | `collection/predictive-text-input.tsx`                                        | Deal/task note composer with @mentions                                | 1     |
| Compose Email Card                                    | `collection/compose-email-card.tsx`                                           | Log/send a follow-up from a deal                                      | 1     |
| Share Sheet                                           | `collection/share-sheet.tsx`                                                  | Share a deal, later a quote/invoice                                   | 1 / 5 |
| Model Selection Dropdown                              | `collection/model-selection-dropdown.tsx`                                     | Assignee/owner picker (shared-layout morph reused)                    | 1     |
| Copy Confirmation                                     | `collection/copy-confirmation.tsx`                                            | Copy deal/quote/invoice link                                          | 1 / 5 |
| Searchable Country Combobox                           | `collection/searchable-country-combobox.tsx`                                  | Account country field                                                 | 1     |
| Team Profile Accordion                                | `collection/team-profile-accordion.tsx`                                       | "Who's involved" panel on a deal/project                              | 1 / 3 |
| Product Information Popover                           | `collection/product-information-popover.tsx`                                  | Contextual help tooltips                                              | 1     |
| Feedback Component                                    | `collection/feedback-component.tsx`                                           | In-app feedback widget                                                | 1     |
| Shuffle Pinned List (+ demo)                          | `collection/shuffle-pinned-list.tsx`, `.demo.tsx`                             | Pinned/starred projects on the dashboard                              | 3     |
| Save Toggle                                           | `collection/save-toggle.tsx`                                                  | Autosave indicator on task/project edit forms                         | 3     |
| Timed Undo Action                                     | `collection/timed-undo-action.tsx`                                            | Undo task delete/status change                                        | 3     |
| Run Action Button                                     | `collection/run-action-button.tsx`                                            | "Run automation" (bulk close tasks, generate invoice)                 | 3 / 5 |
| Animated Stepper                                      | `collection/animated-stepper.tsx`                                             | Hours/quantity stepper (alternate to the Adaptive Slider wired above) | 3     |
| Animated Circular Progress Bar                        | `magicui/animated-circular-progress-bar.tsx`                                  | Project/phase completion %                                            | 3     |
| Carousel Navigator                                    | `collection/carousel-navigator.tsx`                                           | Project dashboard highlights carousel                                 | 3     |
| Calendar Widget                                       | `collection/calendar-widget.tsx`                                              | Task due-date picker / mini calendar                                  | 3     |
| Schedule Date Range Picker                            | `collection/schedule-date-range-picker.tsx`                                   | Project timeline range picker                                         | 3     |
| Soft Date Range Calendar                              | `collection/soft-date-range-calendar.tsx`                                     | Alternate date-range picker (pick one vs. the above — see note)       | 3     |
| Frequency Selector                                    | `collection/frequency-selector.tsx`                                           | Recurring task / recurring invoice schedule                           | 3 / 5 |
| Slot Picker                                           | `collection/slot-picker.tsx`                                                  | Team member weekly availability → workload view                       | 3     |
| Content Feed Tabs                                     | `collection/content-feed-tabs.tsx`                                            | Project activity feed tabs (Updates/Files/Comments)                   | 3     |
| Data Synchronisation Popover                          | `collection/data-synchronisation-popover.tsx`                                 | Integration sync status indicator                                     | 3     |
| Data Hub Status Popover                               | `collection/data-hub-status-popover.tsx`                                      | Integration node status indicator                                     | 3     |
| Edit Profile Modal                                    | `collection/edit-profile-modal.tsx`                                           | "Edit billing details" / account settings modal                       | 4 / 5 |
| New Feature Announcement Bar                          | `collection/new-feature-announcement-bar.tsx`                                 | In-product release announcements                                      | 4     |
| Step Pager                                            | `collection/step-pager.tsx`                                                   | Multi-step quote builder (Details → Line items → Terms → Review)      | 5     |
| Lens                                                  | `magicui/lens.tsx`                                                            | Zoom into uploaded design/file attachments                            | 3     |
| Cool Mode                                             | `magicui/cool-mode.tsx`                                                       | Particle effect on "Mark won" / "Mark complete"                       | 1 / 3 |
| Confetti                                              | `magicui/confetti.tsx`                                                        | Celebrate closed-won deal / paid invoice                              | 1 / 5 |
| Responsive Mega Navigation (+ demo)                   | `collection/mega-navigation.tsx`, `.demo.tsx`                                 | Public marketing site nav                                             | 6     |
| Animated Infrastructure Bento Grid + Dotted World Map | `collection/infrastructure-bento-grid.tsx`, `collection/dotted-world-map.tsx` | Marketing landing page                                                | 6     |
| Three-Column Analytics Features Section (+ demo)      | `collection/analytics-features-section.tsx`, `.demo.tsx`                      | Marketing landing page                                                | 6     |
| Vertical Autoplay Testimonials Carousel (+ demo)      | `collection/testimonials-carousel.tsx`, `.demo.tsx`                           | Marketing landing page                                                | 6     |
| Tweet Card                                            | `magicui/tweet-card.tsx`                                                      | Social-proof embed on marketing page                                  | 6     |
| Orbiting Circles                                      | `magicui/orbiting-circles.tsx`                                                | "Integrates with…" showcase                                           | 6     |
| Animated Beam                                         | `magicui/animated-beam.tsx`                                                   | Pipeline → Project → Invoice flow diagram                             | 6     |
| Border Beam                                           | `magicui/border-beam.tsx`                                                     | Marketing CTA card accent                                             | 6     |
| Shine Border                                          | `magicui/shine-border.tsx`                                                    | Marketing pricing/CTA card accent                                     | 6     |
| Magic Card                                            | `magicui/magic-card.tsx`                                                      | Marketing feature card                                                | 6     |
| Typing Animation                                      | `magicui/typing-animation.tsx`                                                | Marketing hero headline effect                                        | 6     |
| Dia Text Reveal                                       | `magicui/dia-text-reveal.tsx`                                                 | Marketing hero headline effect                                        | 6     |
| Dotted Map                                            | `magicui/dotted-map.tsx`                                                      | Marketing page (preferred over the static SVG map above)              | 6     |
| Safari / iPhone / Android mockups                     | `magicui/safari.tsx`, `iphone.tsx`, `android.tsx`                             | Marketing product screenshots                                         | 6     |
| 3-tab Preview/Code/Settings (prompt)                  | _(text-only prompt, not built yet)_                                           | Help Centre / in-app product tour                                     | 6     |

## Vendored, no committed target yet (secondary `.txt` set)

These 25 files are earlier/candidate variants of components already covered
above (carousels, dialogs, toolbars, disclosure menus, a credit-usage card,
an onboarding-setup screen, a floating input, a schedule button). They're
present under `src/components/vendor/secondary/` and available, but the
primary `collection/`/`magicui/` versions are used where both exist. Pull
from here first before writing a new one-off primitive in a later phase:
`SegmentedControl`, `CarouselBasic`, `CarouselCustomSizes`,
`CarouselSpacing`, `CarouselCustomIndicator`, `DialogBasic`,
`TabsTransitionPanel`, `AnimatedNumberBasic`, `AppleStyleDock`,
`ScrollProgressBasic1`, `ToolbarDynamic`, `ToolbarExpandable`,
`InlineAction`, `CreditUsageCard`, `ProfileCard`, `OnboardingSetup`,
`MinimalCarousel`, `EditProfile`, `UniSwapDialog`, `CreateNewDisclosure`,
`InlineDisclosureMenu`, `FloatingInput`, `ScheduleButton`, `Tags`,
`SlotPicker`.

## Known duplicates (use one, keep both vendored)

- **World map**: `collection/dotted-world-map.tsx` (static, ~1,700 hardcoded
  `<circle>` elements, no props) vs. `magicui/dotted-map.tsx` (reusable,
  `svg-dotted-map`-driven, typed `markers` prop). Use the magicui one for
  anything new; the static one stays vendored to satisfy full inclusion.
- **Date-range pickers**: `collection/schedule-date-range-picker.tsx`
  (fully custom calendar) vs. `collection/soft-date-range-calendar.tsx`
  (react-day-picker wrapper). Pick per use case — the custom one for a
  dedicated scheduling screen, the react-day-picker one for a quick inline
  filter — rather than building a third.

## Verification status

Vendored files type-check and lint as part of the normal `bun run
typecheck` / `bun run lint` gates (vendor files get `@typescript-eslint/no-explicit-any`
turned off in `eslint.config.js` since that rule targets our own code, not
upstream authors'). A small, explicitly-named set of unwired vendor files
with genuine strict-mode type errors (mismatched optional-property types,
missing local `@/components/core/*` dependencies the secondary set
assumes, etc.) are listed individually in `tsconfig.json`'s `exclude` —
by file, not by folder, so that wiring a sibling file in the same
directory (as happened with Adaptive Slider and Animated Accordion in
Phase 3) doesn't silently lose path-alias resolution. If you wire in one
of the excluded files, fix its type errors and remove it from that list
rather than leaving it excluded.
