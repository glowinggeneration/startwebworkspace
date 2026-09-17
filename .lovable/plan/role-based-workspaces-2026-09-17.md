# Role based workspaces

Each person signs in and gets the workspace their job needs: their own
landing screen, their own menu, and only the records they are allowed to see.
The look stays exactly as it is now: blue sidebar, same cards, tables, search,
light and dark modes, desktop and tablet only.

## Who gets what

| Person                  | Role             | Lands on             | Menu                                                                                                                   |
| ----------------------- | ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Thabo Ledimo            | Owner            | Executive Overview   | Executive Overview, Pipeline, Accounts, Projects, Campaigns, Technology, Team, Workload, Activity, Quotes, Invoicing, Statements, Approvals, Settings |
| Ndumiso Yedwa           | Technology lead  | Technology Dashboard | Technology, Website Projects, Production Board, QA and Launches, Support, Accounts, Workload, Activity, Settings       |
| Ntokozo Hlatshwayo      | Delivery lead    | Operations Dashboard | Operations, Accounts, Projects, Delivery Board, Team, Workload, Activity, Quotes, Invoicing, Settings (no Campaigns)   |
| Dodi Maleka             | Sales lead       | Sales Dashboard      | Sales Dashboard, Today, Pipeline, Accounts, Proposals, This Week, Month Pack, Import a List, Activity, Settings        |
| Future website builders | Website builder  | My Work              | My Dashboard, My Projects, My Tasks, Changes Requested, QA Submissions, Files, Activity, My Settings                   |

Typing a web address you are not allowed to open shows an "Access restricted"
page and sends you back to your own dashboard. Hiding menu items is not the
protection: the database itself refuses the records.

## Stage 1: roles, menus and guards

- Add two new roles, technology lead and website builder, to the existing
  owner / admin / sales / delivery set. Assign the four of you.
- One place defines, per role, the menu and the allowed pages.
- Every page checks the role. Not allowed means Access restricted, then a
  redirect to your own dashboard.
- Search only returns records you are allowed to open.

## Stage 2: website production

- Every website project gains a production stage: Brief received, Content and
  assets requested, Content ready, Design in progress, Design approved,
  Development in progress, Internal QA, Client review, Changes required,
  Approved for launch, Deployed, Post launch monitoring, Complete.
- Projects gain technical detail: assigned builder and designer, domain,
  hosting, SSL, technology stack, repository link, staging link, live link,
  launch date, blockers, QA checklist and result, deployment history,
  maintenance notes.
- New screens for Ndumiso: Technology Dashboard, Production Board (drag a
  site between stages), QA and Launches, Support and Maintenance.
- Builders submit a site for QA; only Ndumiso or Thabo approves it. Nobody
  approves their own submission.

## Stage 3: the four dashboards

- Executive Overview for Thabo: revenue target against actual, pipeline value,
  cash collected, outstanding and overdue invoices, active clients and
  projects, sites in production and upcoming launches, campaigns, team load,
  eight health cards (Healthy / Requires attention / At risk) and an Attention
  Centre listing projects with no owner or next action, overdue work, unpaid
  invoices, stalled deals, blocked websites and approvals waiting for him.
- Operations Dashboard for Ntokozo: active projects by stage and owner,
  deadlines, overdue and at risk work, waiting on client, unassigned work,
  team load.
- Sales Dashboard for Dodi: today's calling list, targets and clients needing
  follow up, meetings, proposals, won and lost, leads with no next action,
  pipeline value, conversion, activity against target. His Operations tools
  (Today, Nightly Close, This Week, Month Pack, Import a List) move into this
  menu.
- My Work for builders: assigned projects, tasks due today, this week and
  overdue, waiting for content or feedback, changes requested, sites ready to
  submit, recent comments and files.

## Stage 4: record level access and audit

- Database rules so builders only ever receive their assigned projects, tasks
  and files. Nothing sensitive is sent to the browser and hidden.
- Statements and company wide finance limited to Thabo and finance-authorised
  people. Ndumiso sees payment status where it affects delivery.
- Pipeline and sales records hidden from builders.
- Every create, edit, status change, assignment, approval, financial change
  and deployment is recorded with who, what changed, old and new value, when
  and which project or account. Thabo sees the full trail; everyone else sees
  activity on records they may access.
- Role based notifications as listed in your document.

## Two things to confirm

1. There is no website builder on the team yet, so the builder role and its
   screens will be built and testable but unassigned until you add someone.
2. Approvals, Reports, Notifications and file uploads are new areas with no
   data behind them today. They are included from Stage 2 onward and will
   start empty rather than showing invented content.

## Technical notes

- New `workspace_role` values `cto` and `builder`; role helpers already exist
  (`has_workspace_role`, `is_workspace_member`).
- Single `src/lib/access/roles.ts` describing nav, landing route and allowed
  route patterns per role; `startweb-shell.tsx` and a route guard in
  `_authenticated/route.tsx` both read it.
- New tables: `project_tech` (one row per project), `qa_submissions`,
  `project_blockers`, `project_files`, `approvals`, `notifications`, plus
  `projects.production_stage`. Every table workspace scoped with GRANTs and
  RLS policies driven by role and assignment.
- Existing per-person preference flags (`hideCampaigns`, `showOperations`)
  are replaced by role driven navigation.
