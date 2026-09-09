# STARTWEB page specifications

These specifications cover all ten current page images. Preserve live data and existing routes. Counts and dates in images are reference snapshots, not seed records or fixed values. Controls added by the concepts are proposed interactions to implement against real data; do not render them as nonfunctional decoration.

## 01 Dashboard

Route: `/dashboard`. Reference: `../images/01-dashboard-approved.png`.

Four metrics: Monthly target R30 000, Planned mix R0, Won this month R0, Target coverage 0.00×. Keep existing definitions of planned mix and target coverage after inspecting the implementation; do not infer an alternative financial formula from their labels. If undefined, document the missing definition before inventing a metric. Edit target uses an inline action with validation and confirmed persistence.

Date filter and Day/Week/Month/Year control must define their scope. Monthly financial targets remain explicitly monthly; changing the activity period must not silently change a monthly denominator. Selected default is the current month. Calling reminder links to Activity and retains the suggested 08:00 to 10:00 block. Do not mark it scheduled until a real save occurs.

| Activity | Done in reference | Monthly target |
| --- | --- | --- |
| Touches | 0 | 260 |
| Replies received | 0 | 47 |
| Meetings booked | 0 | 10 |
| Meetings held | 0 | 8 |
| Written offers sent | 0 | 5 |
| Deals won | 0 | 2 |

Each zero-progress track is empty. Revenue card shows R0 of R30 000, remaining R30 000, 0% achieved. Actual aggregation must come from current records and shared business functions. Table toolbar search/filter/export acts on the represented data. Calling block uses a slot picker and a separate scheduling action.

## 02 Pipeline

Route: `/pipeline`. Reference: `../images/02-pipeline.png`.

Retain four stages Open, Won, Lost, Later, each with count and summed value. Reference has zero deals and R0 in each. Board/List view uses segmented control; owner/industry search and filters operate on actual fields. Do not invent card contents. All open deals require a next step and next date under the existing domain rules. When account creation is a prerequisite, disable every New deal/Add deal entry point consistently and offer Add account. Verify the current permission and prerequisite logic rather than interpreting a faded screenshot button as a complete rule.

A deal moving to Won creates one project under the existing workflow. Handle retries and concurrent updates without duplicate projects. Drag-and-drop, if added, needs a keyboard-accessible Move to action and confirmation where domain effects warrant it. Failed moves restore prior state.

## 03 Accounts

Route: `/accounts`. Reference: `../images/03-accounts.png`.

All accounts and Pinned tabs, search, industry filter and List/Grid selector. Table: Company, Primary contact, Industry, Open deals, Owner. Reference has no accounts. Right creation panel is an open interaction state, not permanently required on every visit. Closing it restores the list and returns focus to its trigger.

Form labels: Company name, Website, Primary contact, Email, Industry, Tags. Apply actual required-field rules and validate on both client and server. Do not assume every proposed field already exists in the schema. Persist tags and pin state only if implemented with proper ownership checks. Add fields through reviewed migrations when necessary. Clear duplicate action buttons while the panel is open. Create account shows pending state, preserves input on failure and updates the actual list on success.

## 04 Projects

Route: `/projects`. Reference: `../images/04-projects.png`.

All projects/Active/Completed tabs, owner filter, search, view selector. Columns: Project, Account, Owner, Status, Due date. Projects originate from won deals; do not introduce a conflicting manual Create project workflow. Empty state offers Go to pipeline. Setup checklist describes Win a deal, Assign an owner, Set delivery dates; it must not falsely show completed steps. Use a collapsed help accordion rather than repeating the same explanation in several places. Bind status filters to existing project statuses with explicit mapping.

## 05 Workload

Route: `/workload`. Reference: `../images/05-workload.png`.

Reference week begins 7 September 2026; the live page uses the selected week. Thabo Ledimo has 0h allocated out of 40h capacity, with 40h available. Use authenticated team data and per-person capacity settings, not fixed staff or hours. Weekly view shows Monday to Friday daily allocations and accessible add actions. Team profile accordion reveals allocations. Capacity meter shows actual usage and is empty at zero.

