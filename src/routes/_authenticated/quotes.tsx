import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useQuotes, useQuoteLineItems, useUpdateQuoteStatus, type Quote } from "@/hooks/use-quotes";
import { useConvertQuoteToInvoice } from "@/hooks/use-invoices";
import { NewQuoteDialog } from "@/components/application/finance/new-quote-dialog";
import { downloadDocumentPdf } from "@/lib/pdf/document-pdf";
import { currency } from "@/lib/sales/currency";
import type { QuoteStatus } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/quotes")({
  component: QuotesPage,
});

const STATUS_OPTIONS: QuoteStatus[] = ["draft", "sent", "accepted", "declined", "expired"];

function QuotesPage() {
  const { workspaceId } = useActiveWorkspace();
  const navigate = useNavigate();
  const { data: quotes, isLoading } = useQuotes(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const updateStatus = useUpdateQuoteStatus(workspaceId);
  const convertToInvoice = useConvertQuoteToInvoice(workspaceId);

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "Unknown account";

  async function handleConvert(quote: Quote) {
    try {
      const invoice = await convertToInvoice.mutateAsync({
        quoteId: quote.id,
        accountId: quote.account_id,
        dealId: quote.deal_id,
      });
      toast.success(`Invoice ${invoice.invoice_number} created from this quote`);
      void navigate({ to: "/invoicing" });
    } catch (error) {
      toast.error("Couldn't convert to an invoice", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="section-stack p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-display">Quotes</h1>
          <p className="type-body text-muted-foreground">
            An accepted quote converts straight into an invoice with the same line items.
          </p>
        </div>
        <NewQuoteDialog />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {quotes && quotes.length === 0 && (
        <p className="type-body rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No quotes yet.
        </p>
      )}

      <div className="space-y-3">
        {quotes?.map((quote) => (
          <QuoteRow
            key={quote.id}
            quote={quote}
            accountName={accountName(quote.account_id)}
            onStatusChange={(status) => updateStatus.mutate({ id: quote.id, status })}
            onConvert={() => handleConvert(quote)}
            converting={convertToInvoice.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function QuoteRow({
  quote,
  accountName,
  onStatusChange,
  onConvert,
  converting,
}: {
  quote: Quote;
  accountName: string;
  onStatusChange: (status: QuoteStatus) => void;
  onConvert: () => void;
  converting: boolean;
}) {
  const { data: lineItems } = useQuoteLineItems(quote.id);
  const total = (lineItems ?? []).reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  function handleDownload() {
    downloadDocumentPdf({
      kind: "Quote",
      number: quote.quote_number,
      issueDate: quote.issue_date,
      dueOrExpiryDate: quote.expiry_date,
      accountName,
      lineItems: (lineItems ?? []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      notes: quote.notes,
    });
  }

  return (
    <div className="card-surface flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="type-card">{quote.quote_number}</p>
        <p className="type-meta text-muted-foreground">
          {accountName} · {currency.format(total)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={quote.status}
          onValueChange={(value) => onStatusChange(value as QuoteStatus)}
        >
          <SelectTrigger className="w-32 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="size-4" aria-hidden="true" />
          PDF
        </Button>
        {quote.status === "accepted" && (
          <Button size="sm" onClick={onConvert} disabled={converting}>
            {converting ? "Converting…" : "Convert to invoice"}
          </Button>
        )}
      </div>
    </div>
  );
}
