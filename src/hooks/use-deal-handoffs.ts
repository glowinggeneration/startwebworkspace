import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDealHandoff(workspaceId: string, dealId: string) {
  return useQuery({
    queryKey: ["deal-handoff", workspaceId, dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_handoffs")
        .select(
          "id, project_id, scope, logins_note, signed_document_url, handed_off_by, handed_off_at, acknowledged_by, acknowledged_at",
        )
        .eq("workspace_id", workspaceId)
        .eq("deal_id", dealId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    // The handoff row is created by the on_deal_won_create_project trigger
    // in the same transaction as the status update — it exists by the time
    // this query fires, but a deal that was never won has none.
    enabled: Boolean(dealId),
  });
}

export function useUpdateHandoff(workspaceId: string, dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: {
      scope?: string | null;
      logins_note?: string | null;
      signed_document_url?: string | null;
    }) => {
      const { error } = await supabase
        .from("deal_handoffs")
        .update(patch)
        .eq("workspace_id", workspaceId)
        .eq("deal_id", dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deal-handoff", workspaceId, dealId] });
    },
  });
}

export function useAcknowledgeHandoff(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, userId }: { dealId: string; userId: string }) => {
      const { error } = await supabase
        .from("deal_handoffs")
        .update({ acknowledged_by: userId, acknowledged_at: new Date().toISOString() })
        .eq("workspace_id", workspaceId)
        .eq("deal_id", dealId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["deal-handoff", workspaceId, variables.dealId],
      });
      void queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });
}
