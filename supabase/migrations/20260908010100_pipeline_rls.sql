-- RLS for Phase 1 tables. Shared/config tables: any workspace member can
-- read and write (see the note in the foundation migration about deferring
-- per-role write granularity to Phase 4). Personal tables (daily activity
-- log, weekly reviews): any member can read the team's rows, but a member
-- can only write their own.

create policy "Members can read industries" on public.industries for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage industries" on public.industries for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read packages" on public.packages for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage packages" on public.packages for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read accounts" on public.accounts for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage accounts" on public.accounts for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read contacts" on public.contacts for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage contacts" on public.contacts for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read deals" on public.deals for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage deals" on public.deals for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read monthly targets" on public.monthly_targets for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage monthly targets" on public.monthly_targets for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read monthly plan lines" on public.monthly_plan_lines for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage monthly plan lines" on public.monthly_plan_lines for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read industry playbooks" on public.industry_playbooks for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage industry playbooks" on public.industry_playbooks for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read the team's daily activity" on public.daily_activity_log for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "A member can write their own daily activity" on public.daily_activity_log for all to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(auth.uid(), workspace_id))
  with check (user_id = auth.uid() and public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read the team's weekly reviews" on public.weekly_reviews for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "A member can write their own weekly review" on public.weekly_reviews for all to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(auth.uid(), workspace_id))
  with check (user_id = auth.uid() and public.is_workspace_member(auth.uid(), workspace_id));
