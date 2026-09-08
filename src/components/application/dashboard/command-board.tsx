import { AlertTriangle } from "lucide-react";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useDeals } from "@/hooks/use-deals";
import { useIndustries } from "@/hooks/use-industries";
import { usePackages } from "@/hooks/use-packages";
import { useMonthlyTarget } from "@/hooks/use-monthly-target";
import { useMonthlyPlanLines } from "@/hooks/use-monthly-plan-lines";
import { useMonthlyActivity, summarizeActivity } from "@/hooks/use-daily-activity";
import { currentMonthKey, isSameMonth } from "@/lib/sales/month";
import {
  computeCoverage,
  computeFunnelExpectations,
  computeMixPlan,
  diagnosePace,
  type FunnelStageCounts,
} from "@/lib/sales/funnel";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

const FUNNEL_ROWS: { key: keyof FunnelStageCounts; label: string }[] = [
  { key: "touches", label: "Touches" },
  { key: "conversations", label: "People who spoke back" },
  { key: "meetingsBooked", label: "Meetings booked" },
  { key: "meetingsHeld", label: "Meetings held" },
  { key: "offersSent", label: "Written offers sent" },
  { key: "wins", label: "Deals won (count)" },
];

export function CommandBoard() {
  const { workspaceId } = useActiveWorkspace();
  const month = currentMonthKey();
  const { data: target } = useMonthlyTarget(workspaceId, month);
  const { data: planLines } = useMonthlyPlanLines(workspaceId, month);
  const { data: packages } = usePackages(workspaceId);
  const { data: industries } = useIndustries(workspaceId);
  const { data: deals } = useDeals(workspaceId);
  const { data: activityRows } = useMonthlyActivity(workspaceId, month);

  if (!target) {
    return (
      <div className="card-surface p-6 text-center">
        <p className="type-body text-muted-foreground">
          No target is set for this month yet. Add a row to <code>monthly_targets</code> to see the
          Command Board.
        </p>
      </div>
    );
  }

  const mixLines = (planLines ?? []).map((line) => {
    const pkg = packages?.find((p) => p.id === line.package_id);
    return {
      packageId: line.package_id,
      packageName: pkg?.name ?? "Unknown package",
      price: pkg?.price ?? 0,
      plannedUnits: line.planned_units,
    };
  });
  const mixPlan = computeMixPlan(mixLines, target.target_amount);

  const openDeals = (deals ?? []).filter((d) => d.status === "open");
  const openPipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const coverage = computeCoverage(
    openPipelineValue,
    target.target_amount,
    target.coverage_multiplier,
  );

  const wonThisMonth = (deals ?? [])
    .filter((d) => d.status === "won" && d.invoiced_at && isSameMonth(d.invoiced_at, month))
    .reduce((sum, d) => sum + d.value, 0);

  const expected = computeFunnelExpectations({
    workingDays: target.working_days ?? 0,
    touchesPerWorkingDay: 20,
  });
  const actual = summarizeActivity(activityRows ?? []);
  const diagnostic = diagnosePace(actual, expected);

  const byIndustry = groupSum(openDeals, (d) => d.industry_id, industries, "name");
  const byPackage = groupSum(openDeals, (d) => d.package_id, packages, "name");

  return (
    <div className="section-stack">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Monthly target" value={currency.format(target.target_amount)} />
        <KpiTile label="Planned mix" value={currency.format(mixPlan.plannedTotal)} />
        <KpiTile label="Won this month" value={currency.format(wonThisMonth)} />
        <KpiTile
          label="Coverage of target"
          value={`${coverage.coverage.toFixed(2)}×`}
          tone={
            coverage.status === "at-risk"
              ? "danger"
              : coverage.status === "watch"
                ? "warning"
                : "success"
          }
        />
      </div>

      {diagnostic && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="type-body">{diagnostic}</p>
        </div>
      )}

      <div className="card-surface overflow-hidden">
        <table className="w-full text-left">
          <caption className="type-section p-4 text-left">This month against the plan</caption>
          <thead className="border-y border-border bg-muted/40">
            <tr>
              <th className="p-3 type-meta font-medium text-muted-foreground">Measure</th>
              <th className="p-3 type-meta font-medium text-muted-foreground">Done</th>
              <th className="p-3 type-meta font-medium text-muted-foreground">Needed this month</th>
            </tr>
          </thead>
          <tbody>
            {FUNNEL_ROWS.map((row) => (
              <tr key={row.key} className="border-b border-border last:border-0">
                <td className="p-3 type-body">{row.label}</td>
                <td className="p-3 type-body font-medium">{actual[row.key]}</td>
                <td className="p-3 type-body text-muted-foreground">{expected[row.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownTable title="Open work by industry" rows={byIndustry} />
        <BreakdownTable title="Open work by package" rows={byPackage} />
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-danger"
          : "text-foreground";
  return (
    <div className="card-surface p-5">
      <p className="type-meta text-muted-foreground">{label}</p>
      <p className={`type-display mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

function groupSum<T extends { value: number }>(
  deals: T[],
  keyOf: (d: T) => string | null,
  lookup: { id: string; name: string }[] | undefined,
  _nameField: "name",
): { label: string; value: number; count: number }[] {
  const totals = new Map<string, { value: number; count: number }>();
  for (const deal of deals) {
    const key = keyOf(deal) ?? "unassigned";
    const existing = totals.get(key) ?? { value: 0, count: 0 };
    totals.set(key, { value: existing.value + deal.value, count: existing.count + 1 });
  }
  return Array.from(totals.entries()).map(([key, totalsForKey]) => ({
    label: lookup?.find((item) => item.id === key)?.name ?? "Unassigned",
    ...totalsForKey,
  }));
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; count: number }[];
}) {
  return (
    <div className="card-surface overflow-hidden">
      <table className="w-full text-left">
        <caption className="type-section p-4 text-left">{title}</caption>
        <thead className="border-y border-border bg-muted/40">
          <tr>
            <th className="p-3 type-meta font-medium text-muted-foreground">Name</th>
            <th className="p-3 type-meta font-medium text-muted-foreground">Open value</th>
            <th className="p-3 type-meta font-medium text-muted-foreground">Deals</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="p-3 type-body text-center text-muted-foreground">
                No open deals yet.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border last:border-0">
              <td className="p-3 type-body">{row.label}</td>
              <td className="p-3 type-body">{currency.format(row.value)}</td>
              <td className="p-3 type-body">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
