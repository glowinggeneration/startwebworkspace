# Build Checklist — Startweb Workspace

Extracted from `MASTER_RULES.md` §14. Run through this before any release;
unchecked items that can't be closed before shipping go into
`EXCEPTION_REGISTER.md`, not silently skipped.

### Product and scope

- [x] The ICP is complete and approved.
- [x] The primary user, buyer and approver are identified.
- [x] The product problem and measurable outcome are explicit.
- [ ] Every feature maps to a user, business, compliance or operational need. _(true so far — re-check each phase)_
- [x] Out-of-scope users and functions are documented.
- [x] Required data and prohibited data are defined.

### Architecture and configuration

- [x] The architecture is as simple as the requirements allow.
- [x] Module boundaries and ownership are clear.
- [x] Business logic is separated from presentation logic.
- [x] API keys and secrets are not hardcoded or exposed to the client.
- [x] Development, staging and production use separate configuration. _(env vars parameterized; staging/production hosts not chosen yet)_
- [ ] Secret scanning and dependency checks pass. _(no CI pipeline yet — see EXCEPTION_REGISTER)_
- [x] Serverless functions are used only where their operating model fits.

### Interface and content

- [ ] Every data-driven screen has a content-shaped skeleton loader. _(dashboard/placeholder screens have no async data yet in Phase 0 — revisit once Phase 1 adds real queries)_
- [x] Empty, partial, success and error states exist. _(ComingSoon states for unbuilt nav destinations; toast-based error states on every form)_
- [x] Semantic colour tokens are consistent.
- [x] Colour is not the only carrier of meaning.
- [x] Redundant subtitles, cards, labels and decoration are removed.
- [x] The primary action is visually clear.
- [x] Generic AI-generated copy has been replaced with concrete language.
- [x] A custom favicon, title, icon and sharing image are present. _(favicon is a placeholder monogram — see EXCEPTION_REGISTER)_
- [x] Logos, icons and simple illustrations use responsive SVG where suitable.
- [ ] Images have dimensions, compression and alternative text. _(no photographic imagery in Phase 0 yet)_
- [ ] Optimistic updates include pending, rollback and reconciliation behaviour. _(no optimistic-update candidates exist yet — Phase 1+)_

### Accessibility

- [x] The product targets WCAG 2.2 Level AA.
- [x] Core journeys work with keyboard-only navigation. _(shadcn/Radix primitives; manual verification still required before each release)_
- [x] Focus order and focus indicators are correct.
- [x] Forms have labels, instructions and associated errors.
- [ ] Contrast has been checked. _(token contrast computed at design time; run an automated contrast pass before release)_
- [ ] Screen reader announcements cover dynamic changes. _(not yet verified with a screen reader)_
- [ ] Zoom and text resizing do not break the interface. _(not yet manually tested)_
- [x] Reduced-motion preferences are respected.
- [ ] Automated and manual accessibility testing are complete. _(no automated a11y test wired yet — see EXCEPTION_REGISTER)_

### Authentication and security

- [x] Passwords use a recognised one-way password-hashing function. _(delegated to Supabase Auth)_
- [ ] Recoverable sensitive data uses appropriate encryption. _(no sensitive recoverable data exists yet)_
- [x] Client and server input validation are implemented. _(zod on the client; Postgres constraints + RLS on the server)_
- [x] Queries are parameterised. _(Supabase client library only)_
- [x] Session tokens are protected with secure cookie controls where applicable. _(delegated to Supabase Auth's session handling)_
- [x] Authentication and role checks occur on the server. _(RLS via `has_workspace_role`/`is_workspace_member`, not just client-side gating)_
- [x] Object-level ownership is verified on every protected operation. _(RLS policies scope every table by `workspace_id`, and further by account for the `client` role — see EXCEPTION_REGISTER for the "unverified against a live database" caveat)_
- [ ] MFA is enabled for privileged accounts. _(see EXCEPTION_REGISTER)_
- [ ] OTP and verification flows expire, are single-use and are rate limited. _(no OTP flow exists yet — Supabase email verification only)_
- [x] Login and signup endpoints are rate limited. _(email-keyed, server-side — see EXCEPTION_REGISTER for the IP-keying gap; no password-reset flow exists yet to limit)_
- [ ] Passwords are checked against compromised-password data. _(delegated to Supabase Auth; not independently verified)_
- [x] Account recovery avoids account enumeration. _(sign-in errors are deliberately generic)_
- [ ] Security headers, HTTPS and cross-origin restrictions are configured. _(depends on the chosen deployment host — not yet selected)_
- [x] User errors are actionable without revealing internal details.

### Database and backend

- [x] Every schema change uses a version-controlled migration.
- [x] Destructive changes have explicit approval and recovery plans. _(none shipped yet — policy documented in MASTER_RULES §7.2)_
- [ ] Migrations pass on production-like data. _(no Supabase project provisioned yet to test against)_
- [ ] Locking, runtime, storage and compatibility have been measured. _(N/A at this data volume — revisit before production traffic)_
- [x] Constraints and transactions protect important invariants.
- [ ] Backup restoration has been tested. _(no live project yet)_
- [ ] N+1 query candidates have been audited and measured. _(no list views with real data yet — Phase 1+)_
- [ ] Important list endpoints use pagination. _(no list endpoints yet — Phase 1+)_
- [x] External calls use timeouts and bounded retries. _(none exist yet beyond Supabase's own client)_
- [ ] State-changing retryable operations use idempotency controls. _(scaffold lifted, not wired — see EXCEPTION_REGISTER)_
- [ ] Duplicate and concurrent requests are tested. _(not yet tested against a live project)_
- [x] Edge cases and partial failures have defined behaviour for what exists so far (auth/onboarding error paths).

### AI features

- N/A — no AI feature exists in this product yet (see EXCEPTION_REGISTER). Scaffolding for provider fallback and observability is lifted and ready for when one is built.

### Operations and release

- [ ] Logs, metrics and traces cover critical flows. _(no deployment target chosen yet — see EXCEPTION_REGISTER)_
- [ ] Audit logs cover sensitive and consequential actions. _(wired for invitation created/accepted; other sensitive actions still unaudited — see EXCEPTION_REGISTER)_
- [x] Secrets and unnecessary personal data are redacted from telemetry. _(no telemetry pipeline exists yet to leak them)_
- [ ] Alerts correspond to user impact and operational thresholds. _(no monitoring exists yet)_
- [ ] Unit, integration, end-to-end and contract tests pass. _(unit tests exist for the lifted platform scaffolding; no route/integration tests yet)_
- [ ] Core journeys have been tested on representative devices and networks. _(manual browser verification pending)_
- [ ] Browser console and network errors are resolved. _(pending a live Supabase project to test the real auth flow end-to-end)_
- [ ] Deployment, health check and rollback steps are documented. _(no deployment target chosen yet)_
- [ ] The post-deployment verification is assigned to an owner. _(N/A until there's a deployment)_
