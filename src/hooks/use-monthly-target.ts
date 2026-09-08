import { useQuery } from "@tanstack/react-query";
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
