# STARTWEB design language

Version 1.0 | Persistent project standard

## Purpose and primary user

A workspace for Startweb staff managing client relationships, sales, project delivery and billing. The primary user needs to identify the next action, record work accurately, and see outstanding commitments. Success means fewer steps and reliable records, not more decorative content. Preserve existing permissions, routes, relationships and business rules.

## Identity

Use text-only **STARTWEB**, uppercase, in the application sidebar and sign-in panel. No square logo, separate emblem or added slogan. Blue is the brand and action colour; it is not a universal status colour. Keep any existing favicon separate from the visible wordmark.

## Foundation tokens

These are normative implementation values, not measurements sampled from generated pixels. Expose them centrally as CSS variables and map them to the existing theme system.

| Token | Value | Use |
| --- | --- | --- |
| brand | #164BFA | Sidebar, primary actions, links |
| brand-hover | #103BD0 | Primary hover |
| canvas | #F7F8FA | Main background |
| surface | #FFFFFF | Cards, inputs, panels |
| text-primary | #101828 | Titles and values |
| text-secondary | #475467 | Descriptions and labels |
| text-muted | #667085 | Supporting metadata |
| border | #D0D5DD | Inputs and essential boundaries |
| divider | #EAECF0 | Decorative card separators |
| selected-surface | #EFF4FF | Selected controls outside sidebar |
| selected-text | #164BFA | Selected text outside sidebar |
| sidebar-text | #FFFFFF | Navigation and wordmark |
| sidebar-section | #DCE5FF | Section labels |
| sidebar-selected | rgba(255,255,255,0.16) | Active navigation fill |
| success-text / surface | #067647 / #ECFDF3 | Confirmed success |
| warning-text / surface | #854A0E / #FFFAEB | Needs attention |
| error-text / surface | #B42318 / #FEF3F2 | Error and destructive actions |
| focus | #164BFA | Focus on light surfaces |

Use labels or icons alongside status colour. Neutral zero values stay charcoal. A coverage warning uses an amber label, not an oversized red number. Disabled states must remain identifiable and explain prerequisites nearby.

## Typography and numbers

Use Inter if already available, otherwise a modern system sans stack. Do not add several font families. Wordmark 24px/32px, weight 700, tracking 0.02em. Page title 32px/40px, weight 600. Card title 18px/26px, weight 600. Body and navigation 16px/24px. Table text 14px/20px. Labels 14px/20px, weight 500. Metadata 12px/18px. Main metric 32px/40px, weight 600. Use tabular numerals and right-align financial columns.

Format currency in ZAR with the R prefix and grouping spaces, such as R30 000; financial line items use two decimal places when needed. Use locale-aware formatting consistently, never inconsistent hand-built strings. Store money as decimal or integer minor units. Show dates as 9 Sep 2026 in compact UI; keep machine dates ISO. Resolve the workspace timezone from configuration; use Africa/Johannesburg only as a configurable default. Do not hardcode the screenshot date as today.

## Layout and spacing

Use a 4px base scale: 4, 8, 12, 16, 24, 32, 40, 48. Desktop sidebar 248px, fixed alongside content. Top bar 72px. Main padding 32px, cards 24px, grid gap 24px. Sidebar navigation rows at least 44px high. Standard controls 44px high; comfortable touch targets at least 44 by 44px. Compact table visual rows may be 48px, with reachable controls. White cards use 1px dividers and 10px radius. Inputs and buttons use 8px radius; small badges 6px. Avoid oversized pills, floating docks and nested cards without a functional reason.

Desktop content uses a flexible grid. Forms may occupy two thirds and a contextual panel one third. Use a single column when space becomes constrained. Do not insert unrelated cards just to fill space. One prominent action per decision area; avoid repeating the same blue button in both a page header and empty state.

## Shell and navigation

| Group | Pages |
| --- | --- |
| Workspace | Dashboard, Pipeline, Accounts |
| Delivery | Projects, Workload, Activity |
| Finance | Quotes, Invoicing, Statements |
| Footer | Settings, authenticated user menu |

All authenticated pages share one AppShell. Active item uses the same translucent fill, icon treatment and `aria-current`. Sidebar is solid blue edge to edge. Use one coherent outline icon family, normally 20px with consistent stroke. Top bar shows breadcrumb, functional global search if supported, theme toggle only if implemented, and real-user initials. Do not put dead controls in the shell. Keep TL only for Thabo, derive other initials from the actual user. Do not assign a stock avatar to a real identity.

## Responsive behaviour

