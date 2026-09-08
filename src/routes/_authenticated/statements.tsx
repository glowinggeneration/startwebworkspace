import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { useStatement } from "@/hooks/use-statement";
import { downloadStatementPdf } from "@/lib/pdf/document-pdf";
import { currency } from "@/lib/sales/currency";

export const Route = createFileRoute("/_authenticated/statements")({
  component: StatementsPage,
});

function StatementsPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: accounts } = useAccounts(workspaceId);
  const [accountId, setAccountId] = useState("");
  const { data: lines } = useStatement(workspaceId, accountId);

  const accountName = accounts?.find((a) => a.id === accountId)?.name ?? "";
  const totals = (lines ?? []).reduce(
    (acc, line) => ({
      total: acc.total + line.total,
      paid: acc.paid + line.paid,
      balance: acc.balance + line.balance,
    }),
    { total: 0, paid: 0, balance: 0 },
  );

  function handleDownload() {
    if (!lines || !accountName) return;
    downloadStatementPdf({
      accountName,
      generatedOn: new Date().toISOString().slice(0, 10),
      lines: lines.map((line) => ({
        invoiceNumber: line.invoiceNumber,
        issueDate: line.issueDate,
        total: line.total,
        paid: line.paid,
        balance: line.balance,
      })),
    });
  }

  return (
    <div className="section-stack p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-display">Statements</h1>
          <p className="type-body text-muted-foreground">
            Every invoice and payment for one account, rolled up — always derived from the live
            data, never a separate record to keep in sync.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Pick an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts?.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!accountId || (lines?.length ?? 0) === 0}
          >
            <Download className="size-4" aria-hidden="true" />
            PDF
          </Button>
        </div>
      </div>

      {!accountId && (
        <p className="type-body rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Pick an account to see its statement.
        </p>
      )}

      {accountId && lines && lines.length === 0 && (
        <p className="type-body rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No invoices for this account yet.
        </p>
      )}

      {accountId && lines && lines.length > 0 && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="p-3 type-meta font-medium text-muted-foreground">Invoice</th>
                <th className="p-3 type-meta font-medium text-muted-foreground">Issued</th>
                <th className="p-3 type-meta font-medium text-muted-foreground">Total</th>
                <th className="p-3 type-meta font-medium text-muted-foreground">Paid</th>
                <th className="p-3 type-meta font-medium text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.invoiceId} className="border-b border-border last:border-0">
                  <td className="p-3 type-body">{line.invoiceNumber}</td>
                  <td className="p-3 type-body">{line.issueDate}</td>
                  <td className="p-3 type-body">{currency.format(line.total)}</td>
                  <td className="p-3 type-body">{currency.format(line.paid)}</td>
                  <td className="p-3 type-body font-medium">{currency.format(line.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-muted/40">
              <tr>
                <td className="p-3 type-body font-medium" colSpan={2}>
                  Total
                </td>
                <td className="p-3 type-body font-medium">{currency.format(totals.total)}</td>
                <td className="p-3 type-body font-medium">{currency.format(totals.paid)}</td>
                <td className="p-3 type-body font-medium">{currency.format(totals.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
