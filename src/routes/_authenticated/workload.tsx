import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { useProjects } from "@/hooks/use-projects";
import { useResourceAllocationsRange } from "@/hooks/use-resource-allocations";
import { AvatarCircles } from "@/components/vendor/magicui/avatar-circles";
import { AvatarLabelGroup } from "@/components/application/shell/avatar-label-group";
import { AllocationDialog } from "@/components/application/workload/allocation-dialog";
import { currentWeekStart } from "@/lib/sales/week";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  MetricTile,
  PageHeader,
  Panel,
  SegmentedControl,
  Toolbar,
} from "@/components/application/shell/page-parts";
import { InfoPopover } from "@/components/application/shell/info-popover";

// A fixed weekly-capacity assumption, not yet a per-user setting — see
// docs/build-standards/EXCEPTION_REGISTER.md if this needs to vary by
// contract/part-time status before more than a couple of people use it.
const WEEKLY_CAPACITY_HOURS = 40;

export const Route = createFileRoute("/_authenticated/workload")({
  component: WorkloadPage,
  head: () => ({
    meta: [
      { title: "Workload | Startweb" },
      {
        name: "description",
        content: "See how the team's hours are allocated across projects each week.",
      },
      { property: "og:title", content: "Workload | Startweb" },
      { property: "og:description", content: "Team capacity and allocated hours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

function WorkloadPage() {
  const { workspaceId } = useActiveWorkspace();
  const [weekStart, setWeekStart] = useState(currentWeekStart());
  const [range, setRange] = useState<"week" | "month">("week");

  const rangeEnd = range === "week" ? weekStart : addDays(weekStart, 21);
  const weeksInRange = range === "week" ? 1 : 4;

  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: projects } = useProjects(workspaceId);
  const { data: allocations } = useResourceAllocationsRange(workspaceId, weekStart, rangeEnd);

  const capacityPerPerson = WEEKLY_CAPACITY_HOURS * weeksInRange;

  const totals = useMemo(() => {
    const allocated = (allocations ?? []).reduce((sum, a) => sum + a.allocated_hours, 0);
    const capacity = (members?.length ?? 0) * capacityPerPerson;
    return {
      capacity,
      allocated,
      available: Math.max(capacity - allocated, 0),
      utilisation: capacity > 0 ? Math.round((allocated / capacity) * 100) : 0,
    };
  }, [allocations, members, capacityPerPerson]);

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Workload"
        description="Hours allocated against the team's capacity."
        actions={<AllocationDialog weekStart={weekStart} />}
        aside={
          members && members.length > 0 ? (
            <div className="flex items-center gap-2">
              <AvatarCircles
                size="sm"
                avatars={members.slice(0, 5).map((member) => ({ name: member.name }))}
                numPeople={Math.max(members.length - 5, 0)}
              />
              <span className="text-sm text-muted-foreground">
                {members.length} {members.length === 1 ? "person" : "people"}
              </span>
            </div>
          ) : undefined
        }
      />

      <Toolbar>
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setWeekStart((week) => addDays(week, -7))}
            aria-label="Previous week"
            className="rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <span className="px-3 text-sm font-medium text-foreground">
            {range === "week"
              ? `Week of ${formatDay(weekStart)}`
              : `${formatDay(weekStart)} to ${formatDay(addDays(rangeEnd, 6))}`}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart((week) => addDays(week, 7))}
            aria-label="Next week"
            className="rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
        <Button variant="ghost" onClick={() => setWeekStart(currentWeekStart())}>
          This week
        </Button>
        <SegmentedControl
          ariaLabel="Workload range"
          value={range}
          onValueChange={setRange}
          options={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
          className="ml-auto"
        />
      </Toolbar>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Team capacity"
          value={`${totals.capacity}h`}
          info={
            <InfoPopover title="How capacity is worked out">
              <p>
                Each person counts as {WEEKLY_CAPACITY_HOURS} hours a week, multiplied by the number
                of people in the workspace and the period shown.
              </p>
              <p>Per person hours are not yet configurable.</p>
            </InfoPopover>
          }
        />
        <MetricTile label="Allocated" value={`${totals.allocated}h`} />
        <MetricTile
          label="Available"
          value={`${totals.available}h`}
          info={
            <InfoPopover title="Available hours">
              <p>Capacity less allocated hours. It never goes below zero.</p>
            </InfoPopover>
          }
        />
        <MetricTile label="Utilisation" value={`${totals.utilisation}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members?.map((member) => {
          const memberAllocations = (allocations ?? []).filter((a) => a.user_id === member.userId);
          const totalHours = memberAllocations.reduce((sum, a) => sum + a.allocated_hours, 0);
          const percent = Math.min(100, (totalHours / capacityPerPerson) * 100);
          const isOverCapacity = totalHours > capacityPerPerson;

          return (
            <Panel key={member.userId} className="p-5">
              <AvatarLabelGroup
                title={member.name}
                subtitle={member.email ?? undefined}
                status={isOverCapacity ? "bg-danger" : totalHours > 0 ? "bg-success" : "bg-muted"}
              />
              <div className="mt-4 flex items-baseline justify-between">
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    isOverCapacity ? "text-danger" : "text-muted-foreground",
                  )}
                >
                  {totalHours}h of {capacityPerPerson}h
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {Math.round(percent)}%
                </span>
              </div>

              <Progress
                value={percent}
                className={cn("mt-4", isOverCapacity && "[&>div]:bg-danger")}
              />
              <ul className="mt-3 space-y-1">
                {memberAllocations.length === 0 && (
                  <li className="text-sm text-muted-foreground">No allocations in this range.</li>
                )}
                {memberAllocations.map((allocation) => (
                  <li
                    key={allocation.id}
                    className="flex justify-between text-sm text-muted-foreground"
                  >
                    <span>
                      {projects?.find((p) => p.id === allocation.project_id)?.name ??
                        "Unknown project"}
                    </span>
                    <span>{allocation.allocated_hours}h</span>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
        {members && members.length === 0 && (
          <Panel className="col-span-full">
            <EmptyState
              icon={Users}
              title="No team members yet"
              description="Invite people to the workspace in Settings, then allocate their hours."
            />
          </Panel>
        )}
      </div>
    </div>
  );
}
