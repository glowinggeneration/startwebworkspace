-- Phase 4: harden every existing table's RLS for the client role.

alter policy "Members can read industries" on public.industries
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage industries" on public.industries
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read packages" on public.packages
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage packages" on public.packages
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read deals" on public.deals
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage deals" on public.deals
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read monthly targets" on public.monthly_targets
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage monthly targets" on public.monthly_targets
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read monthly plan lines" on public.monthly_plan_lines
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage monthly plan lines" on public.monthly_plan_lines
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read industry playbooks" on public.industry_playbooks
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage industry playbooks" on public.industry_playbooks
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read the team's daily activity" on public.daily_activity_log
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read the team's weekly reviews" on public.weekly_reviews
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read project templates" on public.project_templates
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage project templates" on public.project_templates
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read template phases" on public.project_template_phases
  using (
    exists (
      select 1 from public.project_templates t
      where t.id = template_id
        and public.is_workspace_member(auth.uid(), t.workspace_id)
        and not public.is_client_role(auth.uid(), t.workspace_id)
    )
  );
alter policy "Members can manage template phases" on public.project_template_phases
  using (
    exists (
      select 1 from public.project_templates t
      where t.id = template_id
        and public.is_workspace_member(auth.uid(), t.workspace_id)
        and not public.is_client_role(auth.uid(), t.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.project_templates t
      where t.id = template_id
        and public.is_workspace_member(auth.uid(), t.workspace_id)
        and not public.is_client_role(auth.uid(), t.workspace_id)
    )
  );

alter policy "Members can read deal handoffs" on public.deal_handoffs
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage deal handoffs" on public.deal_handoffs
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read tasks" on public.tasks
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage tasks" on public.tasks
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read task assignees" on public.task_assignees
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage task assignees" on public.task_assignees
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read resource allocations" on public.resource_allocations
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
alter policy "Members can manage resource allocations" on public.resource_allocations
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read numbering counters" on public.numbering_counters
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read accounts" on public.accounts
  using (public.can_view_account(auth.uid(), workspace_id, id));
alter policy "Members can manage accounts" on public.accounts
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read contacts" on public.contacts
  using (public.can_view_account(auth.uid(), workspace_id, account_id));
alter policy "Members can manage contacts" on public.contacts
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read projects" on public.projects
  using (public.can_view_account(auth.uid(), workspace_id, account_id));
alter policy "Members can manage projects" on public.projects
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read project phases" on public.project_phases
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and public.can_view_account(auth.uid(), p.workspace_id, p.account_id)
    )
  );
alter policy "Members can manage project phases" on public.project_phases
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read quotes" on public.quotes
  using (public.can_view_account(auth.uid(), workspace_id, account_id));
alter policy "Members can manage quotes" on public.quotes
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read quote line items" on public.quote_line_items
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.can_view_account(auth.uid(), q.workspace_id, q.account_id)
    )
  );
alter policy "Members can manage quote line items" on public.quote_line_items
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.is_workspace_member(auth.uid(), q.workspace_id) and not public.is_client_role(auth.uid(), q.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.is_workspace_member(auth.uid(), q.workspace_id) and not public.is_client_role(auth.uid(), q.workspace_id)
    )
  );

alter policy "Members can read invoices" on public.invoices
  using (public.can_view_account(auth.uid(), workspace_id, account_id));
alter policy "Members can manage invoices" on public.invoices
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read invoice line items" on public.invoice_line_items
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.can_view_account(auth.uid(), i.workspace_id, i.account_id)
    )
  );
alter policy "Members can manage invoice line items" on public.invoice_line_items
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_workspace_member(auth.uid(), i.workspace_id) and not public.is_client_role(auth.uid(), i.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_workspace_member(auth.uid(), i.workspace_id) and not public.is_client_role(auth.uid(), i.workspace_id)
    )
  );

alter policy "Members can read payments" on public.payments
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.can_view_account(auth.uid(), i.workspace_id, i.account_id)
    )
  );
alter policy "Members can manage payments" on public.payments
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));

alter policy "Members can read their workspace roster" on public.workspace_members
  using (
    public.is_workspace_member(auth.uid(), workspace_id)
    and (not public.is_client_role(auth.uid(), workspace_id) or user_id = auth.uid())
  );