import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/app-types";

export type CampaignStatus = "planned" | "active" | "paused" | "completed";

export type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"];

const CAMPAIGN_COLUMNS =
  "id, workspace_id, account_id, name, channel, status, start_date, end_date, owner_id, next_action, next_action_date, planned_cost, spent_cost, notes, created_at, updated_at";

export function useCampaigns(workspaceId: string) {
  return useQuery({
    queryKey: ["campaigns", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select(CAMPAIGN_COLUMNS)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CampaignRow[];
    },
  });
}

/**
 * Every task in the workspace, with the campaign it belongs to. The campaign
 * tracker reads this both to count linked work and to offer unlinked tasks.
 */
export function useWorkspaceTasks(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-tasks", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, project_id, campaign_id, title, status, priority, due_date")
        .eq("workspace_id", workspaceId)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCampaign(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CampaignInsert, "workspace_id">) => {
      const { error } = await supabase
        .from("campaigns")
        .insert({ ...input, workspace_id: workspaceId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
    },
  });
}

export function useUpdateCampaign(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: CampaignUpdate & { id: string }) => {
      const { error } = await supabase.from("campaigns").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
    },
  });
}

export function useDeleteCampaign(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["workspace-tasks", workspaceId] });
    },
  });
}

/** Attach an existing task to a campaign, or clear the link when null. */
export function useSetTaskCampaign(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, campaignId }: { taskId: string; campaignId: string | null }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ campaign_id: campaignId })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace-tasks", workspaceId] });
    },
  });
}
