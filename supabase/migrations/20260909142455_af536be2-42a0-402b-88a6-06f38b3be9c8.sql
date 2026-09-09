-- Import provenance columns
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS account_type text,
  ADD COLUMN IF NOT EXISTS relationship_status text,
  ADD COLUMN IF NOT EXISTS primary_service text,
  ADD COLUMN IF NOT EXISTS review_priority text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS source_refs text,
  ADD COLUMN IF NOT EXISTS import_key text,
  ADD COLUMN IF NOT EXISTS import_source text;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS source_refs text,
  ADD COLUMN IF NOT EXISTS import_key text,
  ADD COLUMN IF NOT EXISTS import_source text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS status_label text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS source_refs text,
  ADD COLUMN IF NOT EXISTS import_key text,
  ADD COLUMN IF NOT EXISTS import_source text;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS status_label text,
  ADD COLUMN IF NOT EXISTS source_refs text,
  ADD COLUMN IF NOT EXISTS import_key text,
  ADD COLUMN IF NOT EXISTS import_source text;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_workspace_import_key_idx
  ON public.accounts (workspace_id, import_key) WHERE import_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS contacts_workspace_import_key_idx
  ON public.contacts (workspace_id, import_key) WHERE import_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_workspace_import_key_idx
  ON public.projects (workspace_id, import_key) WHERE import_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tasks_workspace_import_key_idx
  ON public.tasks (workspace_id, import_key) WHERE import_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS tasks_project_due_idx ON public.tasks (project_id, due_date);

-- Historical account notes
CREATE TABLE IF NOT EXISTS public.account_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  note_date date,
  category text,
  note text NOT NULL,
  source_refs text,
  import_key text,
  import_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_notes TO authenticated;
GRANT ALL ON public.account_notes TO service_role;
ALTER TABLE public.account_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members read account notes"
  ON public.account_notes FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id)
         AND public.can_view_account(auth.uid(), workspace_id, account_id));

CREATE POLICY "Workspace staff manage account notes"
  ON public.account_notes FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id)
         AND NOT public.is_client_role(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id)
         AND NOT public.is_client_role(auth.uid(), workspace_id));

CREATE UNIQUE INDEX IF NOT EXISTS account_notes_workspace_import_key_idx
  ON public.account_notes (workspace_id, import_key) WHERE import_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS account_notes_account_idx ON public.account_notes (account_id, note_date DESC);

CREATE TRIGGER account_notes_set_updated_at
  BEFORE UPDATE ON public.account_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Review queue
CREATE TABLE IF NOT EXISTS public.import_review_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  record_type text NOT NULL,
  record_key text,
  issue text NOT NULL,
  evidence text,
  required_decision text,
  source_refs text,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  import_key text,
  import_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_review_items_status_check CHECK (status IN ('open','resolved'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_review_items TO authenticated;
GRANT ALL ON public.import_review_items TO service_role;
ALTER TABLE public.import_review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins read review items"
  ON public.import_review_items FOR SELECT TO authenticated
  USING (public.has_workspace_role(auth.uid(), workspace_id, 'owner')
      OR public.has_workspace_role(auth.uid(), workspace_id, 'admin'));

CREATE POLICY "Owners and admins manage review items"
  ON public.import_review_items FOR ALL TO authenticated
  USING (public.has_workspace_role(auth.uid(), workspace_id, 'owner')
      OR public.has_workspace_role(auth.uid(), workspace_id, 'admin'))
  WITH CHECK (public.has_workspace_role(auth.uid(), workspace_id, 'owner')
      OR public.has_workspace_role(auth.uid(), workspace_id, 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS import_review_items_workspace_import_key_idx
  ON public.import_review_items (workspace_id, import_key) WHERE import_key IS NOT NULL;

CREATE TRIGGER import_review_items_set_updated_at
  BEFORE UPDATE ON public.import_review_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();