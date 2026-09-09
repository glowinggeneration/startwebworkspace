CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  name text NOT NULL,
  channel text,
  status text NOT NULL DEFAULT 'planned',
  start_date date,
  end_date date,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_action text,
  next_action_date date,
  planned_cost numeric NOT NULL DEFAULT 0,
  spent_cost numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_status_check CHECK (status IN ('planned','active','paused','completed')),
  CONSTRAINT campaigns_planned_cost_check CHECK (planned_cost >= 0),
  CONSTRAINT campaigns_spent_cost_check CHECK (spent_cost >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id) AND NOT is_client_role(auth.uid(), workspace_id));

CREATE POLICY "Members can manage campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id) AND NOT is_client_role(auth.uid(), workspace_id))
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id) AND NOT is_client_role(auth.uid(), workspace_id));

CREATE INDEX campaigns_workspace_idx ON public.campaigns (workspace_id);
CREATE INDEX campaigns_owner_idx ON public.campaigns (owner_id);

CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tasks
  ADD COLUMN campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX tasks_campaign_idx ON public.tasks (campaign_id);