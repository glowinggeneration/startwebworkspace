import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIndustryPlaybooks(workspaceId: string) {
  return useQuery({
    queryKey: ["industry-playbooks", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industry_playbooks")
        .select("id, industry_id, opening_line, questions")
        .eq("workspace_id", workspaceId);
      if (error) throw error;
      return data;
    },
  });
}
