import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Download, Receipt, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  ExplainerPanel,
  MetricTile,
  PageHeader,
  Panel,
  Toolbar,
  UnderlineTabs,
} from "@/components/application/shell/page-parts";
import { invoiceBalance } from "@/lib/finance/balance";
import { cn } from "@/lib/utils";
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
import { useInvoices, useUpdateInvoiceStatus, type Invoice } from "@/hooks/use-invoices";
import { NewInvoiceDialog } from "@/components/application/finance/new-invoice-dialog";
import { RecordPaymentDialog } from "@/components/application/finance/record-payment-dialog";
import { downloadDocumentPdf } from "@/lib/pdf/document-pdf";
import { currency } from "@/lib/sales/currency";
import type { InvoiceStatus } from "@/integrations/supabase/app-types";

export const Route = createFileRoute("/_authenticated/invoicing")({
  component: InvoicingPage,
  head: () => ({
    meta: [
      { title: "Invoicing | Startweb" },
      {
        name: "description",
        content: "Raise invoices, record payments and watch outstanding balances.",
      },
      { property: "og:title", content: "Invoicing | Startweb" },
      { property: "og:description", content: "Invoices and payments in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const STATUS_OPTIONS: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "void"];

function InvoicingPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: invoices, isLoading } = useInvoices(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const updateStatus = useUpdateInvoiceStatus(workspaceId);

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "Unknown account";

  const [tab, setTab] = useState<"all" | InvoiceStatus>("all");
  const [search, setSearch] = useState("");

  const totals = useMemo(() => {
    const all = invoices ?? [];
    const monthStart = new Date();
    monthStart.setDate(1);
    const outstanding = all
      .filter((invoice) => invoice.status !== "void")
      .reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
    const overdue = all
      .filter((invoice) => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
    const paidThisMonth = all
      .flatMap((invoice) => invoice.payments)
      .filter((payment) => new Date(payment.paid_at) >= monthStart)
      .reduce((sum, payment) => sum + payment.amount, 0);
    return { outstanding, overdue, paidThisMonth };
  }, [invoices]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (invoices ?? []).filter((invoice) => {
      if (tab !== "all" && invoice.status !== tab) return false;
      if (!term) return true;
      return (
        invoice.invoice_number.toLowerCase().includes(term) ||
        accountName(invoice.account_id).toLowerCase().includes(term)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, accounts, tab, search]);

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Invoicing"
        description="An invoice is marked paid automatically once its recorded payments reach the total."
        actions={<NewInvoiceDialog />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricTile label="Outstanding" value={currency.format(totals.outstanding)} />
        <MetricTile label="Overdue" value={currency.format(totals.overdue)} />
        <MetricTile label="Paid this month" value={currency.format(totals.paidThisMonth)} />
      </div>

      <UnderlineTabs
        ariaLabel="Invoice status"
        value={tab}
        onValueChange={setTab}
        options={[
          { value: "all", label: "All invoices", count: invoices?.length ?? 0 },
          ...STATUS_OPTIONS.map((status) => ({
            value: status,
            label: status.charAt(0).toUpperCase() + status.slice(1),
            count: (invoices ?? []).filter((invoice) => invoice.status === status).length,
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
            placeholder="Search invoices..."
            aria-label="Search invoices"
            className="h-11 bg-card pl-9"
          />
        </div>
      </Toolbar>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Raise an invoice directly, or convert an accepted quote."
            action={<NewInvoiceDialog />}
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              accountName={accountName(invoice.account_id)}
              onStatusChange={(status) => updateStatus.mutate({ id: invoice.id, status })}
            />
          ))}
        </div>
      )}

      <ExplainerPanel
        icon={Receipt}
        title="How payment status works"
        description="Statuses follow the payments you record."
      >
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Recorded payments reduce the outstanding balance on the invoice.</li>
          <li>An invoice flips to paid on its own once payments reach the total.</li>
          <li>A payment larger than the outstanding balance is rejected.</li>
        </ul>
      </ExplainerPanel>
    </div>
  );
}

function InvoiceRow({
  invoice,
  accountName,
  onStatusChange,
}: {
  invoice: Invoice;
  accountName: string;
  onStatusChange: (status: InvoiceStatus) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lineItems = [...invoice.invoice_line_items].sort((a, b) => a.sort_order - b.sort_order);
  const payments = [...invoice.payments].sort((a, b) => (a.paid_at < b.paid_at ? 1 : -1));
  const total = (lineItems ?? []).reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalPaid = (payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);

  function handleDownload() {
    downloadDocumentPdf({
      kind: "Invoice",
      number: invoice.invoice_number,
      issueDate: invoice.issue_date,
      dueOrExpiryDate: invoice.due_date,
      accountName,
      lineItems: (lineItems ?? []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      notes: invoice.notes,
    });
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left">
        <div>
          <Link
            to="/invoicing/$invoiceId"
            params={{ invoiceId: invoice.id }}
            className="type-card hover:underline"
          >
            {invoice.invoice_number}
          </Link>
          <p className="type-meta text-muted-foreground">
            {accountName} · {currency.format(total)}
            {totalPaid > 0 && totalPaid < total ? ` · ${currency.format(totalPaid)} paid` : ""}
          </p>
        </div>
        <button
          type="button"
          className="rounded-md p-1 hover:bg-accent"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={invoice.status}
              onValueChange={(value) => onStatusChange(value as InvoiceStatus)}
            >
              <SelectTrigger
                className="w-32 capitalize"
                onClick={(event) => event.stopPropagation()}
              >
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
            <RecordPaymentDialog
              invoiceId={invoice.id}
              outstanding={Math.max(total - totalPaid, 0)}
            />
          </div>

          <div>
            <p className="type-meta mb-1 text-muted-foreground">Payments</p>
            {payments && payments.length === 0 && (
              <p className="type-body text-muted-foreground">No payments recorded yet.</p>
            )}
            <ul className="space-y-1">
              {payments?.map((payment) => (
                <li key={payment.id} className="type-body flex justify-between">
                  <span>
                    {payment.paid_at}
                    {payment.method ? ` · ${payment.method}` : ""}
                  </span>
                  <span>{currency.format(payment.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
