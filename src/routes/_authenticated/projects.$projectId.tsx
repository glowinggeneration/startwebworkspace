import { useState } from "react";
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
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import {
  PhaseAccordion,
  type PhaseAccordionItem,
} from "@/components/application/projects/phase-accordion";
import { TaskRow } from "@/components/application/projects/task-row";
import { AddTaskForm } from "@/components/application/projects/add-task-form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  KanbanBoard,
  type Accent,
  type KanbanColumn,
  type KanbanTask,
} from "@/components/ui/kanban-board";
import type { TaskStatus } from "@/integrations/supabase/app-types";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: ProjectDetailPage,
});

const STATUS_COLUMNS: Array<{ id: TaskStatus; name: string; accent: Accent }> = [
  { id: "todo", name: "To do", accent: "slate" },
  { id: "in_progress", name: "In Progress", accent: "violet" },
  { id: "done", name: "Done", accent: "emerald" },
];

function formatDueDate(value: string | null) {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
  });
}

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { workspaceId } = useActiveWorkspace();
  const { data: projects } = useProjects(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const { data: phases } = useProjectPhases(workspaceId);
  const { data: tasks } = useTasks(workspaceId, projectId);
  const { data: assignments } = useTaskAssignees(workspaceId, projectId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const updateStatus = useUpdateTaskStatus(workspaceId, projectId);
  const setAssignees = useSetTaskAssignees(workspaceId, projectId);
  const [view, setView] = useState<"phases" | "board">("phases");

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

  async function handleBoardChange(next: KanbanColumn[]) {
    // KanbanBoard hands back the whole board on every move; find the one
    // task whose column no longer matches its real status and persist just
    // that change. The board's own view re-derives from `tasks` once the
    // mutation invalidates the query, so there's no local board state here.
    for (const column of next) {
      for (const boardTask of column.tasks) {
        const current = (tasks ?? []).find((t) => t.id === boardTask.id);
        if (current && current.status !== column.id) {
          try {
            await updateStatus.mutateAsync({ id: boardTask.id, status: column.id as TaskStatus });
          } catch (error) {
            toast.error("Couldn't update the task", {
              description: error instanceof Error ? error.message : undefined,
            });
          }
          return;
        }
      }
    }
  }

  const boardColumns: KanbanColumn[] = STATUS_COLUMNS.map((statusColumn) => ({
    id: statusColumn.id,
    name: statusColumn.name,
    accent: statusColumn.accent,
    tasks: (tasks ?? [])
      .filter((task) => task.status === statusColumn.id)
      .map((task): KanbanTask => {
        const phase = projectPhases.find((p) => p.id === task.phase_id);
        const assigneeIds = (assignments ?? [])
          .filter((a) => a.task_id === task.id)
          .map((a) => a.user_id);
        const taskAssignees = assigneeIds
          .map((userId) => members?.find((m) => m.userId === userId))
          .filter((member): member is NonNullable<typeof member> => !!member)
          .map((member) =>
            member.avatarUrl
              ? { name: member.name, avatar: member.avatarUrl }
              : { name: member.name },
          );
        const due = formatDueDate(task.due_date);
        return {
          id: task.id,
          title: task.title,
          assignees: taskAssignees,
          ...(task.description ? { note: task.description } : {}),
          ...(phase?.name ? { category: phase.name } : {}),
          ...(due ? { due } : {}),
        };
      }),
  }));

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
      <div className="flex flex-wrap items-start justify-between gap-4">
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

        <Tabs value={view} onValueChange={(value) => setView(value as "phases" | "board")}>
          <TabsList aria-label="Project view">
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "board" ? (
        tasks && tasks.length > 0 ? (
          <KanbanBoard
            columns={boardColumns}
            onChange={(next) => void handleBoardChange(next)}
            label={`${project?.name ?? "Project"} task board`}
          />
        ) : (
          <p className="type-body text-muted-foreground">This project has no tasks yet.</p>
        )
      ) : accordionItems.length > 0 ? (
        <PhaseAccordion items={accordionItems} />
      ) : (
        <p className="type-body text-muted-foreground">This project has no phases yet.</p>
      )}
    </div>
  );
}
