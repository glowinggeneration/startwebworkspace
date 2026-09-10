import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useProjects } from "@/hooks/use-projects";
import { useQuote, useQuoteLineItems, useUpdateQuote } from "@/hooks/use-quotes";
import { useConvertQuoteToInvoice } from "@/hooks/use-invoices";
import { downloadDocumentPdf } from "@/lib/pdf/document-pdf";

export const Route = createFileRoute("/_authenticated/quotes/$quoteId")({
  component: QuoteDetailPage,
});

function QuoteDetailPage() {
  const { quoteId } = Route.useParams();
  const navigate = useNavigate();
  const { workspaceId } = useActiveWorkspace();
  const { data: quote, isLoading } = useQuote(quoteId);
  const { data: lines } = useQuoteLineItems(quoteId);
  const { data: accounts } = useAccounts(workspaceId);
  const { data: projects } = useProjects(workspaceId);
  const updateQuote = useUpdateQuote(workspaceId);
  const convertToInvoice = useConvertQuoteToInvoice(workspaceId);

  const [projectId, setProjectId] = useState("none");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);

  useEffect(() => {
    if (!quote) return;
    setProjectId(quote.project_id ?? "none");
    setExpiryDate(quote.expiry_date ?? "");
    setNotes(quote.notes ?? "");
  }, [quote]);

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

  if (isLoading || !quote) {
    return (
      <div className="p-8">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const accountName = accounts?.find((a) => a.id === quote.account_id)?.name ?? "Unknown account";
  const accountProjects = (projects ?? []).filter(
    (project) => project.account_id === quote.account_id,
  );

  const handleSave = async () => {
    try {
      await updateQuote.mutateAsync({
        id: quoteId,
        projectId: projectId === "none" ? null : projectId,
        expiryDate: expiryDate || null,
        notes: notes || null,
        lineItems,
      });
      toast.success("Quote saved");
    } catch (error) {
      toast.error("Couldn't save the quote", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleConvert = async () => {
    try {
      const created = await convertToInvoice.mutateAsync({
        quoteId,
        accountId: quote.account_id,
        dealId: quote.deal_id,
      });
      toast.success(`Invoice ${created.invoice_number} created`);
      void navigate({ to: "/invoicing/$invoiceId", params: { invoiceId: created.id } });
    } catch (error) {
      toast.error("Couldn't convert to an invoice", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleDownload = () => {
    const projectName = accountProjects.find((project) => project.id === projectId)?.name ?? null;
    downloadDocumentPdf({
      kind: "Quote",
      number: quote.quote_number,
      issueDate: quote.issue_date,
      dueOrExpiryDate: quote.expiry_date,
      accountName,
      projectName,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      notes: quote.notes,
    });
  };

  return (
    <div className="space-y-6 p-8">
      <Link
        to="/quotes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Quotes
      </Link>

      <PageHeader
        title={quote.quote_number}
        description={`${accountName} · ${quote.status}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="size-4" aria-hidden="true" />
              PDF
            </Button>
            {quote.status === "accepted" && (
              <Button onClick={handleConvert} disabled={convertToInvoice.isPending}>
                {convertToInvoice.isPending ? "Converting…" : "Convert to invoice"}
              </Button>
            )}
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
            <Label>Expiry date</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
            />
          </div>
        </div>

        <LineItemsEditor items={lineItems} onChange={setLineItems} />

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateQuote.isPending}>
            {updateQuote.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
