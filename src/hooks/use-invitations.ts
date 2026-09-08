import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WorkspaceRole } from "@/integrations/supabase/types";
import { logAuditEvent } from "@/lib/audit/log-event";

export function useInvitations(workspaceId: string) {
  return useQuery({
    queryKey: ["invitations", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_invitations")
        .select("id, email, role, token, expires_at, accepted_at, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInvitation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      role: WorkspaceRole;
      clientAccountId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("workspace_invitations")
        .insert({
          workspace_id: workspaceId,
          email: input.email.trim().toLowerCase(),
          role: input.role,
          client_account_id: input.clientAccountId ?? null,
        })
        .select("id, token")
        .single();
      if (error) throw error;

      await logAuditEvent({
        action: "role.grant",
        resourceTable: "workspace_invitations",
        resourceId: data.id,
        metadata: { email: input.email, role: input.role, stage: "invited" },
      });

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invitations", workspaceId] });
    },
  });
}

export function useRevokeInvitation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workspace_invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invitations", workspaceId] });
    },
  });
}
