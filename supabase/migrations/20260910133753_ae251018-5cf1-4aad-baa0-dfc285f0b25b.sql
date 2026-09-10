CREATE TABLE IF NOT EXISTS public.calendar_feed_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz,
  UNIQUE (workspace_id, user_id)
);

GRANT ALL ON public.calendar_feed_tokens TO service_role;
ALTER TABLE public.calendar_feed_tokens ENABLE ROW LEVEL SECURITY;