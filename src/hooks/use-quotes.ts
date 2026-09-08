import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { QuoteStatus } from "@/integrations/supabase/types";
import type { LineItemDraft } from "@/components/application/finance/line-items-editor";

export function useQuotes(workspaceId: string) {
  return useQuery({
    queryKey: ["quotes", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(
          "id, account_id, deal_id, quote_number, status, issue_date, expiry_date, notes, created_at",
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export type Quote = NonNullable<ReturnType<typeof useQuotes>["data"]>[number];

export function useQuoteLineItems(quoteId: string) {
  return useQuery({
    queryKey: ["quote-line-items", quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_line_items")
        .select("id, package_id, description, quantity, unit_price, sort_order")
        .eq("quote_id", quoteId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: Boolean(quoteId),
  });
}

export function useCreateQuote(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      accountId,
      dealId,
      expiryDate,
      notes,
      lineItems,
    }: {
      accountId: string;
      dealId?: string | null;
      expiryDate?: string | null;
      notes?: string | null;
      lineItems: LineItemDraft[];
    }) => {
      const { data: quoteNumber, error: numberError } = await supabase.rpc("next_document_number", {
        p_workspace_id: workspaceId,
        p_series: "quote",
      });
      if (numberError) throw numberError;

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          workspace_id: workspaceId,
          account_id: accountId,
          deal_id: dealId ?? null,
          quote_number: quoteNumber,
          expiry_date: expiryDate ?? null,
          notes: notes ?? null,
        })
        .select("id, quote_number")
        .single();
      if (quoteError) throw quoteError;

      if (lineItems.length > 0) {
        const { error: itemsError } = await supabase.from("quote_line_items").insert(
          lineItems.map((item, index) => ({
            quote_id: quote.id,
            package_id: item.packageId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            sort_order: index,
          })),
        );
        if (itemsError) throw itemsError;
      }

      return quote;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes", workspaceId] });
    },
  });
}

export function useUpdateQuoteStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QuoteStatus }) => {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes", workspaceId] });
    },
  });
}
