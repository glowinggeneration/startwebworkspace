import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePayments(invoiceId: string) {
  return useQuery({
    queryKey: ["payments", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, paid_at, method, notes")
        .eq("invoice_id", invoiceId)
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(invoiceId),
  });
}

export function usePaymentsForWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: ["payments-workspace", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, invoice_id, amount, paid_at, method, notes")
        .eq("workspace_id", workspaceId)
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRecordPayment(workspaceId: string, invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      amount: number;
      paidAt: string;
      method?: string | null;
      notes?: string | null;
    }) => {
      const { error } = await supabase.from("payments").insert({
        workspace_id: workspaceId,
        invoice_id: invoiceId,
        amount: input.amount,
        paid_at: input.paidAt,
        method: input.method ?? null,
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments", invoiceId] });
      // The DB trigger may flip the invoice to 'paid' as part of this write.
      void queryClient.invalidateQueries({ queryKey: ["invoices", workspaceId] });
    },
  });
}
