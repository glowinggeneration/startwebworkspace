import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { PageHeader, Toolbar, UnderlineTabs } from "@/components/application/shell/page-parts";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useIndustries } from "@/hooks/use-industries";
import {
  useActivityEvents,
  useDayRows,
  useOpsAccounts,
} from "@/hooks/use-operations";
import { DayView } from "@/components/application/operations/day-view";
import { NightlyClose } from "@/components/application/operations/nightly-close";
import { WeeklySummary } from "@/components/application/operations/weekly-summary";
import { MonthlyPack } from "@/components/application/operations/monthly-pack";
import { CallingListImport } from "@/components/application/operations/calling-list-import";

export const Route = createFileRoute("/_authenticated/operations")({
  component: OperationsPage,
  head: () => ({
    meta: [
      { title: "Operations | Startweb" },
      {
        name: "description",
        content: "Run the working day: today's list, the nightly close, the week and the month.",
      },
      { property: "og:title", content: "Operations | Startweb" },
      {
        property: "og:description",
        content: "Today's list, the nightly close, the week and the month pack.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function mondayOf(date: string): string {
  const day = new Date(`${date}T00:00:00`);
  const diff = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - diff);
  return day.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const day = new Date(`${date}T00:00:00`);
  day.setDate(day.getDate() + days);
  return day.toISOString().slice(0, 10);
}

function OperationsPage() {
  const { workspaceId } = useActiveWorkspace();
  const [tab, setTab] = useState<"today" | "close" | "week" | "month" | "import">("today");
  const [date, setDate] = useState(isoToday());

  const weekStart = mondayOf(date);
  const weekDates = useMemo(
    () => Array.from({ length: 5 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const monthStart = `${date.slice(0, 7)}-01`;
  const monthEnd = lastDayOfMonth(monthStart);

  const { data: accounts } = useOpsAccounts(workspaceId);
  const { data: industries } = useIndustries(workspaceId);
  const { data: dayEvents } = useActivityEvents(workspaceId, date, date);
  const { data: weekEvents } = useActivityEvents(workspaceId, weekStart, addDays(weekStart, 6));
  const { data: monthEvents } = useActivityEvents(workspaceId, monthStart, monthEnd);
  const { data: weekRows } = useDayRows(workspaceId, weekStart, addDays(weekStart, 6));
  const { data: monthRows } = useDayRows(workspaceId, monthStart, monthEnd);

  const dayRow = (weekRows ?? []).find((row) => row.log_date === date);
  const industryName = (id: string | null) =>
    (industries ?? []).find((industry) => industry.id === id)?.name ?? "No industry";

  const monthLabel = new Date(`${monthStart}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Operations"
        description="Today's working list, the nightly close, and what the week and month add up to."
      />

      <Toolbar>
        <UnderlineTabs
          ariaLabel="Operations view"
          value={tab}
          onValueChange={setTab}
          options={[
            { value: "today", label: "Today" },
            { value: "close", label: "Nightly close" },
            { value: "week", label: "This week" },
            { value: "month", label: "Month pack" },
            { value: "import", label: "Import a list" },
          ]}
        />
        {tab === "import" ? null : (
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value || isoToday())}
            aria-label="Day"
            className="h-11 w-44 bg-card"
          />
        )}
      </Toolbar>

      {tab === "today" ? (
        <DayView
          workspaceId={workspaceId}
          date={date}
          accounts={accounts ?? []}
          events={dayEvents ?? []}
        />
      ) : tab === "close" ? (
        <NightlyClose
          workspaceId={workspaceId}
          date={date}
          events={dayEvents ?? []}
          accounts={accounts ?? []}
          dayRow={dayRow}
          onGoToDay={() => setTab("today")}
        />
      ) : tab === "week" ? (
        <WeeklySummary
          weekDates={weekDates}
          dayRows={weekRows ?? []}
          events={weekEvents ?? []}
          accounts={accounts ?? []}
        />
      ) : tab === "month" ? (
        <MonthlyPack
          monthLabel={monthLabel}
          dayRows={monthRows ?? []}
          events={monthEvents ?? []}
          accounts={accounts ?? []}
          industryName={industryName}
        />
      ) : (
        <CallingListImport workspaceId={workspaceId} accounts={accounts ?? []} />
      )}
    </div>
  );
}
