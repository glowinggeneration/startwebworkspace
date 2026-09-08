import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type WeeklyReviewUpsert = Database["public"]["Tables"]["weekly_reviews"]["Insert"];

export function useWeeklyReview(workspaceId: string, userId: string, weekEnding: string) {
  return useQuery({
    queryKey: ["weekly-review", workspaceId, userId, weekEnding],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_reviews")
        .select("id, question_1, question_2, question_3, calling_block_kept, next_week_notes")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .eq("week_ending", weekEnding)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveWeeklyReview(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<WeeklyReviewUpsert, "workspace_id">) => {
      const { error } = await supabase
        .from("weekly_reviews")
        .upsert(
          { ...input, workspace_id: workspaceId },
          { onConflict: "workspace_id,user_id,week_ending" },
        );
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["weekly-review", workspaceId, variables.user_id, variables.week_ending],
      });
    },
  });
}
