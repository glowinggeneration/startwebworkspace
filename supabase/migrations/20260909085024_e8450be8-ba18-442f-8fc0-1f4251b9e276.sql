CREATE OR REPLACE FUNCTION public.add_workspace_creator_as_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.add_workspace_creator_as_owner() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS workspaces_add_creator_owner ON public.workspaces;
CREATE TRIGGER workspaces_add_creator_owner
AFTER INSERT ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.add_workspace_creator_as_owner();