-- Production stage on every project
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS production_stage text NOT NULL DEFAULT 'brief_received';

-- Technical record, one row per project
CREATE TABLE IF NOT EXISTS public.project_tech (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  builder_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  designer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  domain text,
  hosting text,
  ssl_status text,
  tech_stack text,
  repo_url text,
  staging_url text,
  live_url text,
  launch_date date,
  maintenance_notes text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_tech TO authenticated;
GRANT ALL ON public.project_tech TO service_role;
ALTER TABLE public.project_tech ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.qa_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  status text NOT NULL DEFAULT 'submitted',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_submissions TO authenticated;
GRANT ALL ON public.qa_submissions TO service_role;
ALTER TABLE public.qa_submissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.project_blockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  raised_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_blockers TO authenticated;
GRANT ALL ON public.project_blockers TO service_role;
ALTER TABLE public.project_blockers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS project_tech_workspace_idx ON public.project_tech (workspace_id);
CREATE INDEX IF NOT EXISTS qa_submissions_project_idx ON public.qa_submissions (project_id);
CREATE INDEX IF NOT EXISTS project_blockers_project_idx ON public.project_blockers (project_id);

CREATE TRIGGER project_tech_updated_at BEFORE UPDATE ON public.project_tech
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- A builder only ever receives the projects they are assigned to
CREATE OR REPLACE FUNCTION public.can_view_project(_user_id uuid, _workspace_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select public.is_workspace_member(_user_id, _workspace_id)
    and not public.is_client_role(_user_id, _workspace_id)
    and (
      not public.has_workspace_role(_user_id, _workspace_id, 'builder')
      or exists (
        select 1 from public.project_tech t
        where t.project_id = _project_id
          and (t.builder_id = _user_id or t.designer_id = _user_id)
      )
      or exists (
        select 1 from public.projects p
        where p.id = _project_id and p.owner_id = _user_id
      )
      or exists (
        select 1 from public.task_assignees ta
        join public.tasks tk on tk.id = ta.task_id
        where tk.project_id = _project_id and ta.user_id = _user_id
      )
    )
$$;

CREATE POLICY "Members can read project tech" ON public.project_tech
FOR SELECT TO authenticated
USING (public.can_view_project(auth.uid(), workspace_id, project_id));

CREATE POLICY "Leads can manage project tech" ON public.project_tech
FOR ALL TO authenticated
USING (
  public.has_workspace_role(auth.uid(), workspace_id, 'owner')
  or public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  or public.has_workspace_role(auth.uid(), workspace_id, 'cto')
  or public.has_workspace_role(auth.uid(), workspace_id, 'pm')
)
WITH CHECK (
  public.has_workspace_role(auth.uid(), workspace_id, 'owner')
  or public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  or public.has_workspace_role(auth.uid(), workspace_id, 'cto')
  or public.has_workspace_role(auth.uid(), workspace_id, 'pm')
);

CREATE POLICY "Members can read qa submissions" ON public.qa_submissions
FOR SELECT TO authenticated
USING (public.can_view_project(auth.uid(), workspace_id, project_id));

CREATE POLICY "Members can submit qa" ON public.qa_submissions
FOR INSERT TO authenticated
WITH CHECK (
  public.can_view_project(auth.uid(), workspace_id, project_id)
  and submitted_by = auth.uid()
);

-- Nobody reviews their own submission
CREATE POLICY "Leads can review qa" ON public.qa_submissions
FOR UPDATE TO authenticated
USING (
  (public.has_workspace_role(auth.uid(), workspace_id, 'owner')
   or public.has_workspace_role(auth.uid(), workspace_id, 'admin')
   or public.has_workspace_role(auth.uid(), workspace_id, 'cto'))
  and submitted_by is distinct from auth.uid()
)
WITH CHECK (
  public.has_workspace_role(auth.uid(), workspace_id, 'owner')
  or public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  or public.has_workspace_role(auth.uid(), workspace_id, 'cto')
);

CREATE POLICY "Members can read blockers" ON public.project_blockers
FOR SELECT TO authenticated
USING (public.can_view_project(auth.uid(), workspace_id, project_id));

CREATE POLICY "Members can manage blockers" ON public.project_blockers
FOR ALL TO authenticated
USING (public.can_view_project(auth.uid(), workspace_id, project_id))
WITH CHECK (public.can_view_project(auth.uid(), workspace_id, project_id));