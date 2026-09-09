import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { WorkspaceRole } from "@/integrations/supabase/app-types";
import { KineticTextLoader } from "@/components/core/kinetic-loader";
import { StartwebShell } from "@/components/application/shell/startweb-shell";

export interface WorkspaceMembership {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const next = `${location.pathname}${location.searchStr}${location.hash}`;
      throw redirect({ to: "/auth", search: { next } });
    }

    // Memberships and workspace names in one round trip, so the gate does
    // not stack two waits before the first paint.
    const { data: memberRows } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, workspaces(name)")
      .eq("user_id", data.user.id);

    if (!memberRows || memberRows.length === 0) {
      throw redirect({ to: "/onboarding" });
    }

    // First login for an invited teammate: collect their profile details
    // before letting them into the workspace.
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_completed")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile && !profile.profile_completed) {
      throw redirect({ to: "/profile-setup" });
    }

    return {
      user: data.user,
      memberships: memberRows.map((m): WorkspaceMembership => ({
        workspaceId: m.workspace_id,
        workspaceName: m.workspaces?.name ?? "",
        role: m.role,
      })),
    };
  },
  pendingMs: 0,
  pendingComponent: AuthenticatedSkeleton,
  component: () => (
    <StartwebShell>
      <Outlet />
    </StartwebShell>
  ),
});

/** Quiet placeholder while the session and membership check resolve: the
 * shell frame appears immediately, with no spinner or pulsing blocks. */
function AuthenticatedSkeleton() {
  return (
    <div className="flex min-h-screen" aria-busy="true" aria-label="Opening your workspace">
      <div className="hidden w-[15.5rem] shrink-0 bg-sidebar md:block" />
      <div className="flex-1 bg-background" />
    </div>
  );
}
