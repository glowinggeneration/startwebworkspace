-- Projects: builders only receive projects they are assigned to
DROP POLICY IF EXISTS "Members can read projects" ON public.projects;
CREATE POLICY "Members can read projects" ON public.projects
FOR SELECT TO authenticated
USING (
  can_view_account(auth.uid(), workspace_id, account_id)
  and (
    not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
    or public.can_view_project(auth.uid(), workspace_id, id)
  )
);

DROP POLICY IF EXISTS "Members can manage projects" ON public.projects;
CREATE POLICY "Members can manage projects" ON public.projects
FOR ALL TO authenticated
USING (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
)
WITH CHECK (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
);

-- Tasks
DROP POLICY IF EXISTS "Members can read tasks" ON public.tasks;
CREATE POLICY "Members can read tasks" ON public.tasks
FOR SELECT TO authenticated
USING (public.can_view_project(auth.uid(), workspace_id, project_id));

DROP POLICY IF EXISTS "Members can manage tasks" ON public.tasks;
CREATE POLICY "Members can manage tasks" ON public.tasks
FOR ALL TO authenticated
USING (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
)
WITH CHECK (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
);

CREATE POLICY "Builders can update their own tasks" ON public.tasks
FOR UPDATE TO authenticated
USING (public.can_view_project(auth.uid(), workspace_id, project_id))
WITH CHECK (public.can_view_project(auth.uid(), workspace_id, project_id));

-- Phases follow the project
DROP POLICY IF EXISTS "Members can read project phases" ON public.project_phases;
CREATE POLICY "Members can read project phases" ON public.project_phases
FOR SELECT TO authenticated
USING (public.can_view_project(auth.uid(), workspace_id, project_id));

-- Sales and finance records are closed to builders
DROP POLICY IF EXISTS "Members can read deals" ON public.deals;
CREATE POLICY "Members can read deals" ON public.deals
FOR SELECT TO authenticated
USING (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
);

DROP POLICY IF EXISTS "Members can manage deals" ON public.deals;
CREATE POLICY "Members can manage deals" ON public.deals
FOR ALL TO authenticated
USING (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
)
WITH CHECK (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
);

DROP POLICY IF EXISTS "Members can read quotes" ON public.quotes;
CREATE POLICY "Members can read quotes" ON public.quotes
FOR SELECT TO authenticated
USING (
  can_view_account(auth.uid(), workspace_id, account_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
);

DROP POLICY IF EXISTS "Members can manage quotes" ON public.quotes;
CREATE POLICY "Members can manage quotes" ON public.quotes
FOR ALL TO authenticated
USING (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
)
WITH CHECK (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
);

DROP POLICY IF EXISTS "Members can read invoices" ON public.invoices;
CREATE POLICY "Members can read invoices" ON public.invoices
FOR SELECT TO authenticated
USING (
  can_view_account(auth.uid(), workspace_id, account_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
);

DROP POLICY IF EXISTS "Members can manage invoices" ON public.invoices;
CREATE POLICY "Members can manage invoices" ON public.invoices
FOR ALL TO authenticated
USING (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
)
WITH CHECK (
  is_workspace_member(auth.uid(), workspace_id)
  and not is_client_role(auth.uid(), workspace_id)
  and not public.has_workspace_role(auth.uid(), workspace_id, 'builder')
);