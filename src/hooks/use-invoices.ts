import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InvoiceStatus } from "@/integrations/supabase/types";
import type { LineItemDraft } from "@/components/application/finance/line-items-editor";

const INVOICE_COLUMNS =
  "id, account_id, deal_id, project_id, quote_id, invoice_number, status, issue_date, due_date, notes, created_at";

export function useInvoices(workspaceId: string) {
  return useQuery({
    queryKey: ["invoices", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(INVOICE_COLUMNS)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export type Invoice = NonNullable<ReturnType<typeof useInvoices>["data"]>[number];

export function useInvoiceLineItems(invoiceId: string) {
  return useQuery({
    queryKey: ["invoice-line-items", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("id, package_id, description, quantity, unit_price, sort_order")
        .eq("invoice_id", invoiceId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: Boolean(invoiceId),
  });
}

async function insertInvoice(
  workspaceId: string,
  input: {
    accountId: string;
    dealId?: string | null;
    projectId?: string | null;
    quoteId?: string | null;
    dueDate?: string | null;
    notes?: string | null;
  },
  lineItems: LineItemDraft[],
) {
  const { data: invoiceNumber, error: numberError } = await supabase.rpc("next_document_number", {
    p_workspace_id: workspaceId,
    p_series: "invoice",
  });
  if (numberError) throw numberError;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      workspace_id: workspaceId,
      account_id: input.accountId,
      deal_id: input.dealId ?? null,
      project_id: input.projectId ?? null,
      quote_id: input.quoteId ?? null,
      invoice_number: invoiceNumber,
      due_date: input.dueDate ?? null,
      notes: input.notes ?? null,
    })
    .select(INVOICE_COLUMNS)
    .single();
  if (invoiceError) throw invoiceError;

  if (lineItems.length > 0) {
    const { error: itemsError } = await supabase.from("invoice_line_items").insert(
      lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        package_id: item.packageId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        sort_order: index,
      })),
    );
    if (itemsError) throw itemsError;
  }

  return invoice;
}

export function useCreateInvoice(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      accountId: string;
      dealId?: string | null;
      projectId?: string | null;
      dueDate?: string | null;
      notes?: string | null;
      lineItems: LineItemDraft[];
    }) => insertInvoice(workspaceId, input, input.lineItems),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices", workspaceId] });
    },
  });
}

/** Copies a quote's account/line items into a new invoice — the "convert
 * an accepted quote" action from docs/sales-ops/PIPELINE_REQUIREMENTS.md. */
export function useConvertQuoteToInvoice(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      quoteId,
      accountId,
      dealId = null,
    }: {
      quoteId: string;
      accountId: string;
      dealId?: string | null;
    }) => {
      const { data: lines, error: linesError } = await supabase
        .from("quote_line_items")
        .select("package_id, description, quantity, unit_price")
        .eq("quote_id", quoteId)
        .order("sort_order");
      if (linesError) throw linesError;

      const lineItems: LineItemDraft[] = (lines ?? []).map((line) => ({
        packageId: line.package_id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unit_price,
      }));

      return insertInvoice(workspaceId, { accountId, dealId, quoteId }, lineItems);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices", workspaceId] });
    },
  });
}

export function useUpdateInvoiceStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices", workspaceId] });
    },
  });
}
