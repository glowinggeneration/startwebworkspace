import { useMemo } from "react";
import { Download, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, MetricTile, Panel } from "@/components/application/shell/page-parts";
import {
  totalsFromEvents,
  type ActivityEvent,
  type DayRow,
  type OpsAccount,
} from "@/hooks/use-operations";

/** The month pack the team reads: totals, the daily strip, movement by
 * company, yield by list, and the work left unresolved. */
export function MonthlyPack({
  monthLabel,
  dayRows,
  events,
  accounts,
  industryName,
}: {
  monthLabel: string;
  dayRows: DayRow[];
  events: ActivityEvent[];
  accounts: OpsAccount[];
  industryName: (id: string | null) => string;
}) {
  const totals = useMemo(() => totalsFromEvents(events), [events]);

  const byIndustry = useMemo(() => {
    const map = new Map<string, { touches: number; conversations: number }>();
    for (const event of events) {
      const account = accounts.find((item) => item.id === event.account_id);
      const key = industryName(account?.industry_id ?? null);
      const entry = map.get(key) ?? { touches: 0, conversations: 0 };
      entry.touches += 1;
      if (event.outcome === "spoke" || event.event_type === "conversation") {
        entry.conversations += 1;
      }
      map.set(key, entry);
    }
    return [...map.entries()].sort((a, b) => b[1].touches - a[1].touches);
  }, [events, accounts, industryName]);

  const liveTouched = new Set(
    events
      .filter((event) => accounts.find((item) => item.id === event.account_id)?.world === "existing")
      .map((event) => event.account_id),
  ).size;

  const unresolved = accounts.filter(
    (account) => account.ops_status === "open" && !account.next_date,
  );

  function download() {
    const lines = [
      `Operations pack,${monthLabel}`,
      "",
      "Totals",
      `Outreach,${totals.outreach}`,
      `Conversations,${totals.conversations}`,
      `Meetings booked,${totals.meetingsBooked}`,
      `Meetings held,${totals.meetingsHeld}`,
      `Written offers,${totals.offers}`,
      `Content,${totals.content}`,
      `Account follow-ups,${totals.followUps}`,
      `Research hours,${totals.researchHours.toFixed(1)}`,
      "",
      "Day,Outreach,Conversations,Offers,Closed",
      ...dayRows.map(
        (row) =>
          `${row.log_date},${row.touches},${row.conversations},${row.offers_sent},${row.closed_at ? "yes" : "no"}`,
      ),
      "",
      "Industry,Touches,Conversations",
      ...byIndustry.map(([name, value]) => `${name},${value.touches},${value.conversations}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `operations-${monthLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{monthLabel}</h2>
        <Button variant="outline" onClick={download}>
          <Download className="size-4" aria-hidden="true" /> Download pack
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile label="Outreach" value={String(totals.outreach)} />
        <MetricTile label="Conversations" value={String(totals.conversations)} />
        <MetricTile label="Written offers" value={String(totals.offers)} />
        <MetricTile
          label="Live accounts touched"
          value={String(liveTouched)}
          hint="Existing clients worked this month"
        />
      </div>

      <Panel>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Yield by industry</h2>
        </div>
        {byIndustry.length === 0 ? (
          <EmptyState icon={FileBarChart} title="Nothing logged this month" />
        ) : (
          <ul className="divide-y divide-border">
            {byIndustry.map(([name, value]) => (
              <li key={name} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-foreground">{name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {value.touches} touches · {value.conversations} spoke
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Unresolved</h2>
        </div>
        {unresolved.length === 0 ? (
          <EmptyState icon={FileBarChart} title="Nothing left open without a date" />
        ) : (
          <ul className="divide-y divide-border">
            {unresolved.map((account) => (
              <li key={account.id} className="px-5 py-3 text-sm text-foreground">
                {account.name}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
