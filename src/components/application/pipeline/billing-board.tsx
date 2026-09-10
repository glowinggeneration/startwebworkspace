import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, FileText, ReceiptText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, Panel } from "@/components/application/shell/page-parts";
import { ProgressMeter, StatusPill } from "@/components/application/shell/panel-parts";
import { RecordPaymentDialog } from "@/components/application/finance/record-payment-dialog";
import { SignInvoiceDialog } from "@/components/application/finance/sign-invoice-dialog";
import { NewQuoteDialog } from "@/components/application/finance/new-quote-dialog";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useUpdateQuoteStatus } from "@/hooks/use-quotes";
import { useConvertQuoteToInvoice, useUpdateInvoiceStatus } from "@/hooks/use-invoices";
import {
  BILLING_STAGES,
  billingStage,
  lineTotal,
  outstanding,
  paidTotal,
  type BillingFlow,
} from "@/hooks/use-billing-flow";
import { currency } from "@/lib/sales/currency";
import type { QuoteStatus } from "@/integrations/supabase/app-types";

const QUOTE_STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "declined", "expired"];

const QUOTE_TONE: Record<QuoteStatus, "neutral" | "info" | "positive" | "critical" | "attention"> =
  {
    draft: "neutral",
    sent: "info",
    accepted: "positive",
    declined: "critical",
    expired: "attention",
  };

/**
 * Quote to payment board. Each card follows one client document from quote,
 * to invoice, to the client's signature, to the last payment.
 */
