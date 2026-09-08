import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, TaskStatus } from "@/integrations/supabase/types";

type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];

export function useTasks(workspaceId: string, projectId: string) {
  return useQuery({
    queryKey: ["tasks", workspaceId, projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, phase_id, title, description, status, priority, due_date, created_at")
        .eq("workspace_id", workspaceId)
        .eq("project_id", projectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useTaskAssignees(workspaceId: string, projectId: string) {
  return useQuery({
    queryKey: ["task-assignees", workspaceId, projectId],
    queryFn: async () => {
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("project_id", projectId);
      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) return [];

      const { data, error } = await supabase
        .from("task_assignees")
        .select("task_id, user_id")
        .in(
          "task_id",
          tasks.map((t) => t.id),
        );
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTask(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TaskInsert, "workspace_id" | "project_id">) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...input, workspace_id: workspaceId, project_id: projectId })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      void queryClient.invalidateQueries({ queryKey: ["project-phases", workspaceId] });
    },
  });
}

export function useUpdateTaskStatus(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      // The DB cascade updates phase/project status as part of the same
      // transaction — refresh the views that read those.
      void queryClient.invalidateQueries({ queryKey: ["project-phases", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });
}

export function useSetTaskAssignees(workspaceId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      const { error: deleteError } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId);
      if (deleteError) throw deleteError;

      if (userIds.length > 0) {
        const { error: insertError } = await supabase.from("task_assignees").insert(
          userIds.map((userId) => ({
            task_id: taskId,
            user_id: userId,
            workspace_id: workspaceId,
          })),
        );
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-assignees", workspaceId, projectId] });
    },
  });
}
