# Work: pipeline client board

Status: shipped 10 September 2026.

## Goal

Make the imported client work visible where the team works, instead of
sitting behind the Settings import card. Pipeline previously showed deals
only, and there are no deals.

## Build

- `src/hooks/use-client-board.ts` — clients with contacts, projects and
  tasks in one workspace-scoped query, plus `clientStage` and `openTasks`.
- `src/components/application/pipeline/client-board.tsx` — four stage
  columns with client cards.
- `src/routes/_authenticated/pipeline.tsx` — Clients, Deals and List views
  in the existing segmented control. Clients is the default view. Search
  filters clients by name, service, status, contact and project.

## Stages

Derived from the free-text `accounts.relationship_status` written by the
import:

| Column          | Matches                                                |
| --------------- | ------------------------------------------------------ |
| Proposal        | proposal, quote, alignment, closing, enablement, follow-up |
| In progress     | active, in progress, live, running                     |
| Needs attention | at risk, paused, unpaid, payment pending, awaiting, needs review |
| Delivered       | delivered, complete, handover, review                  |

Anything unmatched falls back to In progress when the client has open
project work, otherwise Delivered.

## Notes

Deal-based views are untouched, so nothing is lost when deals start being
recorded again. Project names on each card link to the project page.
