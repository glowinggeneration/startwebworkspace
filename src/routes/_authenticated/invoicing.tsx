import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Download } from "lucide-react";
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
import {
  useInvoices,
  useInvoiceLineItems,
  useUpdateInvoiceStatus,
  type Invoice,
} from "@/hooks/use-invoices";
import { usePayments } from "@/hooks/use-payments";
import { NewInvoiceDialog } from "@/components/application/finance/new-invoice-dialog";
import { RecordPaymentDialog } from "@/components/application/finance/record-payment-dialog";
import { downloadDocumentPdf } from "@/lib/pdf/document-pdf";
import { currency } from "@/lib/sales/currency";
import type { InvoiceStatus } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/invoicing")({
  component: InvoicingPage,
});

const STATUS_OPTIONS: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "void"];

function InvoicingPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: invoices, isLoading } = useInvoices(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const updateStatus = useUpdateInvoiceStatus(workspaceId);

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "Unknown account";

  return (
    <div className="section-stack p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-display">Invoicing</h1>
          <p className="type-body text-muted-foreground">
            An invoice is marked paid automatically once its recorded payments reach the total.
          </p>
        </div>
        <NewInvoiceDialog />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {invoices && invoices.length === 0 && (
        <p className="type-body rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No invoices yet.
        </p>
      )}

      <div className="space-y-3">
        {invoices?.map((invoice) => (
          <InvoiceRow
            key={invoice.id}
            invoice={invoice}
            accountName={accountName(invoice.account_id)}
            onStatusChange={(status) => updateStatus.mutate({ id: invoice.id, status })}
          />
        ))}
      </div>
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
  const { data: lineItems } = useInvoiceLineItems(invoice.id);
  const { data: payments } = usePayments(invoice.id);
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
      <button
        type="button"
        className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <div>
          <p className="type-card">{invoice.invoice_number}</p>
          <p className="type-meta text-muted-foreground">
            {accountName} · {currency.format(total)}
            {totalPaid > 0 && totalPaid < total ? ` · ${currency.format(totalPaid)} paid` : ""}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

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
            <RecordPaymentDialog invoiceId={invoice.id} />
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
