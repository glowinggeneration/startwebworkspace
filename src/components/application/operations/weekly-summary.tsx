import { useMemo } from "react";
import { CalendarX2 } from "lucide-react";
import { EmptyState, MetricTile, Panel } from "@/components/application/shell/page-parts";
import {
  totalsFromEvents,
  type ActivityEvent,
  type DayRow,
  type OpsAccount,
} from "@/hooks/use-operations";

/** The week read back from the stored daily rows, with the days nobody
 * closed shown as missing rather than filled in with a guess. */
export function WeeklySummary({
  weekDates,
  dayRows,
  events,
  accounts,
}: {
  weekDates: string[];
  dayRows: DayRow[];
  events: ActivityEvent[];
  accounts: OpsAccount[];
}) {
  const totals = useMemo(() => totalsFromEvents(events), [events]);

  const hunt = events.filter((event) => {
    const account = accounts.find((item) => item.id === event.account_id);
    return account?.world !== "existing";
  }).length;
  const live = events.length - hunt;

  const byList = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      const account = accounts.find((item) => item.id === event.account_id);
      const key = account?.source ?? "No list";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [events, accounts]);

  const stalled = accounts.filter(
    (account) => account.ops_status === "open" && !account.next_date,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile label="Outreach this week" value={String(totals.outreach)} />
        <MetricTile label="Conversations" value={String(totals.conversations)} />
        <MetricTile
          label="Meetings"
          value={`${totals.meetingsBooked} booked · ${totals.meetingsHeld} held`}
        />
        <MetricTile
          label="Hunt vs live"
          value={`${hunt} · ${live}`}
          hint="New companies against existing clients"
        />
      </div>

      <Panel>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">The week, day by day</h2>
        </div>
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-5">
          {weekDates.map((date) => {
            const row = dayRows.find((item) => item.log_date === date);
            return (
              <div key={date} className="bg-card p-4">
                <p className="text-xs text-muted-foreground">
                  {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                  })}
                </p>
                {row?.closed_at ? (
                  <>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                      {row.touches}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.conversations} spoke · {row.offers_sent} offers
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Day not closed</p>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Where the work came from</h2>
          </div>
          {byList.length === 0 ? (
            <EmptyState icon={CalendarX2} title="Nothing logged this week" />
          ) : (
            <ul className="divide-y divide-border">
              {byList.map(([list, count]) => (
                <li key={list} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-foreground">{list}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Open with no next date</h2>
          </div>
          {stalled.length === 0 ? (
            <EmptyState icon={CalendarX2} title="Nothing stalled" />
          ) : (
            <ul className="divide-y divide-border">
              {stalled.map((account) => (
                <li key={account.id} className="px-5 py-3 text-sm text-foreground">
                  {account.name}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
