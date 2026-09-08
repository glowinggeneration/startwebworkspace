# Ideal Customer Profile — Startweb Workspace

Per Application Build Master Rules §2. Startweb Workspace is an internal
tool for the Startweb/Glowing Generation agency, not a product sold to
external buyers — several fields below are marked N/A for that reason,
not left as TBD placeholders.

| Field                 | Answer                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Customer segment      | Startweb (Glowing Generation) itself — a single agency workspace, seeded at launch.                                                                                                                                      |
| Primary user          | Account managers, project managers and delivery staff running client work day to day.                                                                                                                                    |
| Core problem          | Pipeline, delivery and billing state for client engagements are fragmented across disconnected tools, with no automatic handoff from "deal won" to "project started" to "invoice sent."                                  |
| Trigger               | A new client engagement is won, or an existing project needs a phase/task/resourcing update.                                                                                                                             |
| Current alternative   | Spreadsheets plus disconnected external SaaS (CRM, PM tool, invoicing tool) — manual re-entry at each handoff, TBD to confirm exact prior toolset with the team.                                                         |
| Desired outcome       | One workspace-scoped source of truth: a deal that closes becomes a tracked project with almost no manual re-entry, and delivery work is directly billable.                                                               |
| Buying criteria       | N/A — internal tool, not purchased externally.                                                                                                                                                                           |
| Main objection        | N/A — adoption risk is internal team habit change, not a purchase decision.                                                                                                                                              |
| Required integrations | Supabase (data layer, auth) in Phase 0. A transactional email provider (Phase 5, for sending quotes/invoices) and a deployment host are open items — see the build plan's "Open items for you."                          |
| Constraints           | Multi-tenant-by-workspace (`workspace_id` on every table), RBAC via `workspace_members.role`, no live payment processing (invoices/quotes are recorded, not charged).                                                    |
| Exclusions            | No public self-serve sign-up flow beyond the one seeded workspace's own team; no cross-workspace data sharing; no client self-serve billing/payment collection (out of scope until a payment provider decision is made). |

## Data rules

- **Data the product needs:** account/contact/deal metadata, project/task/
  resourcing data, quote/invoice line items and status history, workspace
  membership and roles.
- **Data the product must never collect:** payment card numbers or bank
  account details (a dedicated PCI-scoped provider handles any real
  payment collection later — this product only records amounts/status),
  biometric data, government ID numbers.

## Feature acceptance rule (§2.3)

Every new feature must be traceable to one of: a primary-user need above,
the pipeline → project → invoice outcome this product exists for, a
compliance requirement, or an operational control. If it isn't, don't
build it — or record why it's an exception in `EXCEPTION_REGISTER.md`.
