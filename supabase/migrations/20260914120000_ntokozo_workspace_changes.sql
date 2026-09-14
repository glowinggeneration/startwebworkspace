-- Requested changes from "Start Web – Workspace System Changes":
-- 1. A per-user `preferences` flag set so ntokozo@startweb.co.za gets an
--    explicit deal/account stage picker and no longer sees Campaigns in
--    her nav — everyone else keeps today's behaviour untouched.
-- 2. A broader industries list (this is shared reference data used by
--    every account's industry field, so it's added for every workspace
--    member, not gated behind the preference above).

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

update public.profiles
set preferences = preferences || '{"hideCampaigns": true, "showStagePicker": true}'::jsonb
where email = 'ntokozo@startweb.co.za';

-- Backfill the expanded industry list onto every existing workspace.
-- `unique (workspace_id, slug)` on industries makes this safe to re-run.
insert into public.industries (workspace_id, name, slug, sort_order)
select w.id, v.name, v.slug, v.sort_order
from public.workspaces w
cross join (
  values
    ('Construction', 'construction', 6),
    ('Engineering', 'engineering', 7),
    ('Logistics & transportation', 'logistics-transportation', 8),
    ('Agriculture', 'agriculture', 9),
    ('Energy & utilities', 'energy-utilities', 10),
    ('Oil & gas', 'oil-gas', 11),
    ('Telecommunications', 'telecommunications', 12),
    ('Technology & IT', 'technology-it', 13),
    ('Financial services', 'financial-services', 14),
    ('Healthcare', 'healthcare', 15),
    ('Education', 'education', 16),
    ('Hospitality & tourism', 'hospitality-tourism', 17),
    ('Automotive', 'automotive', 18),
    ('Food & beverage', 'food-beverage', 19),
    ('Professional services', 'professional-services', 20),
    ('Government & public sector', 'government-public-sector', 21),
    ('Infrastructure', 'infrastructure', 22),
    ('Chemicals', 'chemicals', 23),
    ('Pharmaceuticals', 'pharmaceuticals', 24),
    ('Security services', 'security-services', 25)
) as v(name, slug, sort_order)
on conflict (workspace_id, slug) do nothing;

-- Same list folded into the new-workspace seed trigger, so any workspace
-- created from now on starts with the full set too. Function body is
-- otherwise byte-identical to the one in 20260908010000_pipeline_foundation.sql —
-- CREATE OR REPLACE requires the whole body, not a diff.
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
    (new.id, 'Property', 'property', 5),
    (new.id, 'Construction', 'construction', 6),
    (new.id, 'Engineering', 'engineering', 7),
    (new.id, 'Logistics & transportation', 'logistics-transportation', 8),
    (new.id, 'Agriculture', 'agriculture', 9),
    (new.id, 'Energy & utilities', 'energy-utilities', 10),
    (new.id, 'Oil & gas', 'oil-gas', 11),
    (new.id, 'Telecommunications', 'telecommunications', 12),
    (new.id, 'Technology & IT', 'technology-it', 13),
    (new.id, 'Financial services', 'financial-services', 14),
    (new.id, 'Healthcare', 'healthcare', 15),
    (new.id, 'Education', 'education', 16),
    (new.id, 'Hospitality & tourism', 'hospitality-tourism', 17),
    (new.id, 'Automotive', 'automotive', 18),
    (new.id, 'Food & beverage', 'food-beverage', 19),
    (new.id, 'Professional services', 'professional-services', 20),
    (new.id, 'Government & public sector', 'government-public-sector', 21),
    (new.id, 'Infrastructure', 'infrastructure', 22),
    (new.id, 'Chemicals', 'chemicals', 23),
    (new.id, 'Pharmaceuticals', 'pharmaceuticals', 24),
    (new.id, 'Security services', 'security-services', 25);

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
