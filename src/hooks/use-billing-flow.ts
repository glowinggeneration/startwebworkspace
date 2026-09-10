import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InvoiceStatus, QuoteStatus } from "@/integrations/supabase/app-types";

export interface BillingLine {
  quantity: number;
  unit_price: number;
}

export interface BillingPayment {
  id: string;
  amount: number;
  paid_at: string;
  method: string | null;
}

export interface BillingInvoice {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  signed_at: string | null;
  signed_by: string | null;
  signed_note: string | null;
  invoice_line_items: BillingLine[];
  payments: BillingPayment[];
}

export interface BillingQuote {
  id: string;
  quote_number: string;
  status: QuoteStatus;
  issue_date: string;
  expiry_date: string | null;
  deal_id: string | null;
  quote_line_items: BillingLine[];
}

/** One client document journey: a quote, the invoice raised from it, and its payments. */
export interface BillingFlow {
  id: string;
  accountId: string;
  accountName: string;
  quote: BillingQuote | null;
  invoice: BillingInvoice | null;
}

export type BillingStage = "quote" | "invoice" | "signed" | "paid";

export const BILLING_STAGES: { value: BillingStage; label: string; description: string }[] = [
  { value: "quote", label: "Quote", description: "Waiting on the client to accept." },
  { value: "invoice", label: "Invoice", description: "Raised, not yet signed." },
  { value: "signed", label: "Signed", description: "Signed off, payment due." },
  { value: "paid", label: "Paid", description: "Settled in full." },
];

export function lineTotal(lines: BillingLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
}

export function paidTotal(invoice: BillingInvoice): number {
  return invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

export function outstanding(invoice: BillingInvoice): number {
  return Math.max(lineTotal(invoice.invoice_line_items) - paidTotal(invoice), 0);
}

export function billingStage(flow: BillingFlow): BillingStage {
  const { invoice } = flow;
  if (!invoice) return "quote";
  if (
    invoice.status === "paid" ||
    (lineTotal(invoice.invoice_line_items) > 0 && outstanding(invoice) <= 0)
  ) {
    return "paid";
  }
  if (invoice.signed_at) return "signed";
  return "invoice";
}

const INVOICE_SELECT =
  "id, invoice_number, status, issue_date, due_date, signed_at, signed_by, signed_note, invoice_line_items(quantity, unit_price), payments(id, amount, paid_at, method)";

/**
 * Every quote in the workspace with the invoice raised from it, plus invoices
 * that were created without a quote, so the whole quote to payment journey is
 * visible on one board.
 */
export function useBillingFlow(workspaceId: string) {
  return useQuery({
    queryKey: ["billing-flow", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<BillingFlow[]> => {
      const [quotesResult, invoicesResult] = await Promise.all([
        supabase
          .from("quotes")
          .select(
            `id, account_id, deal_id, quote_number, status, issue_date, expiry_date, accounts(name), quote_line_items(quantity, unit_price), invoices(${INVOICE_SELECT})`,
          )
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select(`${INVOICE_SELECT}, account_id, accounts(name)`)
          .eq("workspace_id", workspaceId)
          .is("quote_id", null)
          .order("created_at", { ascending: false }),
      ]);
      if (quotesResult.error) throw quotesResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      const fromQuotes: BillingFlow[] = (quotesResult.data ?? []).map((quote) => {
        const invoice = (quote.invoices ?? [])[0] ?? null;
        return {
          id: `quote-${quote.id}`,
          accountId: quote.account_id,
          accountName: quote.accounts?.name ?? "Unknown account",
          quote: {
            id: quote.id,
            quote_number: quote.quote_number,
            status: quote.status as QuoteStatus,
            issue_date: quote.issue_date,
            expiry_date: quote.expiry_date,
            deal_id: quote.deal_id,
            quote_line_items: quote.quote_line_items ?? [],
          },
          invoice: invoice ? toInvoice(invoice) : null,
        };
      });

      const direct: BillingFlow[] = (invoicesResult.data ?? []).map((invoice) => ({
        id: `invoice-${invoice.id}`,
        accountId: invoice.account_id,
        accountName: invoice.accounts?.name ?? "Unknown account",
        quote: null,
        invoice: toInvoice(invoice),
      }));

      return [...fromQuotes, ...direct];
    },
  });
}

function toInvoice(row: {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  signed_at: string | null;
  signed_by: string | null;
  signed_note: string | null;
  invoice_line_items: BillingLine[] | null;
  payments: BillingPayment[] | null;
}): BillingInvoice {
  return {
    id: row.id,
    invoice_number: row.invoice_number,
    status: row.status as InvoiceStatus,
    issue_date: row.issue_date,
    due_date: row.due_date,
    signed_at: row.signed_at,
    signed_by: row.signed_by,
    signed_note: row.signed_note,
    invoice_line_items: row.invoice_line_items ?? [],
    payments: row.payments ?? [],
  };
}
