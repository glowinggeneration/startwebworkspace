import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamTask {
  id: string;
  title: string;
  status: string;
  status_label: string | null;
  due_date: string | null;
  project_id: string;
  assignee_id: string;
}

export interface TeamProject {
  id: string;
  name: string;
  status: string;
  status_label: string | null;
  due_date: string | null;
  owner_id: string | null;
  account_id: string;
  account_name: string;
}

export interface TeamCampaign {
  id: string;
  name: string;
  status: string;
  channel: string | null;
  owner_id: string | null;
  account_id: string | null;
  next_action: string | null;
  next_action_date: string | null;
}

export interface TeamWork {
  tasks: TeamTask[];
  projects: TeamProject[];
  campaigns: TeamCampaign[];
}

/**
 * Everything needed to show who is working on what: assigned tasks, owned
 * projects with their client, and owned campaigns. Workspace scoped.
 */
export function useTeamWork(workspaceId: string) {
  return useQuery({
    queryKey: ["team-work", workspaceId],
    enabled: workspaceId !== "",
    queryFn: async (): Promise<TeamWork> => {
      const [assignments, projects, campaigns] = await Promise.all([
        supabase
          .from("task_assignees")
          .select(
            "user_id, task:tasks(id, title, status, status_label, due_date, project_id, workspace_id)",
          )
          .eq("workspace_id", workspaceId),
        supabase
          .from("projects")
          .select(
            "id, name, status, status_label, due_date, owner_id, account_id, account:accounts(name)",
          )
          .eq("workspace_id", workspaceId)
          .order("name"),
        supabase
          .from("campaigns")
          .select("id, name, status, channel, owner_id, account_id, next_action, next_action_date")
          .eq("workspace_id", workspaceId)
          .order("name"),
      ]);

      if (assignments.error) throw assignments.error;
      if (projects.error) throw projects.error;
      if (campaigns.error) throw campaigns.error;

      const tasks: TeamTask[] = (
        (assignments.data ?? []) as unknown as {
          user_id: string;
          task: {
            id: string;
            title: string;
            status: string;
            status_label: string | null;
            due_date: string | null;
            project_id: string;
          } | null;
        }[]
      )
        .filter((row) => row.task !== null)
        .map((row) => ({
          id: row.task!.id,
          title: row.task!.title,
          status: row.task!.status,
          status_label: row.task!.status_label,
          due_date: row.task!.due_date,
          project_id: row.task!.project_id,
          assignee_id: row.user_id,
        }));

      const projectRows: TeamProject[] = (
        (projects.data ?? []) as unknown as {
          id: string;
          name: string;
          status: string;
          status_label: string | null;
          due_date: string | null;
          owner_id: string | null;
          account_id: string;
          account: { name: string } | null;
        }[]
      ).map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        status_label: row.status_label,
        due_date: row.due_date,
        owner_id: row.owner_id,
        account_id: row.account_id,
        account_name: row.account?.name ?? "Unknown client",
      }));

      return {
        tasks,
        projects: projectRows,
        campaigns: (campaigns.data ?? []) as unknown as TeamCampaign[],
      };
    },
  });
}

/** Tasks that are not finished yet. */
export function isOpenTask(task: TeamTask): boolean {
  return task.status !== "done" && task.status !== "complete";
}
