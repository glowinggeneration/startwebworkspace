import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectBoardProject } from "@/hooks/use-project-board";

/**
 * Move a project to a target phase by marking that phase as in_progress and
 * all earlier phases as done. Later phases are reset to not_started.
 */
export function useUpdateProjectPhase(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, phaseName }: { projectId: string; phaseName: string }) => {
      // Fetch the project's phases to know sort order.
      const { data: phases, error: fetchError } = await supabase
        .from("project_phases")
        .select("id, name, sort_order, status")
        .eq("project_id", projectId)
        .eq("workspace_id", workspaceId)
        .order("sort_order");
      if (fetchError) throw fetchError;

      const targetIndex = (phases ?? []).findIndex((phase) => phase.name === phaseName);
      if (targetIndex === -1) throw new Error(`Phase "${phaseName}" not found on this project.`);

      for (const phase of phases ?? []) {
        const index = phases.findIndex((p) => p.id === phase.id);
        const nextStatus =
          index < targetIndex ? "done" : index === targetIndex ? "in_progress" : "not_started";
        if (phase.status === nextStatus) continue;
        const { error } = await supabase
          .from("project_phases")
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq("id", phase.id)
          .eq("workspace_id", workspaceId);
        if (error) throw error;
      }

      return { projectId, phaseName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-board", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["project-phases", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
    onError: (error) => {
      toast.error("Couldn't move the project", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });
}
