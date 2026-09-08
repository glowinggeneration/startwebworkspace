import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentWeekStart } from "@/lib/sales/week";

export function useResourceAllocations(workspaceId: string, weekStart = currentWeekStart()) {
  return useQuery({
    queryKey: ["resource-allocations", workspaceId, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_allocations")
        .select("id, user_id, project_id, allocated_hours")
        .eq("workspace_id", workspaceId)
        .eq("week_start", weekStart);
      if (error) throw error;
      return data;
    },
  });
}

export function useSetAllocation(workspaceId: string, weekStart = currentWeekStart()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      projectId,
      allocatedHours,
    }: {
      userId: string;
      projectId: string;
      allocatedHours: number;
    }) => {
      const { error } = await supabase.from("resource_allocations").upsert(
        {
          workspace_id: workspaceId,
          user_id: userId,
          project_id: projectId,
          week_start: weekStart,
          allocated_hours: allocatedHours,
        },
        { onConflict: "workspace_id,user_id,project_id,week_start" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["resource-allocations", workspaceId, weekStart],
      });
    },
  });
}
