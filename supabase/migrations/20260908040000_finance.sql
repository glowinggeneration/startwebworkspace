-- Phase 5: quotes, invoices, statements. Recording only — no payment
-- processing (Application Build Master Rules prohibit executing
-- financial transactions; this tracks amounts/status, it doesn't move
-- money). Document numbers are allocated atomically per workspace/series
-- so two concurrent creates can never collide.

create table public.numbering_counters (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  series text not null check (series in ('quote', 'invoice')),
  year int not null,
  next_number int not null default 1,
  primary key (workspace_id, series, year)
);

alter table public.numbering_counters enable row level security;
revoke all on public.numbering_counters from anon, authenticated;
grant select on public.numbering_counters to authenticated;
grant all on public.numbering_counters to service_role;

create policy "Members can read numbering counters" on public.numbering_counters for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));

-- SECURITY DEFINER + row lock: the only safe way to hand out sequential
-- numbers under concurrent requests without a gap-free-but-racy
-- select-max-then-insert pattern. Callers never write numbering_counters
-- directly (no INSERT/UPDATE grant to authenticated), only through this.
create or replace function public.next_document_number(p_workspace_id uuid, p_series text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now())::int;
  v_number int;
  v_prefix text := case p_series when 'quote' then 'Q' when 'invoice' then 'INV' else upper(p_series) end;
begin
  insert into public.numbering_counters (workspace_id, series, year, next_number)
  values (p_workspace_id, p_series, v_year, 1)
  on conflict (workspace_id, series, year) do nothing;

  update public.numbering_counters
  set next_number = next_number + 1
  where workspace_id = p_workspace_id and series = p_series and year = v_year
  returning next_number - 1 into v_number;

  return v_prefix || '-' || v_year || '-' || lpad(v_number::text, 4, '0');
end;
$$;
revoke execute on function public.next_document_number(uuid, text) from public, anon;
grant execute on function public.next_document_number(uuid, text) to authenticated;

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  quote_number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  issue_date date not null default current_date,
  expiry_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, quote_number)
);

create table public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  description text not null,
  quantity numeric(8, 2) not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  sort_order int not null default 0
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'void')),
  issue_date date not null default current_date,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, invoice_number)
);

create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  description text not null,
  quantity numeric(8, 2) not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  sort_order int not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  paid_at date not null default current_date,
  method text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.quotes enable row level security;
alter table public.quote_line_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;

revoke all on
  public.quotes, public.quote_line_items, public.invoices, public.invoice_line_items, public.payments
from anon, authenticated;
grant select, insert, update, delete on
  public.quotes, public.quote_line_items, public.invoices, public.invoice_line_items, public.payments
to authenticated;
grant all on
  public.quotes, public.quote_line_items, public.invoices, public.invoice_line_items, public.payments
to service_role;

create trigger quotes_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

-- A paid invoice is derived from its payments, not typed in directly: if
-- total payments reach the invoice total, mark it paid; if a payment is
-- deleted and that's no longer true, revert (unless void).
create or replace function public.recompute_invoice_paid_status(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_paid numeric(12, 2);
  v_invoice_total numeric(12, 2);
  v_status text;
begin
  select status into v_status from public.invoices where id = p_invoice_id;
  if v_status is null or v_status = 'void' then
    return;
  end if;

  select coalesce(sum(quantity * unit_price), 0) into v_invoice_total
  from public.invoice_line_items where invoice_id = p_invoice_id;

  select coalesce(sum(amount), 0) into v_total_paid
  from public.payments where invoice_id = p_invoice_id;

  if v_invoice_total > 0 and v_total_paid >= v_invoice_total then
    update public.invoices set status = 'paid' where id = p_invoice_id and status <> 'paid';
  elsif v_status = 'paid' then
    update public.invoices set status = 'sent' where id = p_invoice_id;
  end if;
end;
$$;
revoke execute on function public.recompute_invoice_paid_status(uuid) from public, anon, authenticated;

create or replace function public.handle_payment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    perform public.recompute_invoice_paid_status(old.invoice_id);
    return old;
  end if;
  perform public.recompute_invoice_paid_status(new.invoice_id);
  return new;
end;
$$;
revoke execute on function public.handle_payment_change() from public, anon, authenticated;

create trigger on_payment_change_recompute_invoice
  after insert or update or delete on public.payments
  for each row execute function public.handle_payment_change();
