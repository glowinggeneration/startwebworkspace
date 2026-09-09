import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  ExplainerPanel,
  PageHeader,
  Panel,
  Toolbar,
  UnderlineTabs,
} from "@/components/application/shell/page-parts";
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
import { useQuotes, useUpdateQuoteStatus, type Quote } from "@/hooks/use-quotes";
import { useConvertQuoteToInvoice } from "@/hooks/use-invoices";
import { NewQuoteDialog } from "@/components/application/finance/new-quote-dialog";
import { downloadDocumentPdf } from "@/lib/pdf/document-pdf";
import { currency } from "@/lib/sales/currency";
import type { QuoteStatus } from "@/integrations/supabase/app-types";

export const Route = createFileRoute("/_authenticated/quotes")({
  component: QuotesPage,
  head: () => ({
    meta: [
      { title: "Quotes | Startweb" },
      {
        name: "description",
        content: "Build client quotes and convert accepted ones straight into invoices.",
      },
      { property: "og:title", content: "Quotes | Startweb" },
      { property: "og:description", content: "Quote your clients and convert to invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
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

  const [tab, setTab] = useState<"all" | QuoteStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (quotes ?? []).filter((quote) => {
      if (tab !== "all" && quote.status !== tab) return false;
      if (!term) return true;
      return (
        quote.quote_number.toLowerCase().includes(term) ||
        accountName(quote.account_id).toLowerCase().includes(term)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, accounts, tab, search]);

  const countFor = (status: QuoteStatus) =>
    (quotes ?? []).filter((quote) => quote.status === status).length;

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Quotes"
        description="An accepted quote converts straight into an invoice with the same line items."
        actions={<NewQuoteDialog />}
      />

      <UnderlineTabs
        ariaLabel="Quote status"
        value={tab}
        onValueChange={setTab}
        options={[
          { value: "all", label: "All quotes", count: quotes?.length ?? 0 },
          ...STATUS_OPTIONS.map((status) => ({
            value: status,
            label: status.charAt(0).toUpperCase() + status.slice(1),
            count: countFor(status),
          })),
        ]}
      />

      <Toolbar>
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search quotes..."
            aria-label="Search quotes"
            className="h-11 bg-card pl-9"
          />
        </div>
      </Toolbar>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon={FileText}
            title="No quotes yet"
            description="Create a quote for a client and send it for approval."
            action={<NewQuoteDialog />}
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map((quote) => (
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
      )}

      <ExplainerPanel
        icon={FileText}
        title="How a quote becomes an invoice"
        description="One accepted quote creates exactly one invoice."
      >
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Set a quote to accepted once the client confirms.</li>
          <li>Use Convert to invoice, the line items carry across unchanged.</li>
          <li>A quote can only be converted once, so retries never duplicate an invoice.</li>
        </ul>
      </ExplainerPanel>
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
  const lineItems = [...quote.quote_line_items].sort((a, b) => a.sort_order - b.sort_order);
  const invoicedAs = quote.invoices?.[0]?.invoice_number ?? null;
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
        {invoicedAs && (
          <span className="type-meta text-muted-foreground">Invoiced as {invoicedAs}</span>
        )}
        {quote.status === "accepted" && !invoicedAs && (
          <Button size="sm" onClick={onConvert} disabled={converting}>
            {converting ? "Converting…" : "Convert to invoice"}
          </Button>
        )}
      </div>
    </div>
  );
}
