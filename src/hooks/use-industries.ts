import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIndustries(workspaceId: string) {
  return useQuery({
    queryKey: ["industries", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industries")
        .select("id, name, slug, sort_order")
        .eq("workspace_id", workspaceId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}
