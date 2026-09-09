-- RLS for Phase 5 tables. quotes/invoices/payments carry workspace_id
-- directly; their line items don't (no reason to duplicate it), so their
-- policies check membership via the parent row instead.

create policy "Members can read quotes" on public.quotes for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage quotes" on public.quotes for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read quote line items" on public.quote_line_items for select to authenticated
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.is_workspace_member(auth.uid(), q.workspace_id)
    )
  );
create policy "Members can manage quote line items" on public.quote_line_items for all to authenticated
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.is_workspace_member(auth.uid(), q.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and public.is_workspace_member(auth.uid(), q.workspace_id)
    )
  );

create policy "Members can read invoices" on public.invoices for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage invoices" on public.invoices for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read invoice line items" on public.invoice_line_items for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_workspace_member(auth.uid(), i.workspace_id)
    )
  );
create policy "Members can manage invoice line items" on public.invoice_line_items for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_workspace_member(auth.uid(), i.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_workspace_member(auth.uid(), i.workspace_id)
    )
  );

create policy "Members can read payments" on public.payments for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage payments" on public.payments for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));