# Lovable prompts

## Implementation prompt

Use the attached Startweb UI/UX pack to implement a cohesive redesign of the existing Startweb application. Work in the existing project and preserve its data, routes, permissions, calculations and working features. This is an implementation request, not a request for a plan or a static imitation.

Read README.md, docs/DESIGN_LANGUAGE.md, docs/PAGE_SPECIFICATIONS.md, docs/COMPONENT_MAP.md, docs/ACCEPTANCE_CHECKLIST.md and the supplied Application_Build_Master_Rules.md before editing. Inspect the existing repository, dependency versions, authentication, schema and business logic. Inspect the uploaded component collections and use relevant implementations after adapting them to the current stack. Do not add every demo or rewrite the architecture just to match an image.

Treat images/01-dashboard-approved.png as the primary visual reference. Apply its solid Startweb blue sidebar and white text-only STARTWEB wordmark throughout authenticated pages. There must be no separate logo graphic beside the wordmark. Use one shared shell, central tokens and reusable primitives. The original white-sidebar dashboard in archive is retained for history only and must not override the approved design. Normalize generated-image inconsistencies according to the written documents, especially duplicate primary actions, selected-tab styling, zero progress and Pipeline prerequisites.

Implement Dashboard, Pipeline, Accounts, Projects, Workload, Activity, Quotes, Invoicing, Statements and the existing sign-in route, following each page specification. Keep Settings reachable and visually consistent without inventing a new Settings workflow. Current screenshots show empty data; bind to live records and design the empty states instead of seeding fictional clients, deals, payments or team members. Dates must be dynamic and timezone aware. Preserve monthly-target semantics when changing activity filters.

Use the supplied segmented controls, content tabs, numeric steppers, inline actions, date-range and slot pickers, tag selectors, form panels, table toolbars, capacity meters and accordions where mapped. Adapt the sign-in split layout and only expose configured providers. Use real initials or uploaded profile images, not random stock people. Respect reduced motion. No dead search fields, filters, exports, theme toggles or buttons.

Implement all responsive and accessibility requirements from the design language. Keep typed inputs available alongside steppers and calendar pickers. Provide meaningful loading, empty, partial, error and success states. Preserve in-progress input on failures. Use actual backend confirmation for financial operations and persisted status. Deal-to-project creation and quote-to-invoice conversion must avoid duplicate effects. Preserve statement reconciliation and existing payment rules.

If schema changes are required for genuinely missing features, use named migrations with appropriate review and compatibility checks. Keep authorization on the server and use existing secure authentication patterns. Do not remove controls or modify production data to make the UI easier to build. Identify missing integration configuration precisely, implement what can be completed, and report the specific remaining dependency rather than pretending it works.

Persist the supplied design language as docs/design-language.md in the repository and add its rules to project knowledge. Persist the page specs and component map alongside it. All future additions must use these rules. Record deliberate design changes in a small changelog; never silently introduce a parallel style system.

Validate the actual implementation at desktop, tablet and mobile sizes, with keyboard navigation, long content, empty data, failed saves and reduced motion. Run applicable build, type and domain tests. Confirm critical actions operate correctly with authorized data and that the browser has no unresolved errors. Finish with a concise report of implemented pages, reusable components, validation performed and any specific unresolved limitations. Do not claim image concepts prove code behaviour.

## Future change prompt

Implement the following change in the existing Startweb application: [describe the feature or component]. First read the project’s docs/design-language.md, relevant page specification and component map. Preserve the text-only STARTWEB identity, solid blue sidebar, shared shell, central tokens, spacing, typography, states, accessibility and responsive rules. Reuse the closest existing primitive and adapt any supplied component to it. A new feature must not create a new design system. Keep current data, permissions and domain rules intact. Implement working interactions and honest states, update the component map when needed, and verify the affected workflows and layouts. Report the change and its validation briefly.

## Design review prompt

Review the changed Startweb pages against docs/design-language.md and the acceptance checklist. Identify and correct visual drift, duplicate primary actions, inconsistent tabs, unsupported controls, inaccurate zero states, inaccessible inputs, narrow-screen overflow and incorrect financial or workflow assumptions. Compare with the approved blue-sidebar dashboard. Preserve functioning business logic. Report remaining concrete issues only.
