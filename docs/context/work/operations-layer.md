# Operations layer (daily, nightly, weekly, monthly)

## Goal
Record the working day inside STARTWEB so days, weeks and months are sums of
stored rows rather than numbers retyped into a report. Requested by Dodi
Maleka (StartWeb Sales Ops Structure, 17 September 2026).

## Scope
- `/operations` with five views: Today, Nightly close, This week, Month pack,
  Import a list.
- Seven activity types: outreach, conversation, research, meeting booked,
  meeting held, written offer, content, account follow-up.
- One company record for prospects and clients, split by `accounts.world`
  (`targeted` / `existing`), with `next_step`, `next_date`, `ops_status`,
  `source` and `list_import_id`.
- Excel/CSV calling-list import: column mapping remembered per template,
  matching on normalised company name then phone, review before commit,
  never a second company for a name already held.

## Data
- `activity_events` — workspace_id, user_id, account_id, event_date,
  event_type, outcome, notes, hours, units, contact_name, list_import_id.
- `calling_list_imports` — file name, list name (kept so reports can say
  which list produced conversations), column mapping, counts.
- `daily_activity_log` gains theme, calling_block_kept, research_hours,
  content_units, follow_ups, list_file_name, closed_at.
- RLS follows the existing daily-activity pattern: members read the team's
  rows, each member writes their own, client role excluded.

## Rules held
- A day that was never closed shows as "Day not closed" rather than inventing
  totals.
- Delivery stages stay on Projects; operations views do not reuse them.
- Companies touched with no next date are listed at the nightly close.

## Visibility
Shown only to profiles with `preferences.showOperations` (currently
maleka@startweb.co.za). Everyone else's navigation is unchanged.
