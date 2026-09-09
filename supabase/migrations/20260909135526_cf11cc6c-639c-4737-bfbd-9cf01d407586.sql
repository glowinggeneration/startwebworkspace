DROP POLICY IF EXISTS "Anyone with the token can read one invitation" ON public.workspace_invitations;
REVOKE SELECT ON public.workspace_invitations FROM anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(uuid) TO authenticated;