import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, account_id, deal_id, name, status, owner_id, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProjectPhases(workspaceId: string) {
  return useQuery({
    queryKey: ["project-phases", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_phases")
        .select("id, project_id, name, sort_order, status")
        .eq("workspace_id", workspaceId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

/** Deletes a project and, by cascade, its phases and tasks. Quotes,
 * invoices and payments already raised from it are kept, just unlinked
 * (their project_id is set to null). */
export function useDeleteProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["project-board", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["project-phases", workspaceId] });
    },
  });
}

export function useHandoffsByProject(workspaceId: string) {
  return useQuery({
    queryKey: ["deal-handoffs-by-project", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_handoffs")
        .select(
          "id, project_id, deal_id, scope, logins_note, handed_off_at, acknowledged_by, acknowledged_at",
        )
        .eq("workspace_id", workspaceId);
      if (error) throw error;
      return data;
    },
  });
}
