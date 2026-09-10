alter table public.invoices
  add column if not exists signed_at timestamptz,
  add column if not exists signed_by text,
  add column if not exists signed_note text;

comment on column public.invoices.signed_at is 'When the client signed off the invoice. Null until signed.';
comment on column public.invoices.signed_by is 'Name of the person who signed for the client.';
comment on column public.invoices.signed_note is 'Optional reference captured at signing, e.g. a PO number.';