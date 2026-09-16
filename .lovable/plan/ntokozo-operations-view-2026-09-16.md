# Ntokozo operations view

## What will change
- Use Ntokozo's existing profile preferences to tailor only her signed-in experience.
- Hide Campaigns and campaign-only controls from her navigation and pipeline content.
- Add a required stage choice to her New deal form: Proposal, In progress, Delivered or Needs attention.
- Save the selected stage onto the linked client so the pipeline places it in the chosen column immediately.
- Add a short contextual explanation of Reference clients on her Accounts page.
- Keep Projects and every other member's experience unchanged.

## Technical details
- Extend the existing profile-preference pattern rather than checking an email address in the interface.
- Reuse the current client-stage definitions and account status field, avoiding a schema change.
- Invalidate both deal and client-board data after creation so the selected stage appears without a refresh.
- Keep the already prepared workspace-scoped industry migration and verify the requested categories are available.

## Verification
- Run formatting and type checks.
- Test Ntokozo's navigation, Accounts explanation, New deal stage selection and pipeline placement.
- Test another team member to confirm the current experience is unchanged.
