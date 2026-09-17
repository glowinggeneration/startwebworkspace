alter table public.accounts
  add column if not exists next_step text,
  add column if not exists next_date date,
  add column if not exists ops_status text,
  add column if not exists source text,
  add column if not exists list_import_id uuid references public.calling_list_imports(id) on delete set null;
