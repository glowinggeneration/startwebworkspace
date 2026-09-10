import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientBoardTask {
  id: string;
  title: string;
  status: string;
  status_label: string | null;
  due_date: string | null;
}

export interface ClientBoardProject {
  id: string;
  name: string;
  status: string;
  status_label: string | null;
  due_date: string | null;
  tasks: ClientBoardTask[];
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
}

/**
 * Clients, their contacts, projects and open next steps, for the pipeline board.
 */
export function useClientBoard(workspaceId: string) {
  return useQuery({
    queryKey: ["client-board", workspaceId],
    enabled: workspaceId !== "",
    queryFn: async (): Promise<ClientBoardAccount[]> => {
      const { data, error } = await supabase
        .from("accounts")
        .select(
          "id, name, relationship_status, review_priority, primary_service, account_type, summary, contacts(id, name, role_title), projects(id, name, status, status_label, due_date, tasks(id, title, status, status_label, due_date))",
        )
        .eq("workspace_id", workspaceId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as ClientBoardAccount[];
    },
  });
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
