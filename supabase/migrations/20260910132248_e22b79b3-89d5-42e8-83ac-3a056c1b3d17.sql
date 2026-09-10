ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS leads_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_leads_count_non_negative CHECK (leads_count >= 0);

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quotes_campaign_id_idx ON public.quotes (campaign_id);
CREATE INDEX IF NOT EXISTS campaigns_lead_source_idx ON public.campaigns (workspace_id, lead_source);