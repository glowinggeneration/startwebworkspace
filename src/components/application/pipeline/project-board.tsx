import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DndContext, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  FolderOpen,
  Layers,
  MoreHorizontal,
  Receipt,
} from "lucide-react";
import { EmptyState, Panel } from "@/components/application/shell/page-parts";
import { StatusPill } from "@/components/application/shell/panel-parts";
import { cn } from "@/lib/utils";
import {
  BOARD_PHASES,
  currentPhaseName,
  openTasks,
  type ProjectBoardProject,
} from "@/hooks/use-project-board";
import { useUpdateProjectPhase } from "@/hooks/use-update-project-phase";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

interface ProjectBoardProps {
  projects: ProjectBoardProject[];
}

export function ProjectBoard({ projects }: ProjectBoardProps) {
  console.log("[ProjectBoard] projects count", projects.length, projects[0]);
  const { workspaceId } = useActiveWorkspace();
  const updatePhase = useUpdateProjectPhase(workspaceId);
  const [activeId, setActiveId] = useState<string | null>(null);

  const columns = useMemo(() => {
    const map = new Map<string, ProjectBoardProject[]>();
    for (const phase of BOARD_PHASES) map.set(phase, []);
    for (const project of projects) {
      const phase = currentPhaseName(project);
      const list = map.get(phase) ?? [];
      list.push(project);
      map.set(phase, list);
    }
    return map;
  }, [projects]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const projectId = active.id as string;
    const phaseName = over.id as string;
    const project = projects.find((p) => p.id === projectId);
    if (!project || currentPhaseName(project) === phaseName) return;
    updatePhase.mutate({ projectId, phaseName });
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {BOARD_PHASES.map((phase) => (
          <PhaseColumn
            key={phase}
            phase={phase}
            projects={columns.get(phase) ?? []}
            activeId={activeId}
          />
        ))}
      </div>
    </DndContext>
  );
}

function PhaseColumn({
  phase,
  projects,
  activeId,
}: {
  phase: string;
  projects: ProjectBoardProject[];
  activeId: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: phase });

  return (
    <div ref={setNodeRef} className="h-full">
      <Panel
        className={cn(
          "flex min-h-[32rem] flex-col transition-colors h-full",
          isOver && "bg-primary/5 ring-2 ring-primary/20",
        )}
      >
        <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{phase}</h2>
            <p className="text-xs text-muted-foreground">
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </p>
          </div>
          <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="max-h-[34rem] flex-1 space-y-3 overflow-y-auto p-4">
          {projects.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Nothing here yet"
              description={`Drag a project card here to move it to ${phase.toLowerCase()}.`}
              className="py-14"
            />
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isDragging={activeId === project.id}
              />
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function ProjectCard({
  project,
  isDragging,
}: {
  project: ProjectBoardProject;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: project.id,
  });
  const style = { transform: CSS.Translate.toString(transform) };
  const tasks = openTasks(project);
  const quote = project.quotes[0];
  const invoice = project.invoices[0];

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded-xl border border-border bg-card p-4 shadow-xs transition-shadow active:cursor-grabbing",
        isDragging && "opacity-40 shadow-lg",
        "hover:shadow-sm hover:ring-1 hover:ring-primary/10",
      )}
      aria-label={`${project.name} project card`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
        <MoreHorizontal className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {project.account?.name ?? "No client"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill
          label={project.status_label ?? project.status}
          tone={project.status === "completed" ? "positive" : "neutral"}
        />
        {tasks.length > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            <CalendarClock className="size-3" aria-hidden="true" />
            {tasks.length} open
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="size-3.5 shrink-0" aria-hidden="true" />
          {quote ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />
              Quote {quote.quote_number} · {quote.status}
            </span>
          ) : (
            <span>No quote yet</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Receipt className="size-3.5 shrink-0" aria-hidden="true" />
          {invoice ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />
              Invoice {invoice.invoice_number} · {invoice.status}
            </span>
          ) : (
            <span>No invoice yet</span>
          )}
        </div>
      </div>

      <Link
        to="/projects/$projectId"
        params={{ projectId: project.id }}
        className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        Open project
      </Link>
    </article>
  );
}
