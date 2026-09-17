import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, MonitorCog, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useProductionProjects,
  useProjectBlockers,
  useQaSubmissions,
} from "@/hooks/use-technology";
import { stageLabel } from "@/lib/production-stages";
import { EmptyState, MetricTile, Panel } from "@/components/application/shell/page-parts";
import { Button } from "@/components/ui/button";

/** Every open task in the workspace, with the project it belongs to. RLS already
 * narrows this to what the signed in person is allowed to see. */
function useWorkspaceTasks(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-tasks", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, due_date, project_id, projects(name)")
        .eq("workspace_id", workspaceId)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}

function useMyTaskIds(workspaceId: string) {
  return useQuery({
    queryKey: ["my-task-ids", workspaceId],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [] as string[];
      const { data, error } = await supabase
        .from("task_assignees")
        .select("task_id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", auth.user.id);
      if (error) throw error;
      return data.map((row) => row.task_id);
    },
  });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Ndumiso: what is in production, what needs QA, what is blocked. */
export function TechnologyDashboard({ workspaceId }: { workspaceId: string }) {
  const { data: projects = [] } = useProductionProjects(workspaceId);
  const { data: qa = [] } = useQaSubmissions(workspaceId);
  const { data: blockers = [] } = useProjectBlockers(workspaceId);

  const byStage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      const key = project.production_stage ?? "brief_received";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [projects]);

  const waitingQa = qa.filter((row) => row.status === "submitted");
  const openBlockers = blockers.filter((row) => row.status === "open");
  const launched = projects.filter((p) =>
    ["launched", "post_launch_support", "complete"].includes(p.production_stage ?? ""),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Sites in production" value={String(projects.length - launched.length)} />
        <MetricTile label="Launched or live" value={String(launched.length)} />
        <MetricTile label="Waiting on QA" value={String(waitingQa.length)} />
        <MetricTile label="Open blockers" value={String(openBlockers.length)} />
      </div>

      <Panel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.9375rem] font-semibold text-foreground">Websites by stage</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/technology">Open Technology</Link>
          </Button>
        </div>
        {byStage.length === 0 ? (
          <EmptyState
            icon={MonitorCog}
            title="No website projects yet"
            description="Projects appear here with their production stage as soon as they exist."
          />
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {byStage.map(([stage, count]) => (
              <li key={stage} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{stageLabel(stage)}</span>
                <span className="tabular-nums text-muted-foreground">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="p-6">
        <p className="text-[0.9375rem] font-semibold text-foreground">Blocked right now</p>
        {openBlockers.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing is blocked" />
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {openBlockers.map((row) => (
              <li key={row.id} className="py-2.5 text-sm">
                <span className="text-foreground">{row.description}</span>
                <span className="ml-2 text-xs text-muted-foreground">{row.kind}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/** Ntokozo: delivery load, deadlines and work without an owner. */
export function DeliveryDashboard({ workspaceId }: { workspaceId: string }) {
  const { data: projects = [] } = useProductionProjects(workspaceId);
  const { data: tasks = [] } = useWorkspaceTasks(workspaceId);

  const today = todayKey();
  const weekEnd = inDays(7);
  const openTasks = tasks.filter((task) => task.status !== "done");
  const overdue = openTasks.filter((task) => task.due_date && task.due_date < today);
  const dueThisWeek = openTasks.filter(
    (task) => task.due_date && task.due_date >= today && task.due_date <= weekEnd,
  );
  const unassignedProjects = projects.filter((project) => !project.owner_id);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Active projects" value={String(projects.length)} />
        <MetricTile label="Open tasks" value={String(openTasks.length)} />
        <MetricTile label="Overdue" value={String(overdue.length)} />
        <MetricTile label="Projects without an owner" value={String(unassignedProjects.length)} />
      </div>

      <Panel className="p-6">
        <p className="text-[0.9375rem] font-semibold text-foreground">Due in the next seven days</p>
        {dueThisWeek.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing due this week" />
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {dueThisWeek.map((task) => (
              <li key={task.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{task.title}</span>
                <span className="text-xs text-muted-foreground">{task.due_date}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="p-6">
        <p className="text-[0.9375rem] font-semibold text-foreground">Overdue work</p>
        {overdue.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing is overdue" />
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {overdue.map((task) => (
              <li key={task.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{task.title}</span>
                <span className="text-xs text-destructive">{task.due_date}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/** A website builder only ever sees the work assigned to them. */
export function MyWorkDashboard({ workspaceId }: { workspaceId: string }) {
  const { data: tasks = [] } = useWorkspaceTasks(workspaceId);
  const { data: myTaskIds = [] } = useMyTaskIds(workspaceId);

  const mine = tasks.filter((task) => myTaskIds.includes(task.id) && task.status !== "done");
  const today = todayKey();
  const overdue = mine.filter((task) => task.due_date && task.due_date < today);
  const dueToday = mine.filter((task) => task.due_date === today);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="My open tasks" value={String(mine.length)} />
        <MetricTile label="Due today" value={String(dueToday.length)} />
        <MetricTile label="Overdue" value={String(overdue.length)} />
      </div>

      <Panel className="p-6">
        <p className="text-[0.9375rem] font-semibold text-foreground">My work</p>
        {mine.length === 0 ? (
          <EmptyState
            icon={TriangleAlert}
            title="Nothing assigned to you yet"
            description="Tasks assigned to you appear here with their due dates."
          />
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {mine.map((task) => (
              <li key={task.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{task.title}</span>
                <span className="text-xs text-muted-foreground">{task.due_date ?? "No date"}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
