# Brief: Campaign tracker with budgets

Status: built, preview check outstanding. 9 September 2026.

## Goal

The team can see every marketing campaign in one place with its status,
dates, assigned person and next action, see the tasks attached to it, and
compare planned spend against actual spend.

## Screens involved

`/campaigns` (new), sidebar link under Delivery (changed).

## Data involved

New table `campaigns`: workspace, optional account, name, channel, status
(`planned` | `active` | `paused` | `completed`), start and end date, owner,
next action and date, `planned_cost`, `spent_cost`, notes. Costs are not
negative. New nullable `tasks.campaign_id`, set null on delete. RLS: any
workspace member who is not a client can read and manage.

## Rules and edge cases

- A campaign does not need an account or a project
- End date cannot be before start date
- Budget totals reflect the current filters, not the whole workspace
- Variance is planned minus spent; over budget reads clearly

## Existing pieces reused

`page-parts`, `panel-parts`, `FilterCombobox`, `UtilityIconButton`,
`currency.format`, `useWorkspaceMembers`, `useAccounts`.

## Acceptance checks

1. Tracker view lists campaigns with status, dates, owner, next action and
   linked task progress
2. Budget view shows planned, spent and difference totals plus per campaign
   meters
3. Create, edit and delete work from the side panel
4. Tasks can be linked and unlinked
5. Search, status tabs and owner filter narrow both views
6. Empty state shows when there are no campaigns

## Out of scope

Campaign reporting over time, channel spend imports, ad platform links.
