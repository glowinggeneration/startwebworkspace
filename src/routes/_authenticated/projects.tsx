import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useProfile } from "@/hooks/use-profile";
import { useAccounts } from "@/hooks/use-accounts";
import { useProjects, useProjectPhases, useHandoffsByProject } from "@/hooks/use-projects";
import { useAcknowledgeHandoff } from "@/hooks/use-deal-handoffs";
import type { ProjectPhaseStatus } from "@/integrations/supabase/app-types";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: profile } = useProfile();
  const { data: projects, isLoading } = useProjects(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const { data: phases } = useProjectPhases(workspaceId);
  const { data: handoffs } = useHandoffsByProject(workspaceId);
  const acknowledge = useAcknowledgeHandoff(workspaceId);

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "Unknown account";

  async function handleAcknowledge(dealId: string) {
    if (!profile) return;
    try {
      await acknowledge.mutateAsync({ dealId, userId: profile.id });
      toast.success("Handoff acknowledged");
    } catch (error) {
      toast.error("Couldn't acknowledge the handoff", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="section-stack p-6">
      <div>
        <h1 className="type-display">Projects</h1>
        <p className="type-body text-muted-foreground">
          Created automatically the moment a deal is marked won.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {projects && projects.length === 0 && (
        <p className="type-body rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No projects yet — mark a deal won on the Pipeline board to create one.
        </p>
      )}

      <div className="space-y-4">
        {projects?.map((project) => {
          const projectPhases = (phases ?? [])
            .filter((phase) => phase.project_id === project.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const handoff = handoffs?.find((h) => h.project_id === project.id);

          return (
            <div key={project.id} className="card-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="type-card hover:underline"
                  >
                    {project.name}
                  </Link>
                  <p className="type-meta text-muted-foreground">
                    {accountName(project.account_id)}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                  {project.status.replace("_", " ")}
                </span>
              </div>

              {projectPhases.length > 0 && (
                <ol className="mt-4 flex flex-wrap gap-2">
                  {projectPhases.map((phase) => (
                    <li
                      key={phase.id}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        phaseToneClass(phase.status as ProjectPhaseStatus),
                      )}
                    >
                      {phase.name}
                    </li>
                  ))}
                </ol>
              )}

              {handoff && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    {handoff.acknowledged_at ? (
                      <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                    ) : (
                      <Clock className="size-4 text-warning" aria-hidden="true" />
                    )}
                    <p className="type-meta text-muted-foreground">
                      {handoff.acknowledged_at
                        ? `Handoff acknowledged ${new Date(handoff.acknowledged_at).toLocaleDateString("en-ZA")}`
                        : `Handed off ${new Date(handoff.handed_off_at).toLocaleDateString("en-ZA")} — needs a same-day acknowledgement`}
                    </p>
                  </div>
                  {!handoff.acknowledged_at && (
                    <Button size="sm" onClick={() => handleAcknowledge(handoff.deal_id)}>
                      Acknowledge
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function phaseToneClass(status: ProjectPhaseStatus): string {
  if (status === "done") return "border-success/30 bg-success/10 text-success";
  if (status === "in_progress") return "border-primary/30 bg-primary/10 text-primary";
  return "border-border text-muted-foreground";
}
