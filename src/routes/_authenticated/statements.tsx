import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Download, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterCombobox } from "@/components/application/shell/filter-combobox";
import { Label } from "@/components/ui/label";
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
import { EmptyState, PageHeader, Panel, Toolbar } from "@/components/application/shell/page-parts";

export const Route = createFileRoute("/_authenticated/statements")({
  component: StatementsPage,
  head: () => ({
    meta: [
      { title: "Statements | Startweb" },
      {
        name: "description",
        content: "Every invoice and payment for one client account, rolled up from live data.",
      },
      { property: "og:title", content: "Statements | Startweb" },
      { property: "og:description", content: "Client statements derived from live invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function StatementsPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: accounts } = useAccounts(workspaceId);
  const [accountId, setAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activity, setActivity] = useState<"all" | "outstanding" | "settled">("all");
  const { data: lines } = useStatement(workspaceId, accountId);

  const accountName = accounts?.find((a) => a.id === accountId)?.name ?? "";

  const filteredLines = useMemo(() => {
    return (lines ?? []).filter((line) => {
      if (fromDate && line.issueDate < fromDate) return false;
      if (toDate && line.issueDate > toDate) return false;
      if (activity === "outstanding" && line.balance <= 0) return false;
      if (activity === "settled" && line.balance > 0) return false;
      return true;
    });
  }, [lines, fromDate, toDate, activity]);

  const totals = filteredLines.reduce(
    (acc, line) => ({
      total: acc.total + line.total,
      paid: acc.paid + line.paid,
      balance: acc.balance + line.balance,
    }),
    { total: 0, paid: 0, balance: 0 },
  );

  function handleDownload() {
    if (filteredLines.length === 0 || !accountName) return;
    downloadStatementPdf({
      accountName,
      generatedOn: new Date().toISOString().slice(0, 10),
      lines: filteredLines.map((line) => ({
        invoiceNumber: line.invoiceNumber,
        issueDate: line.issueDate,
        total: line.total,
        paid: line.paid,
        balance: line.balance,
      })),
    });
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Statements"
        description="Every invoice and payment for one account, always derived from the live data."
        actions={
          <Button variant="outline" onClick={handleDownload} disabled={filteredLines.length === 0}>
            <Download className="size-4" aria-hidden="true" />
            Download PDF
          </Button>
        }
      />

      <Toolbar>
        <div className="min-w-56 flex-1 space-y-1.5">
          <Label>Account</Label>
          <FilterCombobox
            value={accountId}
            onValueChange={setAccountId}
            icon={Building2}
            ariaLabel="Statement account"
            placeholder="Pick an account"
            searchPlaceholder="Search accounts..."
            emptyLabel="No account found."
            className="w-full"
            options={(accounts ?? []).map((account) => ({
              value: account.id,
              label: account.name,
            }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="statement-from">From</Label>
          <Input
            id="statement-from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-11 w-44 bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="statement-to">To</Label>
          <Input
            id="statement-to"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-11 w-44 bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="statement-activity">Activity</Label>
          <Select value={activity} onValueChange={(value) => setActivity(value as typeof activity)}>
            <SelectTrigger id="statement-activity" className="h-11 w-48 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activity</SelectItem>
              <SelectItem value="outstanding">Outstanding only</SelectItem>
              <SelectItem value="settled">Settled only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Toolbar>

      {!accountId ? (
        <Panel>
          <EmptyState
            icon={ScrollText}
            title="Pick an account to build a statement"
            description="Choose a client above and their invoices and payments appear here."
          />
        </Panel>
      ) : filteredLines.length === 0 ? (
        <Panel>
          <EmptyState
            icon={ScrollText}
            title="Nothing to show for this selection"
            description="There are no invoices for this account in the chosen range."
          />
        </Panel>
      ) : (
        <Panel className="overflow-x-auto">
          <PanelHeader
            title="Statement lines"
            description="Invoices for the selected account and date range."
          />
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="p-3">
                  Invoice
                </th>
                <th scope="col" className="p-3">
                  Issued
                </th>
                <th scope="col" className="p-3">
                  Total
                </th>
                <th scope="col" className="p-3">
                  Paid
                </th>
                <th scope="col" className="p-3">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((line) => (
                <tr key={line.invoiceId} className="border-b border-border last:border-0">
                  <td className="p-3">{line.invoiceNumber}</td>
                  <td className="p-3">{line.issueDate}</td>
                  <td className="p-3">{currency.format(line.total)}</td>
                  <td className="p-3">{currency.format(line.paid)}</td>
                  <td className="p-3 font-medium">{currency.format(line.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-muted/40">
              <tr>
                <td className="p-3 font-medium" colSpan={2}>
                  Total
                </td>
                <td className="p-3 font-medium">{currency.format(totals.total)}</td>
                <td className="p-3 font-medium">{currency.format(totals.paid)}</td>
                <td className="p-3 font-medium">{currency.format(totals.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </Panel>
      )}

      <Panel className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-base font-semibold text-foreground">Statement options</p>
          <p className="text-sm text-muted-foreground">
            The PDF follows the account, date range and activity you selected above.
          </p>
        </div>
        <Button variant="outline" onClick={handleDownload} disabled={filteredLines.length === 0}>
          <Download className="size-4" aria-hidden="true" />
          Download PDF
        </Button>
      </Panel>
    </div>
  );
}
