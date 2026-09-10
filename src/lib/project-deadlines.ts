import { currentPhaseName, openTasks, type ProjectBoardProject } from "@/hooks/use-project-board";

export type DeadlineSeverity = "overdue" | "soon";

export interface ProjectDeadlineAlert {
  label: string;
  date: string;
  severity: DeadlineSeverity;
}

const SOON_WINDOW_DAYS = 7;

function daysUntil(date: string, today: Date): number {
  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const diffMs = target.getTime() - new Date(today.toDateString()).getTime();
  return Math.round(diffMs / 86_400_000);
}

function severityFor(days: number): DeadlineSeverity | null {
  if (days < 0) return "overdue";
  if (days <= SOON_WINDOW_DAYS) return "soon";
  return null;
}

/**
 * The single most urgent deadline for a project — its own due date, its
 * current phase's due date, or its nearest open task — for the Pipeline
 * board's alert badge. Returns null when nothing is due soon or overdue.
 */
export function nearestDeadline(
  project: ProjectBoardProject,
  today: Date = new Date(),
): ProjectDeadlineAlert | null {
  const candidates: ProjectDeadlineAlert[] = [];

  if (project.due_date) {
    const severity = severityFor(daysUntil(project.due_date, today));
    if (severity) candidates.push({ label: "Project due", date: project.due_date, severity });
  }

  const activePhaseName = currentPhaseName(project);
  const activePhase = project.project_phases.find((phase) => phase.name === activePhaseName);
  if (activePhase?.due_date && activePhase.status !== "done") {
    const severity = severityFor(daysUntil(activePhase.due_date, today));
    if (severity) {
      candidates.push({ label: `${activePhase.name} due`, date: activePhase.due_date, severity });
    }
  }

  for (const task of openTasks(project)) {
    if (!task.due_date) continue;
    const severity = severityFor(daysUntil(task.due_date, today));
    if (severity) candidates.push({ label: task.title, date: task.due_date, severity });
  }

  if (candidates.length === 0) return null;

  // Overdue beats soon; within the same severity, the earliest date wins.
  candidates.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "overdue" ? -1 : 1;
    return a.date.localeCompare(b.date);
  });
  return candidates[0] ?? null;
}
