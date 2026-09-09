import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useProjects, useProjectPhases } from "@/hooks/use-projects";
import {
  useTasks,
  useTaskAssignees,
  useUpdateTaskStatus,
  useSetTaskAssignees,
} from "@/hooks/use-tasks";
import {
  PhaseAccordion,
  type PhaseAccordionItem,
} from "@/components/application/projects/phase-accordion";
import { TaskRow } from "@/components/application/projects/task-row";
import { AddTaskForm } from "@/components/application/projects/add-task-form";
import type { TaskStatus } from "@/integrations/supabase/app-types";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { workspaceId } = useActiveWorkspace();
  const { data: projects } = useProjects(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const { data: phases } = useProjectPhases(workspaceId);
  const { data: tasks } = useTasks(workspaceId, projectId);
  const { data: assignments } = useTaskAssignees(workspaceId, projectId);
  const updateStatus = useUpdateTaskStatus(workspaceId, projectId);
  const setAssignees = useSetTaskAssignees(workspaceId, projectId);

  const project = projects?.find((p) => p.id === projectId);
  const projectPhases = (phases ?? [])
    .filter((phase) => phase.project_id === projectId)
    .sort((a, b) => a.sort_order - b.sort_order);

  async function handleToggleDone(taskId: string, done: boolean) {
    try {
      await updateStatus.mutateAsync({ id: taskId, status: done ? "done" : "todo" });
    } catch (error) {
      toast.error("Couldn't update the task", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleAssigneesChange(taskId: string, userIds: string[]) {
    try {
      await setAssignees.mutateAsync({ taskId, userIds });
    } catch (error) {
      toast.error("Couldn't update assignees", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const accordionItems: PhaseAccordionItem[] = projectPhases.map((phase) => {
    const phaseTasks = (tasks ?? []).filter((task) => task.phase_id === phase.id);
    return {
      id: phase.id,
      title: phase.name,
      status: phase.status as PhaseAccordionItem["status"],
      content: (
        <div>
          {phaseTasks.length === 0 && (
            <p className="type-meta text-muted-foreground">No tasks in this phase yet.</p>
          )}
          <div className="divide-y divide-border">
            {phaseTasks.map((task) => (
              <TaskRow
                key={task.id}
                title={task.title}
                status={task.status as TaskStatus}
                dueDate={task.due_date}
                assignedUserIds={(assignments ?? [])
                  .filter((a) => a.task_id === task.id)
                  .map((a) => a.user_id)}
                onToggleDone={(done) => handleToggleDone(task.id, done)}
                onAssigneesChange={(userIds) => handleAssigneesChange(task.id, userIds)}
              />
            ))}
          </div>
          <AddTaskForm projectId={projectId} phaseId={phase.id} />
        </div>
      ),
    };
  });

  return (
    <div className="section-stack p-8">
      <div>
        <Link
          to="/projects"
          className="type-meta mb-2 inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Projects
        </Link>
        <h1 className="type-display">{project?.name ?? "Project"}</h1>
        {project && (
          <p className="type-body text-muted-foreground">
            {accounts?.find((a) => a.id === project.account_id)?.name}
          </p>
        )}
      </div>

      {accordionItems.length > 0 ? (
        <PhaseAccordion items={accordionItems} />
      ) : (
        <p className="type-body text-muted-foreground">This project has no phases yet.</p>
      )}
    </div>
  );
}
