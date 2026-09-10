import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Flag, Rocket, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/application/shell/page-parts";
import { ProgressMeter } from "@/components/application/shell/panel-parts";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/sales/currency";
import type { CampaignRow } from "@/hooks/use-campaigns";

interface CalendarEntry {
  id: string;
  kind: "start" | "end" | "action";
  date: string;
  title: string;
  campaign: CampaignRow;
}

const KIND_STYLE: Record<CalendarEntry["kind"], { label: string; chip: string; dot: string }> = {
  start: {
    label: "Campaign start",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  end: {
    label: "Campaign end",
    chip: "bg-amber-50 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  },
  action: {
    label: "Next action",
    chip: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
};

const KIND_ICON = { start: Rocket, end: Flag, action: Target } as const;

function buildEntries(campaigns: CampaignRow[]): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  for (const campaign of campaigns) {
    if (campaign.start_date) {
      entries.push({
        id: `${campaign.id}-start`,
        kind: "start",
        date: campaign.start_date,
        title: campaign.name,
        campaign,
      });
    }
    if (campaign.end_date) {
      entries.push({
        id: `${campaign.id}-end`,
        kind: "end",
        date: campaign.end_date,
        title: campaign.name,
        campaign,
      });
    }
    if (campaign.next_action && campaign.next_action_date) {
      entries.push({
        id: `${campaign.id}-action`,
        kind: "action",
        date: campaign.next_action_date,
        title: campaign.next_action,
        campaign,
      });
    }
  }
  return entries;
}

/** Month calendar of campaign start/end dates and next action dates, with budget against spend. */
export function CampaignCalendar({
  campaigns,
  accountName,
  memberName,
  onEdit,
}: {
  campaigns: CampaignRow[];
  accountName: (id: string | null) => string | null;
  memberName: (id: string | null) => string;
  onEdit: (campaign: CampaignRow) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const entries = useMemo(() => buildEntries(campaigns), [campaigns]);
  const undated = useMemo(
    () =>
      campaigns.filter(
        (campaign) => campaign.next_action && !campaign.next_action_date,
      ),
    [campaigns],
  );

  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const last = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const out: Date[] = [];
    for (let day = first; day <= last; day = new Date(day.getTime() + 86400000)) {
      out.push(day);
    }
    return out;
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [entries]);

  const dayEntries = (day: Date) => byDay.get(format(day, "yyyy-MM-dd")) ?? [];
  const selectedEntries = dayEntries(selected);

  if (entries.length === 0 && undated.length === 0) {
    return (
      <Panel>
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled yet"
          description="Add start dates, end dates or next action dates to your campaigns and they will appear here."
        />
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
      <Panel className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{format(month, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => setMonth((current) => addMonths(current, -1))}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date();
                setMonth(startOfMonth(now));
                setSelected(now);
              }}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => setMonth((current) => addMonths(current, 1))}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border text-xs font-medium text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
            <div key={label} className="px-2 py-2 text-center">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const items = dayEntries(day);
            const outside = !isSameMonth(day, month);
            const isSelected = isSameDay(day, selected);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelected(day)}
                aria-pressed={isSelected}
                aria-label={`${format(day, "d MMMM yyyy")}, ${items.length} item${items.length === 1 ? "" : "s"}`}
                className={cn(
                  "min-h-24 border-b border-r border-border/70 p-2 text-left align-top transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  outside ? "bg-muted/30 text-muted-foreground" : "hover:bg-muted/40",
                  isSelected && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    isToday(day) && "bg-primary text-primary-foreground",
                    isSelected && !isToday(day) && "bg-primary/15 text-primary",
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="mt-1 flex flex-col gap-1">
                  {items.slice(0, 3).map((entry) => (
                    <span
                      key={entry.id}
                      className={cn(
                        "truncate rounded-md border px-1.5 py-0.5 text-[0.6875rem] leading-4",
                        KIND_STYLE[entry.kind].chip,
                      )}
                      title={entry.title}
                    >
                      {entry.title}
                    </span>
                  ))}
                  {items.length > 3 ? (
                    <span className="text-[0.6875rem] text-muted-foreground">
                      +{items.length - 3} more
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 px-5 py-3 text-xs text-muted-foreground">
          {(Object.keys(KIND_STYLE) as CalendarEntry["kind"][]).map((kind) => (
            <span key={kind} className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", KIND_STYLE[kind].dot)} aria-hidden="true" />
              {KIND_STYLE[kind].label}
            </span>
          ))}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel className="p-5">
          <h2 className="text-base font-semibold text-foreground">
            {format(selected, "EEEE d MMMM")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedEntries.length === 0
              ? "Nothing scheduled on this day."
              : `${selectedEntries.length} item${selectedEntries.length === 1 ? "" : "s"} on this day.`}
          </p>
          <ul className="mt-4 space-y-3">
            {selectedEntries.map((entry) => {
              const Icon = KIND_ICON[entry.kind];
              const planned = Number(entry.campaign.planned_cost ?? 0);
              const spent = Number(entry.campaign.spent_cost ?? 0);
              const used = planned > 0 ? (spent / planned) * 100 : spent > 0 ? 100 : 0;
              return (
                <li key={entry.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{entry.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {KIND_STYLE[entry.kind].label} · {entry.campaign.name}
                        {accountName(entry.campaign.account_id)
                          ? ` · ${accountName(entry.campaign.account_id)}`
                          : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {memberName(entry.campaign.owner_id)} ·{" "}
                        {currency.format(spent)} of {currency.format(planned)} spent
                      </p>
                      <div className="mt-2">
                        <ProgressMeter
                          value={Math.min(used, 100)}
                          label={`Budget used on ${entry.campaign.name}`}
                          tone={spent > planned ? "critical" : "info"}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onEdit(entry.campaign)}
                        className="mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Open {entry.campaign.name}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        {undated.length > 0 ? (
          <Panel className="p-5">
            <h2 className="text-base font-semibold text-foreground">No date yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {undated.length} next action{undated.length === 1 ? "" : "s"} without a date.
            </p>
            <ul className="mt-4 space-y-3">
              {undated.slice(0, 8).map((campaign) => (
                <li key={campaign.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{campaign.next_action}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {campaign.name} · {memberName(campaign.owner_id)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onEdit(campaign)}
                    className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Set a date
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
