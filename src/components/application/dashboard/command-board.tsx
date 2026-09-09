import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Download,
  Filter,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useDeals } from "@/hooks/use-deals";
import { usePackages } from "@/hooks/use-packages";
import { useMonthlyTarget, useSetMonthlyTarget } from "@/hooks/use-monthly-target";
import { useMonthlyPlanLines } from "@/hooks/use-monthly-plan-lines";
import { useActivityRange, summarizeActivity } from "@/hooks/use-daily-activity";
import { currency } from "@/lib/sales/currency";
import { isSameMonth } from "@/lib/sales/month";
import {
  computeCoverage,
  computeFunnelExpectations,
  computeMixPlan,
  type FunnelStageCounts,
} from "@/lib/sales/funnel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoPopover } from "@/components/application/shell/info-popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DashboardPeriod = "day" | "week" | "month" | "year";

const FUNNEL_ROWS: { key: keyof FunnelStageCounts; label: string }[] = [
  { key: "touches", label: "Touches" },
  { key: "conversations", label: "Replies received" },
  { key: "meetingsBooked", label: "Meetings booked" },
  { key: "meetingsHeld", label: "Meetings held" },
  { key: "offersSent", label: "Written offers sent" },
  { key: "wins", label: "Deals won" },
];

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Date window and working-day weight for the selected period. */
function periodWindow(month: string, period: DashboardPeriod, monthWorkingDays: number) {
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year!, monthNum! - 1, 1));
  const monthEnd = new Date(Date.UTC(year!, monthNum!, 0));
  const today = new Date();
  const insideMonth = today >= monthStart && today <= monthEnd;
  const anchor = insideMonth ? today : monthEnd;

  if (period === "day") {
    return { from: iso(anchor), to: iso(anchor), workingDays: 1 };
  }
  if (period === "week") {
    const start = new Date(anchor);
    start.setUTCDate(start.getUTCDate() - 6);
    return { from: iso(start < monthStart ? monthStart : start), to: iso(anchor), workingDays: 5 };
  }
  if (period === "year") {
    return {
      from: iso(new Date(Date.UTC(year!, 0, 1))),
      to: iso(new Date(Date.UTC(year!, 11, 31))),
      workingDays: monthWorkingDays * 12,
    };
  }
  return { from: iso(monthStart), to: iso(monthEnd), workingDays: monthWorkingDays };
}

