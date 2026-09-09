create unique index if not exists invoices_one_per_quote
  on public.invoices (quote_id)
  where quote_id is not null;

create or replace function public.enforce_payment_within_invoice_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_total numeric;
  already_paid numeric;
begin
  select coalesce(sum(quantity * unit_price), 0)
    into invoice_total
    from public.invoice_line_items
   where invoice_id = new.invoice_id;

  select coalesce(sum(amount), 0)
    into already_paid
    from public.payments
   where invoice_id = new.invoice_id
     and (tg_op = 'INSERT' or id <> new.id);

  if invoice_total > 0 and already_paid + new.amount > invoice_total + 0.01 then
    raise exception 'Payment of % exceeds the outstanding balance of % on this invoice',
      new.amount, greatest(invoice_total - already_paid, 0)
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_payment_within_invoice_total() from public, anon, authenticated;

drop trigger if exists payments_within_invoice_total on public.payments;
create trigger payments_within_invoice_total
  before insert or update of amount on public.payments
  for each row execute function public.enforce_payment_within_invoice_total();

create index if not exists deals_workspace_status_idx on public.deals (workspace_id, status);
create index if not exists deals_account_idx on public.deals (account_id);
create index if not exists accounts_workspace_idx on public.accounts (workspace_id, name);
create index if not exists contacts_account_idx on public.contacts (account_id);
create index if not exists projects_workspace_idx on public.projects (workspace_id, status);
create index if not exists tasks_workspace_project_idx on public.tasks (workspace_id, project_id);
create index if not exists task_assignees_task_idx on public.task_assignees (task_id);
create index if not exists resource_allocations_week_idx on public.resource_allocations (workspace_id, week_start);
create index if not exists quotes_workspace_idx on public.quotes (workspace_id, created_at desc);
create index if not exists quote_line_items_quote_idx on public.quote_line_items (quote_id, sort_order);
create index if not exists invoices_workspace_idx on public.invoices (workspace_id, created_at desc);
create index if not exists invoices_account_idx on public.invoices (account_id, issue_date);
create index if not exists invoice_line_items_invoice_idx on public.invoice_line_items (invoice_id, sort_order);
create index if not exists payments_invoice_idx on public.payments (invoice_id, paid_at desc);
create index if not exists payments_workspace_idx on public.payments (workspace_id, paid_at desc);
create index if not exists daily_activity_log_range_idx on public.daily_activity_log (workspace_id, log_date desc);