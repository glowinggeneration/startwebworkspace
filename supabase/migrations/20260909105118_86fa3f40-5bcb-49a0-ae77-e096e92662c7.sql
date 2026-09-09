
-- 1. Profile setup marker
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET profile_completed = true
WHERE email = 'thabo@startweb.co.za';

-- 2. Add the three teammates to Thabo's workspace
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT w.workspace_id, u.id, 'member'::public.workspace_role
FROM auth.users u
CROSS JOIN (
  SELECT m.workspace_id
  FROM public.workspace_members m
  JOIN auth.users o ON o.id = m.user_id
  WHERE o.email = 'thabo@startweb.co.za' AND m.role = 'owner'
  LIMIT 1
) w
WHERE u.email IN ('ndumiso@startweb.co.za','ntokozo@startweb.co.za','maleka@startweb.co.za')
ON CONFLICT DO NOTHING;

-- 3. Future signups: auto-accept any pending invitation for that email
CREATE OR REPLACE FUNCTION public.auto_join_invited_workspaces()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role, client_account_id)
  SELECT i.workspace_id, NEW.id, i.role, i.client_account_id
  FROM public.workspace_invitations i
  WHERE lower(i.email) = lower(NEW.email)
    AND i.accepted_at IS NULL
    AND i.expires_at > now()
  ON CONFLICT DO NOTHING;

  UPDATE public.workspace_invitations
  SET accepted_at = now(), accepted_by = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND accepted_at IS NULL
    AND expires_at > now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_join ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_join
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_join_invited_workspaces();
