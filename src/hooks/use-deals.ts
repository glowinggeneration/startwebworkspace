import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, DealStatus } from "@/integrations/supabase/types";

type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];
type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

const DEAL_COLUMNS =
  "id, account_id, industry_id, package_id, owner_id, value, status, next_step, next_date, won_at, invoiced_at, referral_ask_logged, notes, created_at";

export function useDeals(workspaceId: string) {
  return useQuery({
    queryKey: ["deals", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(DEAL_COLUMNS)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];

export function useCreateDeal(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<DealInsert, "workspace_id" | "status">) => {
      const { data, error } = await supabase
        .from("deals")
        .insert({ ...input, workspace_id: workspaceId, status: "open" })
        .select(DEAL_COLUMNS)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deals", workspaceId] });
    },
  });
}

export function useUpdateDeal(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: DealUpdate }) => {
      const { data, error } = await supabase
        .from("deals")
        .update(patch)
        .eq("id", id)
        .select(DEAL_COLUMNS)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deals", workspaceId] });
    },
  });
}

/** Status-change helper: stamps won_at automatically, matching the "Won
 * requires won_at" database constraint, so callers never forget it. */
export function useTransitionDealStatus(workspaceId: string) {
  const updateDeal = useUpdateDeal(workspaceId);
  const patchFor = (status: DealStatus): DealUpdate =>
    status === "won" ? { status, won_at: new Date().toISOString() } : { status };
  return {
    ...updateDeal,
    mutate: (id: string, status: DealStatus) => updateDeal.mutate({ id, patch: patchFor(status) }),
    mutateAsync: (id: string, status: DealStatus) =>
      updateDeal.mutateAsync({ id, patch: patchFor(status) }),
  };
}
