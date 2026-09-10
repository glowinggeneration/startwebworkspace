import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentPhaseName, type ProjectBoardProject } from "@/hooks/use-project-board";
import { nearestDeadline } from "@/lib/project-deadlines";

/**
 * A narrow always-visible client rail plus that client's projects and
 * phases in the remaining width — a master-detail pattern that fits a
 * phone screen without hiding either side behind navigation, unlike the
 * desktop board's multi-column grid.
 */
export function MobilePipelineView({ projects }: { projects: ProjectBoardProject[] }) {
  const clients = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; projectCount: number; alertCount: number }
    >();
    for (const project of projects) {
      const id = project.accounts?.id ?? project.account_id;
      const name = project.accounts?.name ?? "No client";
      const existing = map.get(id) ?? { id, name, projectCount: 0, alertCount: 0 };
      existing.projectCount += 1;
      if (nearestDeadline(project)) existing.alertCount += 1;
      map.set(id, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id ?? null);
  const activeClientId = selectedClientId ?? clients[0]?.id ?? null;
  const clientProjects = projects.filter(
    (project) => (project.accounts?.id ?? project.account_id) === activeClientId,
  );

  if (clients.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No projects yet.</p>;
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] overflow-hidden rounded-xl border border-border">
      <nav
        aria-label="Clients"
        className="flex w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-border bg-muted/30 py-2"
      >
        {clients.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => setSelectedClientId(client.id)}
            aria-current={client.id === activeClientId ? "true" : undefined}
            title={client.name}
            className={cn(
              "relative flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase",
              client.id === activeClientId
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-accent",
            )}
          >
            {client.name.slice(0, 2)}
            {client.alertCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[0.6rem] text-destructive-foreground">
                {client.alertCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-3">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {clients.find((c) => c.id === activeClientId)?.name}
        </h2>
        <div className="space-y-3">
          {clientProjects.map((project) => {
            const deadline = nearestDeadline(project);
            const phase = currentPhaseName(project);
            return (
              <Link
                key={project.id}
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="block rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{project.name}</p>
                  <ArrowRight
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Phase: {phase}</p>
                {deadline && (
                  <p
                    className={cn(
                      "mt-2 flex items-center gap-1 text-xs font-medium",
                      deadline.severity === "overdue" ? "text-destructive" : "text-amber-600",
                    )}
                  >
                    <AlertTriangle className="size-3" aria-hidden="true" />
                    {deadline.severity === "overdue" ? "Overdue" : "Due soon"}: {deadline.label} (
                    {deadline.date})
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