At 1280px and above, use full sidebar and multi-column content. Between 768px and 1279px, collapse the sidebar when needed and stack contextual panels below primary content. Below 768px, use a blue top bar with STARTWEB and a menu button opening an accessible blue drawer. Page padding becomes 16px; titles 28px. KPI cards become two columns, then one if labels cannot fit. Forms become one column. Tables scroll within their own region or use a deliberate labelled card view, never compress text to illegibility. Pipeline can horizontally scroll its columns with a visible affordance or switch to a list. Do not hide essential totals or actions. Sign-in becomes one column with a compact blue brand header; remove the decorative left panel.

## Component contracts

Build shared Button, IconButton, Input, NumericStepper, Textarea, Select/Combobox, DateRangePicker, SegmentedControl, Tabs, Badge, TableToolbar, DataTable, EmptyState, MetricCard, CapacityMeter, Accordion, Drawer, Dialog and Toast primitives. Every component defines purpose, variants, data contract, responsive behaviour, keyboard handling and loading/empty/error/success states. Reuse an existing primitive before adding one.

Segmented controls choose one view or period. Tabs navigate related panels with matching ARIA semantics. Numeric steppers still allow direct entry, enforce nonnegative counts, and expose labelled increment/decrement actions. Date inputs preserve typed entry and timezone rules. Search/filter controls show result count and a clear-reset path. Disable export when there is no exportable result and explain why. Panels preserve in-progress input on recoverable failures. Dialogs and drawers trap focus, support Escape and return focus on close.

A meter representing 0% must have no coloured segments. Capacity availability and capacity usage are separate labels. Do not show a full blue track for 0h used. Over-capacity requires a labelled warning, not a clipped value. Ratio calculations with a zero denominator show Not set or an equivalent explicit state, not Infinity.

## Motion

Use movement to show state change. Hover/focus transitions 120–160ms; panel and tab transitions 180–220ms. Small translations of 4–8px are enough. Animate numeric changes only after a real value changes, never invent counting activity. Respect reduced-motion preferences by removing translation, spring effects and number rolling. Do not add autoplay, shuffling, rotating testimonials or perpetual movement to operational screens. Supplied animated components provide patterns, not a mandate to animate every interaction.

## States and accessibility

Design actual loading skeletons matching the layout, empty states with one next step, partial-data messages, inline validation, recoverable errors, and confirmed success. Never show a success check before server confirmation. Keep user input after a failed save. Use optimistic updates only for reversible, predictable actions with rollback; financial effects require confirmed server state.

Target WCAG 2.2 AA. Maintain at least 4.5:1 contrast for normal text and 3:1 for large text and essential interface graphics. Validate actual token combinations. Provide visible keyboard focus, including a white focus treatment on the blue sidebar. Persistent input labels are required. Icon-only buttons need accessible names and tooltips. Use semantic tables, headings and landmarks. Announce save/error status without stealing focus. Test zoom, text expansion and long names.

## Copy

Use short task-based labels: Create account, Save activity, Allocate hours, Download PDF. Avoid command-board metaphors, motivational filler and implementation details in product copy. Do not use an em dash. Explain empty states in one useful sentence. Surface the next action and any prerequisite. Do not restate the same explanation in a subtitle, card and footer.

## Future component governance

For every new component or page:

1. State the real user task and select the closest existing pattern.
2. Map all colours, spacing, typography and radii to central tokens.
3. Adapt supplied demo code to the current stack; remove demo values, duplicate dependencies and decorative effects.
4. Define permissions, data contracts, validation, all states and responsive behaviour.
5. Implement using shared primitives and existing shell. Add a token only if the need cannot use an existing one; document its semantic purpose.
6. Verify keyboard access, narrow layout, long content, empty data, failed requests and reduced motion.
7. Update the component map, page specification and design change log when behaviour changes.

A request to add functionality does not imply permission to redesign the application. Keep future additions consistent unless the user explicitly requests a design-system change. Persist this document in project knowledge and in `docs/design-language.md` in the implementation repository. At the beginning of later tasks, read it together with the relevant page spec. Do not assume the tool retains every earlier chat message.

## Image corrections that are intentional

The approved blue sidebar supersedes the archived white sidebar. Generated page images contain minor inconsistencies: selected tabs vary, buttons repeat, some helper text repeats, and Pipeline shows an enabled Add deal while New deal is disabled. Normalize tab styling and action hierarchy using this document. In Pipeline, all deal-creation actions must share the actual prerequisite and permission logic; use Add account as the empty-state action when no account exists. Never implement a generated inconsistency as a business rule.
