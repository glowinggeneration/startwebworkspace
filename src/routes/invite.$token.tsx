import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/invite/$token")({
  ssr: false,
  component: InvitePage,
});

interface Preview {
  workspace_name: string;
  role: string;
  email: string;
  is_expired: boolean;
  is_accepted: boolean;
}

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data, error }, { data: userData }] = await Promise.all([
        supabase.rpc("get_invitation_preview", { p_token: token }),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setLoadError("This invitation link isn't valid.");
        return;
      }
      setPreview(data[0] ?? null);
      setIsSignedIn(Boolean(userData.user));
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleAccept() {
    setIsAccepting(true);
    const { error } = await supabase.rpc("accept_workspace_invitation", { p_token: token });
    setIsAccepting(false);
    if (error) {
      toast.error("Couldn't accept the invitation", { description: error.message });
      return;
    }
    toast.success("You're in");
    void navigate({ to: "/dashboard" });
  }

  if (loadError) {
    return <StatusScreen title="Invitation not found" message={loadError} />;
  }

  if (!preview) {
    return <StatusScreen title="Loading…" message="Checking your invitation." />;
  }

  if (preview.is_accepted) {
    return (
      <StatusScreen
        title="Already accepted"
        message="This invitation has already been used."
        action={<Link to="/dashboard">Go to dashboard</Link>}
      />
    );
  }

  if (preview.is_expired) {
    return (
      <StatusScreen
        title="Invitation expired"
        message="Ask whoever invited you to send a new one."
      />
    );
  }

  return (
    <StatusScreen
      title={`Join ${preview.workspace_name}`}
      message={`You've been invited as ${preview.role}, for ${preview.email}.`}
      action={
        isSignedIn ? (
          <Button onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? "Joining…" : "Accept invitation"}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/register" search={{ next: `/invite/${token}` }}>
                Create account
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth" search={{ next: `/invite/${token}` }}>
                Sign in
              </Link>
            </Button>
          </div>
        )
      }
    />
  );
}

function StatusScreen({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="type-title">{title}</h1>
      <p className="type-body max-w-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
