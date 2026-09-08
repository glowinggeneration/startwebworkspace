import { useQuery } from "@tanstack/react-query";
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
