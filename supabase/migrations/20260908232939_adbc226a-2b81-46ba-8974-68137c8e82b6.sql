-- RLS policies for the Phase 0 tables. Every later feature table
-- (accounts, deals, projects, invoices, ...) should ship with the same
-- shape: members can read rows in their own workspace; owner/admin (or a
-- more specific role, once a feature needs one) can write.

create policy "Own profile is readable"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Own profile is updatable"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Members can read their workspaces"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(auth.uid(), id));

create policy "Any authenticated user can create a workspace"
  on public.workspaces for insert
  to authenticated
  with check (true);

create policy "Owners and admins can update their workspace"
  on public.workspaces for update
  to authenticated
  using (
    public.has_workspace_role(auth.uid(), id, 'owner')
    or public.has_workspace_role(auth.uid(), id, 'admin')
  );

create policy "Members can read their workspace roster"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));

-- A user creating a brand-new workspace needs to insert their own first
-- membership row (as 'owner') in the same onboarding step; every other
-- membership change requires an existing owner/admin.
create policy "A user can add themself as the first member of a workspace they created"
  on public.workspace_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and not public.is_workspace_member(auth.uid(), workspace_id)
  );

create policy "Owners and admins manage workspace membership"
  on public.workspace_members for all
  to authenticated
  using (
    public.has_workspace_role(auth.uid(), workspace_id, 'owner')
    or public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  )
  with check (
    public.has_workspace_role(auth.uid(), workspace_id, 'owner')
    or public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  );