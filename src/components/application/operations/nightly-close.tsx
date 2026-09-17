import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, MetricTile, Panel } from "@/components/application/shell/page-parts";
import {
  totalsFromEvents,
  useCloseDay,
  type ActivityEvent,
  type DayRow,
  type OpsAccount,
} from "@/hooks/use-operations";

/**
 * The nightly close: confirm the day's totals, store them as a permanent
 * row, and deal with the companies that were touched but have no next date.
 */
export function NightlyClose({
  workspaceId,
  date,
  events,
  accounts,
  dayRow,
  onGoToDay,
}: {
  workspaceId: string;
  date: string;
  events: ActivityEvent[];
  accounts: OpsAccount[];
  dayRow: DayRow | undefined;
  onGoToDay: () => void;
}) {
  const closeDay = useCloseDay(workspaceId);
  const totals = useMemo(
    () => totalsFromEvents(events.filter((event) => event.event_date === date)),
    [events, date],
  );
  const [theme, setTheme] = useState(dayRow?.theme ?? "");
  const [blockKept, setBlockKept] = useState(dayRow?.calling_block_kept ?? true);
  const [listFileName, setListFileName] = useState(dayRow?.list_file_name ?? "");
  const [notes, setNotes] = useState(dayRow?.notes_for_tomorrow ?? "");

  const touchedIds = new Set(
    events.filter((event) => event.event_date === date).map((event) => event.account_id),
  );
  const missingNextDate = accounts.filter(
    (account) => touchedIds.has(account.id) && !account.next_date,
  );

  async function submit() {
    try {
      await closeDay.mutateAsync({
        logDate: date,
        theme: theme || null,
        callingBlockKept: blockKept,
        totals,
        listFileName: listFileName || null,
        notesForTomorrow: notes || null,
      });
      toast.success("Day closed and stored");
    } catch (error) {
      toast.error("Couldn't close the day", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile label="Outreach" value={String(totals.outreach)} />
        <MetricTile label="Conversations" value={String(totals.conversations)} />
        <MetricTile label="Offers" value={String(totals.offers)} />
        <MetricTile label="Calling hours" value={totals.outreachHours.toFixed(1)} />
      </div>

      <Panel className="p-6">
        <h2 className="text-base font-semibold text-foreground">Close the day</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These totals come from what you logged today. Closing stores them as a permanent row for
          the week and month.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-muted-foreground" htmlFor="ops-theme">
              Focus for the day
            </label>
            <Input
              id="ops-theme"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              placeholder="Manufacturing list, East Rand"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground" htmlFor="ops-list-file">
              Calling list used
            </label>
            <Input
              id="ops-list-file"
              value={listFileName}
              onChange={(event) => setListFileName(event.target.value)}
              placeholder="September-manufacturing.xlsx"
            />
          </div>
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm text-foreground">
          <Checkbox
            checked={blockKept}
            onCheckedChange={(checked) => setBlockKept(checked === true)}
          />
          The 08:00 to 10:00 outreach block was kept
        </label>

        <div className="mt-5">
          <label className="text-sm text-muted-foreground" htmlFor="ops-notes">
            Note for tomorrow
          </label>
          <Textarea
            id="ops-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Start with the three companies that asked for a call back"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={submit} disabled={closeDay.isPending}>
            {dayRow?.closed_at ? "Update the closed day" : "Close the day"}
          </Button>
          {dayRow?.closed_at ? (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Closed {new Date(dayRow.closed_at).toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <AlertTriangle className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">
            Worked today with no next date
          </h2>
        </div>
        {missingNextDate.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Every company you touched has a next date"
            description="Nothing is left hanging from today."
          />
        ) : (
          <ul className="divide-y divide-border">
            {missingNextDate.map((account) => (
              <li key={account.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-sm font-medium text-foreground">{account.name}</span>
                <Button size="sm" variant="outline" onClick={onGoToDay}>
                  Set a next step
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
