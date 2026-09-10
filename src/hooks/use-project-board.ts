import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectBoardTask {
  id: string;
  title: string;
  status: string;
  status_label: string | null;
  due_date: string | null;
}

export interface ProjectBoardPhase {
  id: string;
  name: string;
  status: string;
  sort_order: number;
}

export interface ProjectBoardInvoice {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
}

export interface ProjectBoardProject {
  id: string;
  name: string;
  status: string;
  status_label: string | null;
  start_date: string | null;
  due_date: string | null;
  account_id: string;
  accounts: { id: string; name: string } | null;
  project_phases: ProjectBoardPhase[];
  tasks: ProjectBoardTask[];
  invoices: ProjectBoardInvoice[];
}

/**
 * Projects with their account, phases, tasks, quotes and invoices for the
 * project pipeline board.
 */
export function useProjectBoard(workspaceId: string) {
  return useQuery({
    queryKey: ["project-board", workspaceId],
    enabled: workspaceId !== "",
    queryFn: async (): Promise<ProjectBoardProject[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, name, status, status_label, start_date, due_date, account_id, accounts(id, name), project_phases(id, name, status, sort_order), tasks(id, title, status, status_label, due_date), invoices(id, invoice_number, status, issue_date, due_date)",
        )
        .eq("workspace_id", workspaceId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as ProjectBoardProject[];
    },
  });
}

export const BOARD_PHASES = ["Kickoff", "Design", "Build", "Review", "Launch"];

/** Returns the active phase name, or the first not-done phase, or Kickoff. */
export function currentPhaseName(project: ProjectBoardProject): string {
  const phases = [...project.project_phases].sort((a, b) => a.sort_order - b.sort_order);
  const active = phases.find((phase) => phase.status === "in_progress");
  if (active) return active.name;
  const next = phases.find((phase) => phase.status !== "done");
  if (next) return next.name;
  return phases[0]?.name ?? "Kickoff";
}

export function openTasks(project: ProjectBoardProject): ProjectBoardTask[] {
  return project.tasks.filter((task) => task.status !== "done" && task.status !== "complete");
}
