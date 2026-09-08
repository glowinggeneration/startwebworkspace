import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePackages(workspaceId: string) {
  return useQuery({
    queryKey: ["packages", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("id, name, slug, billing_type, price, is_working_price, sort_order")
        .eq("workspace_id", workspaceId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}
