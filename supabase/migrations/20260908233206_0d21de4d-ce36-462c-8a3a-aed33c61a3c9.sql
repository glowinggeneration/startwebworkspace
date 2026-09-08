-- RLS for Phase 2 tables — same workspace-member pattern as Phase 1.

create policy "Members can read project templates" on public.project_templates for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage project templates" on public.project_templates for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read template phases" on public.project_template_phases for select to authenticated
  using (
    exists (
      select 1 from public.project_templates t
      where t.id = template_id and public.is_workspace_member(auth.uid(), t.workspace_id)
    )
  );
create policy "Members can manage template phases" on public.project_template_phases for all to authenticated
  using (
    exists (
      select 1 from public.project_templates t
      where t.id = template_id and public.is_workspace_member(auth.uid(), t.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.project_templates t
      where t.id = template_id and public.is_workspace_member(auth.uid(), t.workspace_id)
    )
  );

create policy "Members can read projects" on public.projects for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage projects" on public.projects for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read project phases" on public.project_phases for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage project phases" on public.project_phases for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read deal handoffs" on public.deal_handoffs for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage deal handoffs" on public.deal_handoffs for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));