import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];

export function useAccounts(workspaceId: string) {
  return useQuery({
    queryKey: ["accounts", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select(
          "id, name, industry_id, website, country, is_reference_client, deals(id, status, value), projects(id, name, status), invoices(id, invoice_number, status, invoice_line_items(quantity, unit_price), payments(amount))",
        )
        .eq("workspace_id", workspaceId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

/** The most destructive delete in the app: cascades to that account's
 * deals, projects (and by further cascade, their phases/tasks), quotes,
 * invoices (and their line items/payments), and contacts. Callers should
 * confirm with the counts already available from useAccounts before
 * calling this. */
export function useDeleteAccount(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["deals", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["project-board", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["quotes", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["invoices", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["client-board", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
    },
  });
}

export function useCreateAccount(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<AccountInsert, "workspace_id">) => {
      const { data, error } = await supabase
        .from("accounts")
        .insert({ ...input, workspace_id: workspaceId })
        .select("id, name, industry_id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts", workspaceId] });
    },
  });
}