export function BillingBoard({ flows }: { flows: BillingFlow[] }) {
  const stageTotals = (stage: (typeof BILLING_STAGES)[number]["value"]) =>
    flows
      .filter((flow) => billingStage(flow) === stage)
      .reduce(
        (sum, flow) =>
          sum +
          (flow.invoice
            ? lineTotal(flow.invoice.invoice_line_items)
            : lineTotal(flow.quote?.quote_line_items ?? [])),
        0,
      );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {BILLING_STAGES.map((stage) => {
        const columnFlows = flows.filter((flow) => billingStage(flow) === stage.value);
        return (
          <Panel key={stage.value} className="flex min-h-[32rem] flex-col">
            <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">{stage.label}</h2>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>
              <span className="text-right text-sm text-muted-foreground">
                {columnFlows.length}
                <span className="block text-xs">{currency.format(stageTotals(stage.value))}</span>
              </span>
            </div>
            <div className="max-h-[40rem] flex-1 space-y-3 overflow-y-auto p-4">
              {columnFlows.length === 0 ? (
                <EmptyState
                  icon={
                    stage.value === "quote"
                      ? FileText
                      : stage.value === "paid"
                        ? Wallet
                        : ReceiptText
                  }
                  title={stage.value === "quote" ? "No open quotes" : "Nothing here yet"}
                  description={
                    stage.value === "quote"
                      ? "Quotes wait here until the client accepts them."
                      : stage.value === "invoice"
                        ? "Accepted quotes become invoices here."
                        : stage.value === "signed"
                          ? "Signed invoices wait here for payment."
                          : "Fully paid invoices land here."
                  }
                  className="py-14"
                  action={
                    stage.value === "quote" ? (
                      <NewQuoteDialog trigger={<Button>New quote</Button>} />
                    ) : undefined
                  }
                />
              ) : (
                columnFlows.map((flow) => <BillingCard key={flow.id} flow={flow} />)
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function BillingCard({ flow }: { flow: BillingFlow }) {
  const { workspaceId } = useActiveWorkspace();
  const navigate = useNavigate();
  const updateQuoteStatus = useUpdateQuoteStatus(workspaceId);
  const updateInvoiceStatus = useUpdateInvoiceStatus(workspaceId);
  const convert = useConvertQuoteToInvoice(workspaceId);
  const stage = billingStage(flow);
  const { quote, invoice } = flow;

  const quoteTotal = lineTotal(quote?.quote_line_items ?? []);
  const invoiceTotal = invoice ? lineTotal(invoice.invoice_line_items) : 0;
  const paid = invoice ? paidTotal(invoice) : 0;
  const due = invoice ? outstanding(invoice) : 0;
  const paidPercent = invoiceTotal > 0 ? (paid / invoiceTotal) * 100 : 0;
  const overdue =
    invoice && due > 0 && invoice.due_date
      ? new Date(invoice.due_date) < new Date(new Date().toDateString())
      : false;

  async function handleQuoteStatus(status: QuoteStatus) {
    if (!quote) return;
    try {
      await updateQuoteStatus.mutateAsync({ id: quote.id, status });
      toast.success(`Quote ${quote.quote_number} marked ${status}`);
    } catch (error) {
      toast.error("Couldn't update the quote", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleConvert() {
    if (!quote) return;
    try {
      const created = await convert.mutateAsync({
        quoteId: quote.id,
        accountId: flow.accountId,
        dealId: quote.deal_id,
      });
      toast.success(`Invoice ${created.invoice_number} created from ${quote.quote_number}`);
    } catch (error) {
      toast.error("Couldn't create the invoice", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleMarkSent() {
    if (!invoice) return;
    try {
      await updateInvoiceStatus.mutateAsync({ id: invoice.id, status: "sent" });
      toast.success(`Invoice ${invoice.invoice_number} marked sent`);
    } catch (error) {
      toast.error("Couldn't update the invoice", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{flow.accountName}</h3>
        <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">
          {currency.format(invoice ? invoiceTotal : quoteTotal)}
        </span>
      </div>

      {/* Journey strip: quote, invoice, signed, paid */}
      <ol className="mt-3 flex flex-wrap items-center gap-y-1 text-[0.7rem] text-muted-foreground">
        {BILLING_STAGES.map((step, index) => {
          const reached =
            BILLING_STAGES.findIndex((s) => s.value === stage) >= index ||
            (step.value === "quote" && Boolean(quote));
          return (
            <li key={step.value} className="flex items-center gap-1">
              <span
                className={
                  reached
                    ? "rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary"
                    : "rounded-full px-2 py-0.5"
                }
                aria-current={step.value === stage ? "step" : undefined}
              >
                {step.label}
              </span>
              {index < BILLING_STAGES.length - 1 ? (
                <ArrowRight className="size-3" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Quote */}
      <div className="mt-3 space-y-2 border-t border-border pt-3">
        {quote ? (
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              <Link
                to="/quotes"
                className="whitespace-nowrap font-medium text-foreground underline-offset-2 hover:underline"
              >
                {quote.quote_number}
              </Link>
              <span>{quote.issue_date}</span>
            </p>
            {invoice ? (
              <StatusPill label={quote.status} tone={QUOTE_TONE[quote.status]} />
            ) : (
              <Select
                value={quote.status}
                onValueChange={(value) => handleQuoteStatus(value as QuoteStatus)}
                disabled={updateQuoteStatus.isPending}
              >
                <SelectTrigger className="h-8 w-32 text-xs" aria-label="Quote status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Invoiced directly, no quote</p>
        )}

        {stage === "quote" && quote ? (
          quote.status === "accepted" ? (
            <Button
              size="sm"
              className="w-full"
              onClick={handleConvert}
              disabled={convert.isPending}
            >
              <ReceiptText className="size-4" aria-hidden="true" />
              {convert.isPending ? "Creating invoice" : "Create invoice"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              {quote.status === "declined" || quote.status === "expired"
                ? "This quote is closed. Mark it accepted to invoice it."
                : "Mark the quote accepted to create the invoice."}
            </p>
          )
        ) : null}
      </div>

      {/* Invoice and signature */}
      {invoice ? (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ReceiptText className="size-3.5 shrink-0" aria-hidden="true" />
              <Link
                to="/invoicing"
                className="whitespace-nowrap font-medium text-foreground underline-offset-2 hover:underline"
              >
                {invoice.invoice_number}
              </Link>
              {invoice.due_date ? <span>due {invoice.due_date}</span> : null}
            </p>
            <StatusPill
              label={overdue ? "overdue" : invoice.status}
              tone={
                invoice.status === "void"
                  ? "neutral"
                  : overdue
                    ? "critical"
                    : invoice.status === "paid"
                      ? "positive"
                      : invoice.status === "draft"
                        ? "neutral"
                        : "info"
              }
            />
          </div>

          {invoice.signed_at ? (
            <p className="text-xs text-muted-foreground">
              Signed by <span className="font-medium text-foreground">{invoice.signed_by}</span> on{" "}
              {invoice.signed_at.slice(0, 10)}
              {invoice.signed_note ? ` · ${invoice.signed_note}` : ""}
            </p>
          ) : stage === "invoice" && invoice.status !== "void" ? (
            <div className="flex flex-wrap items-center gap-2">
              {invoice.status === "draft" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkSent}
                  disabled={updateInvoiceStatus.isPending}
                >
                  Mark sent
                </Button>
              ) : null}
              <SignInvoiceDialog
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoice_number}
                status={invoice.status}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Payments */}
      {invoice && invoice.status !== "void" && (stage === "signed" || stage === "paid") ? (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Paid {currency.format(paid)} of {currency.format(invoiceTotal)}
            </span>
            <span className={due > 0 ? "font-medium text-foreground" : "text-success"}>
              {due > 0 ? `${currency.format(due)} due` : "Settled"}
            </span>
          </div>
          <ProgressMeter
            value={paidPercent}
            label={`Paid share of invoice ${invoice.invoice_number}`}
            tone={overdue ? "critical" : "info"}
          />
          {invoice.payments.length > 0 ? (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {[...invoice.payments]
                .sort((a, b) => b.paid_at.localeCompare(a.paid_at))
                .slice(0, 3)
                .map((payment) => (
                  <li key={payment.id} className="flex justify-between gap-2">
                    <span>
                      {payment.paid_at}
                      {payment.method ? ` · ${payment.method}` : ""}
                    </span>
                    <span className="tabular-nums">{currency.format(payment.amount)}</span>
                  </li>
                ))}
              {invoice.payments.length > 3 ? (
                <li>+{invoice.payments.length - 3} more payments</li>
              ) : null}
            </ul>
          ) : null}
          {due > 0 ? <RecordPaymentDialog invoiceId={invoice.id} outstanding={due} /> : null}
        </div>
      ) : null}

      {invoice && invoice.status === "void" ? (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          This invoice was voided.{" "}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-2 hover:underline"
            onClick={() => void navigate({ to: "/invoicing" })}
          >
            Open invoicing
          </button>
        </p>
      ) : null}
    </article>
  );
}
