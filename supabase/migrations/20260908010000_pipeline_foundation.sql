-- Phase 1: CRM & Pipeline. Every table here follows the Phase 0 pattern
-- (workspace_id + RLS via is_workspace_member/has_workspace_role). Config
-- tables (industries, packages, monthly targets/plan, playbooks) and
-- shared operational tables (accounts, contacts, deals) are writable by
-- any workspace member in this phase — granular per-role write
-- restrictions inside a workspace are deferred to Phase 4 (RBAC
-- hardening); the RLS boundary that actually matters for data isolation
-- (workspace_id) is enforced from day one.

create table public.industries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  billing_type text not null check (billing_type in ('one_off', 'recurring')),
  price numeric(12, 2) not null check (price >= 0),
  is_working_price boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  industry_id uuid references public.industries(id) on delete set null,
  website text,
  country text,
  is_reference_client boolean not null default false,
  reference_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role_title text,
  created_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  industry_id uuid references public.industries(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  value numeric(12, 2) not null check (value >= 0),
  status text not null default 'open' check (status in ('open', 'won', 'lost', 'later')),
  next_step text,
  next_date date,
  won_at timestamptz,
  invoiced_at timestamptz,
  referral_ask_logged boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- "If there is no next step and no date, it is not a real deal" — enforced,
  -- not just a UI convention.
  constraint deals_open_requires_next_step check (
    status <> 'open' or (next_step is not null and next_date is not null)
  ),
  constraint deals_won_requires_won_at check (status <> 'won' or won_at is not null)
);

-- Won is not Billed: a deal only counts toward a month's target once it is
-- signed AND invoiced in that calendar month (see docs/sales-ops/PIPELINE_REQUIREMENTS.md #3).
-- Billed-this-month is deliberately a query-time computation
-- (status = 'won' and date_trunc('month', invoiced_at) = date_trunc('month', <target month>)),
-- not a stored flag, so it never drifts out of sync with invoiced_at.

create table public.monthly_targets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  month date not null,
  target_amount numeric(12, 2) not null check (target_amount >= 0),
  working_days int,
  calling_start_date date,
  coverage_multiplier numeric(4, 2) not null default 3.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, month)
);

create table public.monthly_plan_lines (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  month date not null,
  package_id uuid not null references public.packages(id) on delete cascade,
  planned_units int not null default 0 check (planned_units >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, month, package_id)
);

create table public.daily_activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  industry_focus_id uuid references public.industries(id) on delete set null,
  touches int not null default 0 check (touches >= 0),
  conversations int not null default 0 check (conversations >= 0),
  meetings_booked int not null default 0 check (meetings_booked >= 0),
  meetings_held int not null default 0 check (meetings_held >= 0),
  offers_sent int not null default 0 check (offers_sent >= 0),
  wins int not null default 0 check (wins >= 0),
  hours_calling numeric(4, 2) not null default 0 check (hours_calling >= 0),
  notes_for_tomorrow text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id, log_date)
);

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_ending date not null,
  question_1 text,
  question_2 text,
  question_3 text,
  calling_block_kept boolean,
  next_week_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id, week_ending)
);

create table public.industry_playbooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  industry_id uuid not null references public.industries(id) on delete cascade,
  opening_line text not null,
  questions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, industry_id)
);

alter table public.industries enable row level security;
alter table public.packages enable row level security;
alter table public.accounts enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.monthly_targets enable row level security;
alter table public.monthly_plan_lines enable row level security;
alter table public.daily_activity_log enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.industry_playbooks enable row level security;

revoke all on
  public.industries, public.packages, public.accounts, public.contacts, public.deals,
  public.monthly_targets, public.monthly_plan_lines, public.daily_activity_log,
  public.weekly_reviews, public.industry_playbooks
from anon, authenticated;

grant select, insert, update, delete on
  public.industries, public.packages, public.accounts, public.contacts, public.deals,
  public.monthly_targets, public.monthly_plan_lines, public.daily_activity_log,
  public.weekly_reviews, public.industry_playbooks
to authenticated;

grant all on
  public.industries, public.packages, public.accounts, public.contacts, public.deals,
  public.monthly_targets, public.monthly_plan_lines, public.daily_activity_log,
  public.weekly_reviews, public.industry_playbooks
to service_role;

create trigger packages_updated_at before update on public.packages
  for each row execute function public.set_updated_at();
create trigger accounts_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger deals_updated_at before update on public.deals
  for each row execute function public.set_updated_at();
create trigger monthly_targets_updated_at before update on public.monthly_targets
  for each row execute function public.set_updated_at();
create trigger monthly_plan_lines_updated_at before update on public.monthly_plan_lines
  for each row execute function public.set_updated_at();
create trigger daily_activity_log_updated_at before update on public.daily_activity_log
  for each row execute function public.set_updated_at();
create trigger weekly_reviews_updated_at before update on public.weekly_reviews
  for each row execute function public.set_updated_at();
create trigger industry_playbooks_updated_at before update on public.industry_playbooks
  for each row execute function public.set_updated_at();

