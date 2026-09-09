import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { WorkspaceRole } from "@/integrations/supabase/app-types";
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

    const { data: memberRows } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", data.user.id);

    if (!memberRows || memberRows.length === 0) {
      throw redirect({ to: "/onboarding" });
    }

    const { data: workspaceRows } = await supabase
      .from("workspaces")
      .select("id, name")
      .in(
        "id",
        memberRows.map((m) => m.workspace_id),
      );
    const namesById = new Map((workspaceRows ?? []).map((w) => [w.id, w.name]));

    return {
      user: data.user,
      memberships: memberRows.map((m): WorkspaceMembership => ({
        workspaceId: m.workspace_id,
        workspaceName: namesById.get(m.workspace_id) ?? "",
        role: m.role,
      })),
    };
  },
  component: () => (
    <StartwebShell>
      <Outlet />
    </StartwebShell>
  ),
});
