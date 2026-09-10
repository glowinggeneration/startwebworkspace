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
  due_date: string | null;
}

export interface ProjectBoardInvoice {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
}

export interface ProjectBoardQuote {
  id: string;
  quote_number: string;
  status: string;
  issue_date: string;
  account_id: string;
  project_id: string | null;
}

export interface ProjectBoardCampaign {
  id: string;
  name: string;
  status: string;
  planned_cost: number;
  spent_cost: number;
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
  quotes: ProjectBoardQuote[];
  invoices: ProjectBoardInvoice[];
  campaigns: ProjectBoardCampaign[];
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
          "id, name, status, status_label, start_date, due_date, account_id, accounts(id, name), project_phases(id, name, status, sort_order, due_date), tasks(id, title, status, status_label, due_date), invoices(id, invoice_number, status, issue_date, due_date), campaigns(id, name, status, planned_cost, spent_cost)",
        )
        .eq("workspace_id", workspaceId)
        .order("name");
      if (error) throw error;
      const projects = (data ?? []) as unknown as ProjectBoardProject[];

      // Quotes carry project_id directly for anything created after that
      // column existed. Older quotes (created before it did) only have an
      // account_id — still shown on a project card, but only when that's
      // the client's one and only project, so an ambiguous legacy quote
      // never gets guessed onto the wrong one of several projects.
      const { data: quotes, error: quotesError } = await supabase
        .from("quotes")
        .select("id, quote_number, status, issue_date, account_id, project_id")
        .eq("workspace_id", workspaceId);
      if (quotesError) throw quotesError;

      const quotesByProject = new Map<string, ProjectBoardQuote[]>();
      const legacyQuotesByAccount = new Map<string, ProjectBoardQuote[]>();
      for (const quote of (quotes ?? []) as ProjectBoardQuote[]) {
        if (quote.project_id) {
          const list = quotesByProject.get(quote.project_id) ?? [];
          list.push(quote);
          quotesByProject.set(quote.project_id, list);
        } else {
          const list = legacyQuotesByAccount.get(quote.account_id) ?? [];
          list.push(quote);
          legacyQuotesByAccount.set(quote.account_id, list);
        }
      }

      const projectCountByAccount = new Map<string, number>();
      for (const project of projects) {
        projectCountByAccount.set(
          project.account_id,
          (projectCountByAccount.get(project.account_id) ?? 0) + 1,
        );
      }

      return projects.map((project) => {
        const linkedQuotes = quotesByProject.get(project.id) ?? [];
        const legacyQuotes =
          projectCountByAccount.get(project.account_id) === 1
            ? (legacyQuotesByAccount.get(project.account_id) ?? [])
            : [];
        return { ...project, quotes: [...linkedQuotes, ...legacyQuotes] };
      });
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
