import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Panel } from "@/components/application/shell/page-parts";
import {
  LineItemsEditor,
  type LineItemDraft,
} from "@/components/application/finance/line-items-editor";
import { RecordPaymentDialog } from "@/components/application/finance/record-payment-dialog";
import { SignInvoiceDialog } from "@/components/application/finance/sign-invoice-dialog";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useProjects } from "@/hooks/use-projects";
import { useInvoice, useInvoiceLineItems, useUpdateInvoice } from "@/hooks/use-invoices";
import { usePayments } from "@/hooks/use-payments";
import { downloadDocumentPdf } from "@/lib/pdf/document-pdf";
import { currency } from "@/lib/sales/currency";
import type { InvoiceStatus } from "@/integrations/supabase/app-types";

export const Route = createFileRoute("/_authenticated/invoicing/$invoiceId")({
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { invoiceId } = Route.useParams();
  const { workspaceId } = useActiveWorkspace();
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: lines } = useInvoiceLineItems(invoiceId);
  const { data: payments } = usePayments(invoiceId);
  const { data: accounts } = useAccounts(workspaceId);
  const { data: projects } = useProjects(workspaceId);
  const updateInvoice = useUpdateInvoice(workspaceId);

  const [projectId, setProjectId] = useState("none");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);

  useEffect(() => {
    if (!invoice) return;
    setProjectId(invoice.project_id ?? "none");
    setDueDate(invoice.due_date ?? "");
    setNotes(invoice.notes ?? "");
  }, [invoice]);

  useEffect(() => {
    if (!lines) return;
    setLineItems(
      lines.map((line) => ({
        packageId: line.package_id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unit_price,
      })),
    );
  }, [lines]);

  if (isLoading || !invoice) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const accountName = accounts?.find((a) => a.id === invoice.account_id)?.name ?? "Unknown account";
  const accountProjects = (projects ?? []).filter(
    (project) => project.account_id === invoice.account_id,
  );
  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const paid = (payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = Math.max(total - paid, 0);

  const handleSave = async () => {
    try {
      await updateInvoice.mutateAsync({
        id: invoiceId,
        projectId: projectId === "none" ? null : projectId,
        dueDate: dueDate || null,
        notes: notes || null,
        lineItems,
      });
      toast.success("Invoice saved");
    } catch (error) {
      toast.error("Couldn't save the invoice", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleDownload = () => {
    downloadDocumentPdf({
      kind: "Invoice",
      number: invoice.invoice_number,
      issueDate: invoice.issue_date,
      dueOrExpiryDate: invoice.due_date,
      accountName,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      notes: invoice.notes,
    });
  };

  return (
    <div className="space-y-6 p-8">
      <Link
        to="/invoicing"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Invoicing
      </Link>

      <PageHeader
        title={invoice.invoice_number}
        description={`${accountName} · ${invoice.status} · ${currency.format(paid)} of ${currency.format(total)} paid`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="size-4" aria-hidden="true" />
              PDF
            </Button>
            <SignInvoiceDialog
              invoiceId={invoiceId}
              invoiceNumber={invoice.invoice_number}
              status={invoice.status as InvoiceStatus}
            />
            <RecordPaymentDialog invoiceId={invoiceId} outstanding={outstanding} />
          </div>
        }
      />

      <Panel className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Linked project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No specific project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific project</SelectItem>
                {accountProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>

        <LineItemsEditor items={lineItems} onChange={setLineItems} />

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateInvoice.isPending}>
            {updateInvoice.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Panel>

      {payments && payments.length > 0 && (
        <Panel className="space-y-2 p-6">
          <h2 className="text-sm font-semibold text-foreground">Payments</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {payments.map((payment) => (
              <li key={payment.id} className="flex justify-between">
                <span>
                  {payment.paid_at}
                  {payment.method ? ` · ${payment.method}` : ""}
                </span>
                <span>{currency.format(payment.amount)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
