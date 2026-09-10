-- Internal-only tables: no API access for anon/authenticated.
revoke all on public.audit_log from anon, authenticated;
revoke all on public.rate_limit_hits from anon, authenticated;
revoke all on public.numbering_counters from anon, authenticated;
grant all on public.audit_log to service_role;
grant all on public.rate_limit_hits to service_role;
grant all on public.numbering_counters to service_role;

drop policy if exists "Members can read numbering counters" on public.numbering_counters;

-- Purely internal routines: not callable through the API at all.
revoke all on function public.prune_rate_limit_hits(interval) from anon, authenticated, public;
revoke all on function public.recompute_invoice_paid_status(uuid) from anon, authenticated, public;
revoke all on function public.recompute_phase_and_project_status(uuid) from anon, authenticated, public;
revoke all on function public.set_updated_at() from anon, authenticated, public;

-- Signed-out visitors keep only the invitation preview.
revoke all on function public.can_view_account(uuid, uuid, uuid) from anon, public;
revoke all on function public.client_account_id_for(uuid, uuid) from anon, public;
revoke all on function public.has_workspace_role(uuid, uuid, public.workspace_role) from anon, public;
revoke all on function public.is_client_role(uuid, uuid) from anon, public;
revoke all on function public.is_workspace_member(uuid, uuid) from anon, public;
revoke all on function public.shares_workspace(uuid, uuid) from anon, public;
revoke all on function public.log_audit_event(text, text, text, jsonb) from anon, public;
revoke all on function public.next_document_number(uuid, text) from anon, public;
revoke all on function public.accept_workspace_invitation(uuid) from anon, public;

-- Keep the calls the app actually makes.
grant execute on function public.can_view_account(uuid, uuid, uuid) to authenticated;
grant execute on function public.client_account_id_for(uuid, uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, uuid, public.workspace_role) to authenticated;
grant execute on function public.is_client_role(uuid, uuid) to authenticated;
grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.shares_workspace(uuid, uuid) to authenticated;
grant execute on function public.log_audit_event(text, text, text, jsonb) to authenticated;
grant execute on function public.next_document_number(uuid, text) to authenticated;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;
grant execute on function public.get_invitation_preview(uuid) to anon, authenticated;