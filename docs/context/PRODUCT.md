# Product

Last updated 9 September 2026.

## What this is

Startweb Workspace is the internal operating system for Startweb: one place
to run sales, delivery and money for a small web and digital services team
in South Africa. It replaces spreadsheets and WhatsApp threads.

Live at `workspace.startweb.co.za`.

## Who uses it

| Person             | Role                            | Uses it mainly for                     |
| ------------------ | ------------------------------- | -------------------------------------- |
| Thabo Ledimo       | CEO                             | Targets, pipeline, revenue coverage    |
| Dodi Maleka        | Head of Business Development    | Accounts, deals, quotes, daily calling |
| Ntokozo Hlatshwayo | Head of Operations and Delivery | Projects, tasks, workload              |
| Ndumiso Yedwa      | CTO                             | Delivery, platform                     |

Roles are workspace roles: owner, admin, sales, pm, member, client. A client
role sees only their own account.

## The core loop

1. Log daily outreach and calling time (Activity)
2. Track accounts and deals to won (Accounts, Pipeline)
3. Quote, invoice, record payment (Quotes, Invoicing, Statements)
4. Deliver the work as projects, phases and tasks (Projects, Workload)
5. Measure against the monthly revenue target (Dashboard)

## Surfaces

| Screen        | Path                                | Purpose                                                                              |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| Dashboard     | `/dashboard`                        | Monthly target, planned mix, won this month, coverage, activity table, calling block |
| Pipeline      | `/pipeline`                         | Clients board by stage, plus deals board and list                                    |
| Accounts      | `/accounts`                         | Client directory, contacts, notes                                                    |
| Projects      | `/projects`, `/projects/$projectId` | Delivery work, phases, tasks                                                         |
| Campaigns     | `/campaigns`                        | Campaign status, dates, owner, next action, linked tasks, planned vs spent budget    |
| Workload      | `/workload`                         | Weekly hours allocated per person                                                    |
| Activity      | `/activity`                         | Daily activity log and weekly review                                                 |
| Quotes        | `/quotes`                           | Quotes and line items                                                                |
| Invoicing     | `/invoicing`                        | Invoices, outstanding, overdue, paid                                                 |
| Statements    | `/statements`                       | Account statements                                                                   |
| Import review | `/import-review`                    | Decisions needed from the conversation import                                        |
| Settings      | `/settings`                         | Team, invitations, packages, import                                                  |

## Rules of the business

- Money is South African rand, shown as `R30 000`.
- Monthly target drives coverage: planned pipeline against target.
- The 08:00 to 10:00 calling block is protected work time and is tracked.
- Payments cannot exceed the invoice total.
- Deals marked won trigger delivery handoff.

## Not in scope today

Client-facing portal beyond the client role, payroll, time billing,
automated payment collection.
