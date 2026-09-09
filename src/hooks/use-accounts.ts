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
