# Pipeline & Sales-Ops Requirements — from the Partner Walkthrough Script and Sales Tracker

Source: `STARTWEB_Partner_Walkthrough_Script-2.pdf` and
`STARTWEB_Sales_Tracker-2.pdf` (Dodi Maleka, Head of Business Development,
to Thabo Ledimo — internal, September 2026 ramp). These describe the real
spreadsheet-based process Startweb Workspace's Phase 1 (CRM & Pipeline)
needs to replace. Captured here so it isn't lost before Phase 1 starts;
nothing in this file has been built yet.

## What's already covered by the existing plan

- Accounts (client companies), Deals, pipeline stages, closed-won → project
  automation, and workspace RBAC (`owner`/`admin`/`sales`/`pm`/`member`/`client`)
  were already scoped in Phase 1/2. Dodi maps to `sales`, Thabo to `owner`,
  and Ntokozo (delivery) to `pm` — the existing role set needs no changes.

## New/sharpened requirements this brief adds

### 1. Fixed industry list (a deliberate constraint, not open text)

Exactly five industries, changed only by an explicit written decision, not
ad hoc: **Manufacturing** (plastics, tools, machinery), **Retail**,
**Waste management**, **Mining** (& mining services), **Property**
(agencies, developments, managing agents). Model as a seeded
`industries` lookup table (workspace-scoped) rather than a free-text field
on Account/Deal, so the fence is enforced, not just a convention.

### 2. Package catalog with real starting prices

A `packages` table (workspace-scoped) is the product catalog that Deals,
Quotes and Invoices all reference:

| Package                | Working price | Type      |
| ---------------------- | ------------- | --------- |
| Starter Website        | R7,000        | one-off   |
| Business Website       | R18,000       | one-off   |
| Premium Website        | R40,000       | one-off   |
| SMAIT content job      | R7,000        | one-off   |
| SMAIT monthly retainer | R10,000/mo    | recurring |

These are explicitly **placeholders** — "working prices" to be replaced
by the workspace's own averages once ~20 deals have closed. The catalog
needs an editable price per package (not hardcoded), and ideally a note
distinguishing "working price" from "actual average" once there's enough
closed-deal history to compute one.

### 3. Deals ("Open work") — required fields sharper than a generic CRM

- Company/contact, industry, package, value.
- **Next step + next date are mandatory** — "If there is no next step and
  no date, it is not a real deal." The UI should refuse to leave a deal
  fully "Open" without both.
- Status needs **four** states, not three: `Open`, `Won`, `Lost`, and
  **`Later`** (real company, not this quarter — deliberately excluded
  from open-pipeline coverage math, distinct from Lost).
- **Won ≠ Billed.** A deal can be verbally/contractually won but only
  counts toward a month's billed target once it's _signed and invoiced in
  that calendar month_. Needs separate `won_at` and `invoiced_at` (or a
  billed-in-month flag), not a single "closed" timestamp — the tracker's
  own worked example (a November-shaped Premium deal sitting in September
  open work) depends on this distinction.

### 4. Monthly targets are a ramp, not a constant

A `monthly_targets` table (workspace-scoped: month, billed target, working
days, calling-start date) — this business is currently on R30k (Sep, from
the 15th) → R75k (Oct) → R115k (Nov), reset on the 1st of each month.
Hardcoding a single target would be wrong from month one.

### 5. Coverage metric

`coverage = SUM(value) of Open deals ÷ current month's target`. Target
≈3.5×; below 2.5× is a flagged risk. Purely computed from Deals + the
active `monthly_targets` row — no extra table needed, just a dashboard
metric.

### 6. Mix planner (forecast vs. actual)

Per month, the salesperson types _intended_ units per package; the system
computes planned revenue and the gap to target. Needs a small
`monthly_plan_lines` table (month, package, planned_units) distinct from
actual Deals — this is a forecast, not a pipeline snapshot.

