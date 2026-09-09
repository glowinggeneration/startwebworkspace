import { createFileRoute } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { useProjects } from "@/hooks/use-projects";
import { useResourceAllocations } from "@/hooks/use-resource-allocations";
import { AllocationDialog } from "@/components/application/workload/allocation-dialog";
import { currentWeekStart } from "@/lib/sales/week";
import { cn } from "@/lib/utils";

// A fixed weekly-capacity assumption, not yet a per-user setting — see
// docs/build-standards/EXCEPTION_REGISTER.md if this needs to vary by
// contract/part-time status before more than a couple of people use it.
const WEEKLY_CAPACITY_HOURS = 40;

export const Route = createFileRoute("/_authenticated/workload")({
  component: WorkloadPage,
});

function WorkloadPage() {
  const { workspaceId } = useActiveWorkspace();
  const weekStart = currentWeekStart();
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: projects } = useProjects(workspaceId);
  const { data: allocations } = useResourceAllocations(workspaceId, weekStart);

  return (
    <div className="section-stack p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-display">Workload</h1>
          <p className="type-body text-muted-foreground">Week of {weekStart}</p>
        </div>
        <AllocationDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members?.map((member) => {
          const memberAllocations = (allocations ?? []).filter((a) => a.user_id === member.userId);
          const totalHours = memberAllocations.reduce((sum, a) => sum + a.allocated_hours, 0);
          const percent = Math.min(100, (totalHours / WEEKLY_CAPACITY_HOURS) * 100);
          const isOverCapacity = totalHours > WEEKLY_CAPACITY_HOURS;

          return (
            <div key={member.userId} className="card-surface p-5">
              <div className="flex items-baseline justify-between">
                <p className="type-card">{member.name}</p>
                <p
                  className={cn(
                    "type-meta",
                    isOverCapacity ? "text-danger" : "text-muted-foreground",
                  )}
                >
                  {totalHours}h / {WEEKLY_CAPACITY_HOURS}h
                </p>
              </div>
              <Progress
                value={percent}
                className={cn("mt-2", isOverCapacity && "[&>div]:bg-danger")}
              />
              <ul className="mt-3 space-y-1">
                {memberAllocations.length === 0 && (
                  <li className="type-meta text-muted-foreground">No allocations this week.</li>
                )}
                {memberAllocations.map((allocation) => (
                  <li
                    key={allocation.id}
                    className="type-meta flex justify-between text-muted-foreground"
                  >
                    <span>
                      {projects?.find((p) => p.id === allocation.project_id)?.name ??
                        "Unknown project"}
                    </span>
                    <span>{allocation.allocated_hours}h</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {members && members.length === 0 && (
          <p className="type-body col-span-full rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            No workspace members yet.
          </p>
        )}
      </div>
    </div>
  );
}
