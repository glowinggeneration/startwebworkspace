import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientBoardTask {
  id: string;
  title: string;
  status: string;
  status_label: string | null;
  due_date: string | null;
}

export interface ClientBoardPhase {
  id: string;
  name: string;
  status: string;
  sort_order: number;
}

export interface ClientBoardProject {
  id: string;
  name: string;
  status: string;
  status_label: string | null;
  due_date: string | null;
  tasks: ClientBoardTask[];
  project_phases: ClientBoardPhase[];
}

export interface ClientBoardCampaign {
  id: string;
  name: string;
  status: string;
  next_action: string | null;
  next_action_date: string | null;
}

export interface ClientBoardQuote {
  id: string;
  quote_number: string;
  status: string;
  issue_date: string;
  quote_line_items: { quantity: number; unit_price: number }[];
}

export interface ClientBoardInvoice {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  invoice_line_items: { quantity: number; unit_price: number }[];
}

export interface ClientBoardAccount {
  id: string;
  name: string;
  relationship_status: string | null;
  review_priority: string | null;
  primary_service: string | null;
  account_type: string | null;
  summary: string | null;
  contacts: { id: string; name: string; role_title: string | null }[];
  projects: ClientBoardProject[];
  campaigns: ClientBoardCampaign[];
  quotes: ClientBoardQuote[];
  invoices: ClientBoardInvoice[];
}

/**
 * Clients with their contacts, projects and phases, campaigns, quotes,
 * invoices and open next steps, for the pipeline board.
 */
export function useClientBoard(workspaceId: string) {
  return useQuery({
    queryKey: ["client-board", workspaceId],
    enabled: workspaceId !== "",
    queryFn: async (): Promise<ClientBoardAccount[]> => {
      const { data, error } = await supabase
        .from("accounts")
        .select(
          "id, name, relationship_status, review_priority, primary_service, account_type, summary, contacts(id, name, role_title), projects(id, name, status, status_label, due_date, tasks(id, title, status, status_label, due_date), project_phases(id, name, status, sort_order)), campaigns(id, name, status, next_action, next_action_date), quotes(id, quote_number, status, issue_date, quote_line_items(quantity, unit_price)), invoices(id, invoice_number, status, issue_date, invoice_line_items(quantity, unit_price))",
        )
        .eq("workspace_id", workspaceId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as ClientBoardAccount[];
    },
  });
}

/** Total of a set of line items. */
export function lineItemsTotal(items: { quantity: number; unit_price: number }[]) {
  return items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
}

/** Newest document by issue date, or null when the client has none. */
export function latestDocument<T extends { issue_date: string }>(documents: T[]): T | null {
  if (documents.length === 0) return null;
  return [...documents].sort((a, b) => b.issue_date.localeCompare(a.issue_date))[0] ?? null;
}

/** The phase a project is currently sitting in: the first one not complete. */
export function currentPhase(project: ClientBoardProject): ClientBoardPhase | null {
  const phases = [...(project.project_phases ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  if (phases.length === 0) return null;
  return phases.find((phase) => phase.status !== "complete") ?? phases[phases.length - 1] ?? null;
}

export type ClientStage = "proposal" | "active" | "attention" | "delivered";

export const CLIENT_STAGES: { value: ClientStage; label: string; description: string }[] = [
  { value: "proposal", label: "Proposal", description: "Quoted, waiting on a decision." },
  { value: "active", label: "In progress", description: "Work is running right now." },
  { value: "attention", label: "Needs attention", description: "Paused, at risk or unpaid." },
  { value: "delivered", label: "Delivered", description: "Handed over or in review." },
];

/** Maps the free text relationship status from the conversation import onto a board column. */
export function clientStage(account: ClientBoardAccount): ClientStage {
  const status = (account.relationship_status ?? "").toLowerCase();
  if (/(risk|paused|unpaid|payment pending|awaiting|needs review|hold)/.test(status))
    return "attention";
  if (/(proposal|quote|alignment|closing|enablement|follow-up)/.test(status)) return "proposal";
  if (/(delivered|complete|handover|review)/.test(status)) return "delivered";
  if (/(active|in progress|live|running)/.test(status)) return "active";
  const hasOpenWork = account.projects.some((project) => project.status !== "complete");
  return hasOpenWork ? "active" : "delivered";
}

export function openTasks(account: ClientBoardAccount): ClientBoardTask[] {
  return account.projects
    .flatMap((project) => project.tasks)
    .filter((task) => task.status !== "done");
}
