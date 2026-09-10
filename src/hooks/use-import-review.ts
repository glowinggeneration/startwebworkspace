import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ImportReviewItem {
  id: string;
  record_type: string;
  record_key: string | null;
  issue: string;
  evidence: string | null;
  required_decision: string | null;
  source_refs: string | null;
  status: string;
  created_at: string;
}

/** Review queue for imported records that need a human decision. */
export function useImportReviewItems(workspaceId: string) {
  return useQuery({
    queryKey: ["import-review-items", workspaceId],
    queryFn: async (): Promise<ImportReviewItem[]> => {
      const { data, error } = await supabase
        .from("import_review_items")
        .select(
          "id, record_type, record_key, issue, evidence, required_decision, source_refs, status, created_at",
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ImportReviewStatus = "open" | "approved" | "rejected";

export function useSetImportReviewStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: ImportReviewStatus }) => {
      const { data: session } = await supabase.auth.getUser();
      const decided = input.status !== "open";
      const { error } = await supabase
        .from("import_review_items")
        .update({
          status: input.status,
          resolved_by: decided ? (session.user?.id ?? null) : null,
          resolved_at: decided ? new Date().toISOString() : null,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["import-review-items", workspaceId] });
    },
  });
}