-- Seed every newly created workspace with the five-industry fence, the
-- starting package catalog (working prices), the Sep/Oct/Nov 2026 ramp,
-- and the desk-card scripts — see docs/sales-ops/PIPELINE_REQUIREMENTS.md.
-- A workspace created after this ramp is history keeps the same starter
-- data as a sane default; adjust or delete rows per workspace as needed.
create or replace function public.seed_default_pipeline_data()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_manufacturing uuid;
  v_retail uuid;
  v_waste uuid;
  v_mining uuid;
  v_property uuid;
begin
  insert into public.industries (workspace_id, name, slug, sort_order) values
    (new.id, 'Manufacturing', 'manufacturing', 1),
    (new.id, 'Retail', 'retail', 2),
    (new.id, 'Waste management', 'waste-management', 3),
    (new.id, 'Mining', 'mining', 4),
    (new.id, 'Property', 'property', 5);

  select id into v_manufacturing from public.industries where workspace_id = new.id and slug = 'manufacturing';
  select id into v_retail from public.industries where workspace_id = new.id and slug = 'retail';
  select id into v_waste from public.industries where workspace_id = new.id and slug = 'waste-management';
  select id into v_mining from public.industries where workspace_id = new.id and slug = 'mining';
  select id into v_property from public.industries where workspace_id = new.id and slug = 'property';

  insert into public.packages (workspace_id, name, slug, billing_type, price, sort_order) values
    (new.id, 'Starter Website', 'starter-website', 'one_off', 7000, 1),
    (new.id, 'Business Website', 'business-website', 'one_off', 18000, 2),
    (new.id, 'Premium Website', 'premium-website', 'one_off', 40000, 3),
    (new.id, 'SMAIT content job', 'smait-content-job', 'one_off', 7000, 4),
    (new.id, 'SMAIT monthly retainer', 'smait-monthly-retainer', 'recurring', 10000, 5);

  insert into public.monthly_targets (workspace_id, month, target_amount, working_days, calling_start_date) values
    (new.id, date '2026-09-01', 30000, 13, date '2026-09-15'),
    (new.id, date '2026-10-01', 75000, 22, null),
    (new.id, date '2026-11-01', 115000, 21, null);

  insert into public.industry_playbooks (workspace_id, industry_id, opening_line, questions) values
    (
      new.id, v_manufacturing,
      'I opened your website on my phone this morning. I could not see what you actually make, or how a buyer sends you a drawing. Buyers at plants now pick suppliers from a phone. If they cannot see you clearly, they call the next company.',
      array[
        'When a buyer wants a quote this week, where does that request land?',
        'How long does it take your side to answer with a spec or drawing?',
        'If they cannot see your range in two minutes, what happens to that job this month?',
        'If the website already answered the first five questions, what would that free on your week?'
      ]
    ),
    (
      new.id, v_retail,
      'After the shop closes, customers still ask about stock and hours on WhatsApp. That work is landing on someone''s personal phone. The website should take the first question so your floor staff are not doing it at night.',
      array[
        'Who owns the WhatsApp inbox after closing time?',
        'How many of those night questions are the same three things?',
        'What does one missed after-hours customer cost you in a quiet week?',
        'If the site showed hours, range and WhatsApp, who gets their evenings back?'
      ]
    ),
    (
      new.id, v_waste,
      'When a facilities manager asks for a company profile at four in the afternoon, most waste companies still build a document from scratch. Your website should already be that profile, ready to forward.',
      array[
        'When someone asks for a company profile, who builds it and how long does it take?',
        'Can a committee forward your current website without you feeling nervous?',
        'If that pack already lived on one web address, what would Thursday afternoon look like?',
        'Which contracts this quarter still need you to look ready on paper?'
      ]
    ),
    (
      new.id, v_mining,
      'If someone in buying forwarded your website into a tender chat tonight, would you be happy with the first screen they see? I build websites that work as a capability pack — safety, method, sites, people — not as a marketing page.',
      array[
        'Who inside a mine or contractor has to feel safe forwarding your page?',
        'What do they look for in the first thirty seconds?',
        'When they compare you with a cleaner pack, who looks like the safer award?',
        'If the page already did that job, which tender this quarter gets easier to enter?'
      ]
    ),
    (
      new.id, v_property,
      'Property portals send you the click. The enquiry then dies on a personal phone and the owner of the agency never sees it. Your own website should catch that lead and keep it in one place.',
      array[
        'Of the last twenty WhatsApp enquiries, how many still exist as a file the office can work?',
        'Who sees a viewing request that arrives after eight at night?',
        'If a lead never leaves an agent''s phone, what does the principal actually know?',
        'If every enquiry wrote into one inbox, what would that change this month?'
      ]
    );

  return new;
end;
$$;
revoke execute on function public.seed_default_pipeline_data() from public, anon, authenticated;

create trigger on_workspace_created_seed_pipeline
  after insert on public.workspaces
  for each row execute function public.seed_default_pipeline_data();