Allocation form: team member, project, date range, hours stepper. Prevent save without a valid project, member, range and positive hours. Distinguish total hours for the selected range from hours per day and state the chosen existing allocation model in the UI. Do not accidentally multiply hours across the range. Handle overlapping allocations and over-capacity with the domain policy and visible feedback. Week/Month view must aggregate correctly. A missing project leads to the established project workflow.

## 06 Activity

Route: `/activity`. Reference: `../images/06-activity.png`.

Today/Weekly review tabs, date picker, industry focus. Six nonnegative integer counters: Touches, Replies received, Meetings booked, Meetings held, Written offers sent, Deals won. Hours calling accepts nonnegative decimal hours as supported by the domain. Notes for tomorrow is a textarea. Reference values are zero. Use steppers with direct entry. Save activity persists one intended daily record or follows the existing event model; avoid duplicate additions when a save is retried. Inspect the current aggregation before changing it.

Calling slot is a suggestion until saved. Tomorrow’s priorities adapts the pinned list pattern without random shuffling; use real persisted priorities, or omit until implemented. Saving notes and priorities must not imply that either has been saved by the other action. Weekly review displays aggregates of real daily activity. Confirm save state only after server success.

## 07 Quotes

Route: `/quotes`. Reference: `../images/07-quotes.png`.

All/Draft/Sent/Accepted tabs mapped to actual status enum. Toolbar: search, account, date range, filter and export. Table: Quote, Account, Issued, Valid until, Amount, Status. Empty reference contains no quotes. Create quote opens the existing editor or a shared form with account and line items. Preserve tax, currency and calculation rules; do not infer tax settings from the image.

An accepted quote converts to an invoice with the same line items. Verify whether conversion is automatic or user-triggered in the existing application and preserve that contract. Conversion must be idempotent. Help accordion explains this once. Sending a quote requires an actual delivery operation; do not mark Sent after a UI-only click. Exports reflect authorized, filtered data.

## 08 Invoicing

Route: `/invoicing`. Reference: `../images/08-invoicing.png`.

Outstanding, Overdue and Paid this month show R0 in the reference. Derive actual totals with documented date/status scope from current billing records. Tabs All/Draft/Unpaid/Paid map to existing states. Do not count draft balances as overdue unless the established accounting rules explicitly do so. Table: Invoice, Account, Due date, Total, Paid, Balance, Status. Search, account/date filters and export use real data.

Invoice becomes Paid when recorded payments reach the total under the existing model. Payment state comes from confirmed records, not optimistic animation. Preserve partial payments, overpayments, credits, cancellations and rounding behaviour where supported. No manual paid toggle that bypasses recorded payments. Empty state provides one Create invoice action. Sensitive financial operations require server authorization and auditability.

## 09 Statements

Route: `/statements`. Reference: `../images/09-statements.png`.

Account combobox, date range and All activity/Invoices/Payments selector. Before selecting an account, show a useful empty state without invented balances. Download PDF remains unavailable until a statement can be produced. Missing accounts lead to Add account. A real statement derives from invoice and payment records rather than a separately editable ledger.

When filtering a period, preserve opening balance, in-period movements and closing balance according to established statement logic; do not confuse hiding invoice rows with removing their effect from the balance. Export must identify account, period and filter scope and reconcile with the visible calculation. Statement options expose only supported settings. Implement a readable print layout independently of the dashboard shell.

## 10 Sign-in

Use the existing authentication route, do not rename it solely to match the image filename. Reference: `../images/10-sign-in.png`.

Split-screen layout with blue brand panel and white form. Text-only STARTWEB. Keep four original provider choices Google, X, Facebook, GitHub only when actually configured; unavailable providers are omitted or clearly unavailable, never fabricated successful sign-ins. Label provider buttons. Email/password fields have persistent labels, password visibility toggle, Forgot password and Sign up routes. Adapt the supplied registration component to sign-in rather than inheriting unrelated registration fields.

On mobile, retain a compact brand header and form. Handle pending, invalid credentials, rate limits, interrupted OAuth, expired links and successful redirect. Do not expose account existence through recovery errors. Preserve existing security controls and authorized return routes. Avoid showing a signed-in user avatar or application navigation before authentication.

## Settings

Settings remains in the shared shell. No Settings screenshot was supplied and no Settings redesign image is included. Apply shared tokens and components when this route is changed in future; preserve its existing functions.