export function CommandBoard({
  month,
  period,
  periodLabel,
}: {
  month: string;
  period: DashboardPeriod;
  periodLabel: string;
}) {
  const { workspaceId } = useActiveWorkspace();
  const { data: target } = useMonthlyTarget(workspaceId, month);
  const { data: planLines } = useMonthlyPlanLines(workspaceId, month);
  const { data: packages } = usePackages(workspaceId);
  const { data: deals } = useDeals(workspaceId);

  const window = periodWindow(month, period, target?.working_days ?? 0);
  const { data: activityRows } = useActivityRange(workspaceId, window.from, window.to);

  const [query, setQuery] = useState("");
  const [behindOnly, setBehindOnly] = useState(false);

  const targetAmount = target?.target_amount ?? 0;

  const mixLines = (planLines ?? []).map((line) => {
    const pkg = packages?.find((p) => p.id === line.package_id);
    return {
      packageId: line.package_id,
      packageName: pkg?.name ?? "Unknown package",
      price: pkg?.price ?? 0,
      plannedUnits: line.planned_units,
    };
  });
  const mixPlan = computeMixPlan(mixLines, targetAmount);

  const openDeals = (deals ?? []).filter((d) => d.status === "open");
  const openPipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const coverage = computeCoverage(
    openPipelineValue,
    targetAmount,
    target?.coverage_multiplier ?? 3,
  );

  const wonDeals = (deals ?? []).filter(
    (d) => d.status === "won" && d.invoiced_at && isSameMonth(d.invoiced_at, month),
  );
  const wonThisMonth = wonDeals.reduce((sum, d) => sum + d.value, 0);

  const expected = computeFunnelExpectations({
    workingDays: window.workingDays,
    touchesPerWorkingDay: 20,
  });
  const actual = summarizeActivity(activityRows ?? []);

  const rows = useMemo(
    () =>
      FUNNEL_ROWS.map((row) => {
        const done = actual[row.key];
        const goal = expected[row.key];
        const progress = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
        return { ...row, done, goal, progress };
      })
        .filter((row) => row.label.toLowerCase().includes(query.trim().toLowerCase()))
        .filter((row) => (behindOnly ? row.progress < 100 : true)),
    [actual, expected, query, behindOnly],
  );

  const achieved = targetAmount > 0 ? Math.min(100, (wonThisMonth / targetAmount) * 100) : 0;
  const remaining = Math.max(0, targetAmount - wonThisMonth);
  const behindOutreach = expected.touches > 0 && actual.touches < expected.touches;

  function exportCsv() {
    const csv = [
      "Measure,Done,Target,Progress",
      ...rows.map((row) => `${row.label},${row.done},${row.goal},${row.progress}%`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `startweb-activity-${window.from}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly target" value={currency.format(targetAmount)}>
          <EditTargetDialog workspaceId={workspaceId} month={month} current={targetAmount} />
        </MetricCard>

        <MetricCard label="Planned mix" value={currency.format(mixPlan.plannedTotal)}>
          <Link
            to="/pipeline"
            className="type-label inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            View plan <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </MetricCard>

        <MetricCard label="Won this month" value={currency.format(wonThisMonth)}>
          <p className="type-meta text-muted-foreground">
            {wonDeals.length} {wonDeals.length === 1 ? "deal" : "deals"} won
          </p>
        </MetricCard>

        <MetricCard
          label="Target coverage"
          value={`${coverage.coverage.toFixed(2)}×`}
          info={
            <InfoPopover title="Target coverage">
              <p>Planned pipeline value for the month divided by the monthly revenue target.</p>
              <p>Anything under 1.00× means the plan does not yet cover the target.</p>
            </InfoPopover>
          }
        >
          {coverage.status === "on-track" ? (
            <span className="type-label inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5 text-success">
              On track
            </span>
          ) : (
            <span className="type-label inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-2.5 py-1.5 text-warning">
              <AlertTriangle className="size-4" aria-hidden="true" /> Below target
            </span>
          )}
        </MetricCard>
      </div>

      {behindOutreach && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-warning/40 bg-warning/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="type-label font-semibold">Outreach is behind plan.</p>
              <p className="type-body text-muted-foreground">
                Protect your 08:00 to 10:00 calling block.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/activity">Open activity</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="card-surface overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <h2 className="type-section">{periodLabel} activity</h2>
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search measures"
                  aria-label="Search measures"
                  className="h-9 w-40 pl-8"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <UtilityIconButton
                    label="Filter rows"
                    icon={<Filter className="size-4" aria-hidden="true" />}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={behindOnly}
                    onCheckedChange={(checked) => setBehindOnly(Boolean(checked))}
                  >
                    Behind target only
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <UtilityIconButton
                label="Export as CSV"
                icon={<Download className="size-4" aria-hidden="true" />}
                onClick={exportCsv}
              />
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="border-y border-divider bg-muted/50">
              <tr>
                <th className="type-meta px-6 py-3 font-medium text-muted-foreground">Measure</th>
                <th className="type-meta px-3 py-3 font-medium text-muted-foreground">Done</th>
                <th className="type-meta px-3 py-3 font-medium text-muted-foreground">Target</th>
                <th className="type-meta px-3 py-3 font-medium text-muted-foreground">Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-divider last:border-0">
                  <td className="type-body px-6 py-3.5">{row.label}</td>
                  <td className="type-body px-3 py-3.5 tabular-nums">{row.done}</td>
                  <td className="type-body px-3 py-3.5 tabular-nums">{row.goal}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={row.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${row.label} progress`}
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                      <span className="type-meta w-10 text-right tabular-nums text-muted-foreground">
                        {row.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="type-body px-6 py-6 text-center text-muted-foreground">
                    No measures match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {(activityRows?.length ?? 0) === 0 && (
            <p className="type-body flex items-center gap-2 px-6 py-5 text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden="true" />
              No activity recorded in this period.
            </p>
          )}
        </section>

        <div className="space-y-5">
          <section className="card-surface p-6">
            <div className="flex items-start justify-between">
              <h2 className="type-section">Revenue target</h2>
              <Button variant="ghost" size="icon" asChild aria-label="Open invoicing">
                <Link to="/invoicing">
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <p className="type-display mt-2">{currency.format(wonThisMonth)}</p>
            <p className="type-body text-muted-foreground">of {currency.format(targetAmount)}</p>

            <div
              className="mt-4 flex gap-[3px]"
              role="progressbar"
              aria-valuenow={Math.round(achieved)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Revenue achieved against target"
            >
              {Array.from({ length: 32 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-4 flex-1 rounded-[2px] ${
                    index < Math.round((achieved / 100) * 32) ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="type-meta mt-2 text-muted-foreground">{Math.round(achieved)}% achieved</p>

            <div className="mt-4 flex items-center justify-between border-t border-divider pt-4">
              <span className="type-body text-muted-foreground">Remaining</span>
              <span className="type-label font-semibold tabular-nums">
                {currency.format(remaining)}
              </span>
            </div>
          </section>

          <CallingBlockCard />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  info,
  children,
}: {
  label: string;
  value: string;
  info?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface flex flex-col gap-2 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="type-body text-muted-foreground">{label}</p>
        {info}
      </div>
      <p className="type-display tabular-nums">{value}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function EditTargetDialog({
  workspaceId,
  month,
  current,
}: {
  workspaceId: string;
  month: string;
  current: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(current));
  const setTarget = useSetMonthlyTarget(workspaceId, month);

  async function save() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await setTarget.mutateAsync(parsed);
      toast.success("Monthly target updated");
      setOpen(false);
    } catch (error) {
      toast.error("Couldn't update the target", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setAmount(String(current));
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Pencil className="size-4" aria-hidden="true" /> Edit target
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit monthly target</DialogTitle>
          <DialogDescription>The revenue you plan to invoice this month.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="target-amount">Target amount (ZAR)</Label>
          <Input
            id="target-amount"
            type="number"
            min={0}
            step={500}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={setTarget.isPending}>
            {setTarget.isPending ? "Saving..." : "Save target"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Calling block: the suggested outreach window, exported as a calendar invite. */
function CallingBlockCard() {
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("10:00");

  function schedule() {
    if (end <= start) {
      toast.error("End time must be after the start time");
      return;
    }
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const stamp = (time: string) => `${day}T${time.replace(":", "")}00`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Startweb//Calling block//EN",
      "BEGIN:VEVENT",
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      "SUMMARY:Calling block",
      "DESCRIPTION:Protected outreach time from Startweb.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "calling-block.ics";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Calling block ready to add to your calendar");
  }

  return (
    <section className="card-surface p-6">
      <h2 className="type-section">Calling block</h2>
      <div className="mt-4 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Phone className="size-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="type-body text-muted-foreground">Suggested time</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Input
                type="time"
                value={start}
                aria-label="Calling block start time"
                onChange={(event) => setStart(event.target.value)}
                className="h-10 w-full min-w-0"
              />
            </div>
            <span className="type-body text-muted-foreground">to</span>
            <div className="min-w-0 flex-1">
              <Input
                type="time"
                value={end}
                aria-label="Calling block end time"
                onChange={(event) => setEnd(event.target.value)}
                className="h-10 w-full min-w-0"
              />
            </div>
          </div>
        </div>
      </div>
      <Button variant="outline" className="mt-4 w-full gap-2" onClick={schedule}>
        <CalendarDays className="size-4" aria-hidden="true" /> Schedule block
      </Button>
    </section>
  );
}
