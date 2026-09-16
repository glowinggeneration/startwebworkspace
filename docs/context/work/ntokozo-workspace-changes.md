# Ntokozo workspace changes

## Goal
Apply the uploaded operations and delivery requests only to Ntokozo Hlatshwayo's signed-in experience while preserving every other member's current workspace.

## Scope
- Hide Campaigns from Ntokozo's navigation and campaign links in her pipeline view.
- Let Ntokozo choose Proposal, In progress, Delivered or Needs attention when creating a deal, and place that client in the selected pipeline column.
- Keep Projects unchanged.
- Explain Reference clients in context on Ntokozo's Accounts view.
- Make the expanded industry list available in account and deal forms.

## Data and permissions
Use the signed-in profile's stored preferences, not an email check in frontend code. The existing workspace-scoped industry migration remains the source for shared industry options.

## Acceptance checks
- Ntokozo does not see Campaigns in navigation or her client pipeline cards.
- Ntokozo's New deal form includes a required Stage field and the client moves to that column after creation.
- Ntokozo sees a concise Reference clients explanation.
- Other members retain their current navigation, forms and screens.
- Projects remain unchanged.
