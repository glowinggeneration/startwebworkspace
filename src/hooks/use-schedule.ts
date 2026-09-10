import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScheduleTask {
  id: string;
  title: string;
  status: string;
  status_label: string | null;
  due_date: string | null;
  phase_id: string;
}

export interface SchedulePhase {
  id: string;
  name: string;
  status: string;
  sort_order: number;
}

export interface ScheduleProject {
  id: string;
  name: string;
  status: string;
  status_label: string | null;
  start_date: string | null;
  due_date: string | null;
  accounts: { id: string; name: string } | null;
  project_phases: SchedulePhase[];
  tasks: ScheduleTask[];
}

/**
 * Projects with their phases and tasks, used by the pipeline calendar to place
 * start dates, delivery dates and task deadlines on a month grid.
 */
export function useSchedule(workspaceId: string) {
  return useQuery({
    queryKey: ["schedule", workspaceId],
    enabled: workspaceId !== "",
    queryFn: async (): Promise<ScheduleProject[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, name, status, status_label, start_date, due_date, accounts(id, name), project_phases(id, name, status, sort_order), tasks(id, title, status, status_label, due_date, phase_id)",
        )
        .eq("workspace_id", workspaceId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as ScheduleProject[];
    },
  });
}

export type ScheduleEntryKind = "start" | "due" | "task";

export interface ScheduleEntry {
  id: string;
  kind: ScheduleEntryKind;
  date: string;
  title: string;
  projectId: string;
  projectName: string;
  accountName: string;
  phaseName: string | null;
  status: string;
  done: boolean;
}

const DONE_TASK_STATUSES = new Set(["done", "complete", "completed"]);

/** Flattens projects into dated calendar entries, sorted by date. */
export function scheduleEntries(projects: ScheduleProject[]): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];

  for (const project of projects) {
    const accountName = project.accounts?.name ?? "No client";
    const phaseName = (phaseId: string) =>
      project.project_phases.find((phase) => phase.id === phaseId)?.name ?? null;

    if (project.start_date) {
      entries.push({
        id: `${project.id}-start`,
        kind: "start",
        date: project.start_date,
        title: `${project.name} starts`,
        projectId: project.id,
        projectName: project.name,
        accountName,
        phaseName: null,
        status: project.status_label ?? project.status,
        done: project.status === "complete",
      });
    }

    if (project.due_date) {
      entries.push({
        id: `${project.id}-due`,
        kind: "due",
        date: project.due_date,
        title: `${project.name} due`,
        projectId: project.id,
        projectName: project.name,
        accountName,
        phaseName: null,
        status: project.status_label ?? project.status,
        done: project.status === "complete",
      });
    }

    for (const task of project.tasks) {
      if (!task.due_date) continue;
      entries.push({
        id: task.id,
        kind: "task",
        date: task.due_date,
        title: task.title,
        projectId: project.id,
        projectName: project.name,
        accountName,
        phaseName: phaseName(task.phase_id),
        status: task.status_label ?? task.status,
        done: DONE_TASK_STATUSES.has(task.status),
      });
    }
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

/** Tasks that carry no date at all, so they never fall off the calendar view. */
export function undatedTasks(projects: ScheduleProject[]) {
  return projects.flatMap((project) =>
    project.tasks
      .filter((task) => !task.due_date && !DONE_TASK_STATUSES.has(task.status))
      .map((task) => ({
        id: task.id,
        title: task.title,
        projectId: project.id,
        projectName: project.name,
        accountName: project.accounts?.name ?? "No client",
        phaseName: project.project_phases.find((p) => p.id === task.phase_id)?.name ?? null,
      })),
  );
}
