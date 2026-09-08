import { useRouteContext } from "@tanstack/react-router";
import type { WorkspaceRole } from "@/integrations/supabase/types";
import type { WorkspaceMembership } from "@/routes/_authenticated/route";

/**
 * Reads the current user's role in their active workspace from the
 * `_authenticated` route context (populated in `beforeLoad`). Replaces the
 * hardcoded-admin-email pattern some sibling projects use — every check
 * here is backed by the real `workspace_members` row, matching the RLS
 * policies on the database side.
 */
export function useWorkspaceRole(workspaceId?: string): WorkspaceRole | null {
  const { memberships } = useRouteContext({ from: "/_authenticated" });
  const membership = workspaceId
    ? memberships.find((m: WorkspaceMembership) => m.workspaceId === workspaceId)
    : memberships[0];
  return membership?.role ?? null;
}

export function useHasWorkspaceRole(roles: WorkspaceRole[], workspaceId?: string): boolean {
  const role = useWorkspaceRole(workspaceId);
  return role !== null && roles.includes(role);
}
