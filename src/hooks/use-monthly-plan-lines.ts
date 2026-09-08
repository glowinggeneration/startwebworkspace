import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentMonthKey } from "@/lib/sales/month";

export function useMonthlyPlanLines(workspaceId: string, month = currentMonthKey()) {
  return useQuery({
    queryKey: ["monthly-plan-lines", workspaceId, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_plan_lines")
        .select("id, package_id, planned_units")
        .eq("workspace_id", workspaceId)
        .eq("month", month);
      if (error) throw error;
      return data;
    },
  });
}

export function useSetPlannedUnits(workspaceId: string, month = currentMonthKey()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      packageId,
      plannedUnits,
    }: {
      packageId: string;
      plannedUnits: number;
    }) => {
      const { error } = await supabase
        .from("monthly_plan_lines")
        .upsert(
          { workspace_id: workspaceId, month, package_id: packageId, planned_units: plannedUnits },
          { onConflict: "workspace_id,month,package_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["monthly-plan-lines", workspaceId, month] });
    },
  });
}
