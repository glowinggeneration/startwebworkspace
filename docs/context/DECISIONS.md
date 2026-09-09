# Decisions

Settled choices. Do not reopen without a new decision recorded here.

| Date       | Decision                                                                                                              | Why                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 2026-09-08 | One workspace equals one tenant; roles in `workspace_members`, never on profiles                                      | Prevents privilege escalation and keeps RLS simple  |
| 2026-09-08 | All schema change through version-controlled migrations                                                               | Reviewable, repeatable, no hand edits to production |
| 2026-09-08 | Server logic uses `createServerFn`; no edge functions                                                                 | Matches the framework, one server boundary          |
| 2026-09-08 | Approved Startweb design language is fixed: blue `#164BFA` sidebar, text-only wordmark, pale canvas, white cards      | Signed off against the reference screens            |
| 2026-09-08 | Amounts shown as ZAR `R30 000`, cents only when present                                                               | House format                                        |
| 2026-09-08 | No em dashes in product copy; labels are short and task based                                                         | House voice                                         |
| 2026-09-09 | Status aliases live in `app-types.ts`, not in generated types                                                         | Survives type regeneration                          |
| 2026-09-09 | Google is the only social sign-in; unsupported providers removed                                                      | Every visible control must work                     |
| 2026-09-09 | App is blocked below tablet width with a "use a desktop or tablet" message                                            | The screens need the width                          |
| 2026-09-09 | Dashboard shows a quiet shell while loading, no animated loader                                                       | Reduces flicker on entry                            |
| 2026-09-09 | Campaigns link to tasks directly through `tasks.campaign_id`, not through projects                                    | A campaign is not always a project                  |
| 2026-09-09 | Imported records keep `import_key`, `import_source` and `source_refs`; imports are idempotent and never invent values | Traceable back to the source conversation           |
| 2026-09-09 | Adding functionality never authorises redesigning existing screens                                                    | Protects signed-off work                            |
