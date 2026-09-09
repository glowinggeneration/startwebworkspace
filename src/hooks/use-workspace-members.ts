import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Workspace roster with display names. workspace_members and profiles
 * both reference auth.users but not each other, so PostgREST can't embed
 * one in the other — two queries, joined client-side.
 */
export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from("workspace_members")
        .select("user_id, role")
        .eq("workspace_id", workspaceId);
      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in(
          "id",
          members.map((m) => m.user_id),
        );
      if (profilesError) throw profilesError;

      return members.map((member) => {
        const profile = profiles?.find((p) => p.id === member.user_id);
        return {
          userId: member.user_id,
          role: member.role,
          name: profile?.full_name || profile?.email || "Unknown",
          email: profile?.email ?? null,
        };
      });
    },
  });
}
