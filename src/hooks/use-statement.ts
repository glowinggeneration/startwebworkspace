import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StatementLine {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: string;
  status: string;
  total: number;
  paid: number;
  balance: number;
}

/** Per-account rollup of invoices and payments — the "statement" concept
 * from docs/sales-ops/PIPELINE_REQUIREMENTS.md, derived on read rather
 * than stored, so it never drifts from the underlying invoices/payments. */
export function useStatement(workspaceId: string, accountId: string) {
  return useQuery({
    queryKey: ["statement", workspaceId, accountId],
    queryFn: async (): Promise<StatementLine[]> => {
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, invoice_number, issue_date, status")
        .eq("workspace_id", workspaceId)
        .eq("account_id", accountId)
        .order("issue_date");
      if (invoicesError) throw invoicesError;
      if (!invoices || invoices.length === 0) return [];

      const invoiceIds = invoices.map((invoice) => invoice.id);

      const { data: lineItems, error: lineItemsError } = await supabase
        .from("invoice_line_items")
        .select("invoice_id, quantity, unit_price")
        .in("invoice_id", invoiceIds);
      if (lineItemsError) throw lineItemsError;

      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("invoice_id, amount")
        .in("invoice_id", invoiceIds);
      if (paymentsError) throw paymentsError;

      return invoices.map((invoice) => {
        const total = (lineItems ?? [])
          .filter((item) => item.invoice_id === invoice.id)
          .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
        const paid = (payments ?? [])
          .filter((payment) => payment.invoice_id === invoice.id)
          .reduce((sum, payment) => sum + payment.amount, 0);
        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          issueDate: invoice.issue_date,
          status: invoice.status,
          total,
          paid,
          balance: total - paid,
        };
      });
    },
    enabled: Boolean(accountId),
  });
}