### 7. Daily activity log

One row per user per day: touches, people who spoke back, meetings
booked, meetings held, written offers sent, wins (count), hours calling,
industry focus for the day, free-text note for tomorrow. This is the raw
input everything else (pace, weekly totals, coverage diagnostics) rolls
up from — it doesn't exist in the current schema at all and is probably
the single most-used new screen (filled in daily, "before you leave the
desk").

### 8. Weekly review ritual

Every Friday: totals rolled up from the daily log for the week, plus
three fixed reflection questions answered in one sentence each ("what
does next month's invoice book look like if I only called this way",
"which industry was real vs. just motion", "which open deal has no date
and why"). Needs a `weekly_reviews` row per user per week-ending date
with the three answers as text fields, plus a forward-looking
"next week's plan" (industry-by-weekday theme, meetings already booked
vs. still to book, offers due a decision, whether the 08:00–10:00 calling
block was actually protected — a simple yes/no that surfaces a pattern if
it's "no" twice running).

### 9. Conversion-funnel assumptions and back-calculated targets

Workspace-level assumptic rates: touches→conversation 18%, conversation→
booked meeting 22%, booked→held 80%, held→written offer 65%, offer→win
30%, touches/working day 20. From the month's target, package mix and
these rates, the system derives "touches needed," "conversations
expected," "meetings expected booked/held," "offers expected," "wins
expected" — exactly the "This month against the plan" table on the
Command Board. This is a genuinely new calculator feature, not just a
CRM field — likely a small pure function (target, mix, rates) →
funnel-stage targets, unit-testable independent of the database.

### 10. "Command Board" dashboard

Four KPI tiles (monthly target, planned mix total, won this month,
coverage) + the funnel-vs-actual table + open work broken down by
industry and by package + a rules-based diagnostic ("conversations high,
meetings low → opening line is weak"; "meetings high, offers low → not
asking in the room"; "offers high, wins low → writing for people who
can't buy"; "activity low → the 08:00 block was given away"). The
diagnostic is a simple decision tree over the same funnel numbers from
#9 — worth building as a small pure function too, so it's testable and
reusable if a second salesperson is added later.

### 11. Deal → delivery handoff, sharpened

Confirms and sharpens the already-planned Phase 2 automation: on a deal
being marked won, delivery (the `pm` role) needs the **scope, any
logins/access, and what was actually signed**, and must give a
**same-day acknowledgement** so sales can promise a start date. Model as
`handoff_acknowledged_at` (+ acknowledging user) on the Deal/Project
handoff record, not just a generic status flag — the same-day SLA is the
point.

### 12. Reference content: the "Desk card"

Five industries × one opening line + four discovery questions each,
meant to be glanced at during a live call, not read verbatim. Worth
seeding as workspace reference data (an `industry_playbooks` table or
similar) surfaced from the Deal detail view when working a deal in that
industry — low effort, direct reuse of content already written.

### 13. Smaller items

- **Referral tracking**: one referral ask logged after every closed deal — a simple checkbox/field on the Won transition.
- **Proof library**: one live client website per industry, shareable "with permission" — a lightweight per-industry case-study reference (could piggyback on Accounts with an `is_reference_client` flag + a short blurb, or a dedicated small table if more than one per industry is expected).

## Suggested effect on the phased build plan

All of the above lands in **Phase 1 (CRM & Pipeline)**, except #11 which
sharpens **Phase 2 (Pipeline → Project automation)**. Recommend Phase 1's
scope explicitly include: the industries/packages lookup tables, Deals
with the four-state status and mandatory next-step/date, the monthly
targets ramp, the mix planner, the daily activity log, the weekly review,
the funnel-calculator and Command Board dashboard, and the desk-card
reference content — this is a materially bigger Phase 1 than originally
sketched (a generic Kanban CRM), but it's now backed by a real,
detailed spec instead of an assumption.
