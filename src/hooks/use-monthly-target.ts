import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentMonthKey } from "@/lib/sales/month";

export function useMonthlyTarget(workspaceId: string, month = currentMonthKey()) {
  return useQuery({
    queryKey: ["monthly-target", workspaceId, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_targets")
        .select("id, month, target_amount, working_days, calling_start_date, coverage_multiplier")
        .eq("workspace_id", workspaceId)
        .eq("month", month)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Inline "Edit target" control on the dashboard writes through here. */
export function useSetMonthlyTarget(workspaceId: string, month = currentMonthKey()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetAmount: number) => {
      const { data, error } = await supabase
        .from("monthly_targets")
        .upsert(
          { workspace_id: workspaceId, month, target_amount: targetAmount },
          { onConflict: "workspace_id,month" },
        )
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["monthly-target", workspaceId, month] });
    },
  });
}
