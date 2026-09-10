import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Clock, FolderKanban, LayoutGrid, List, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterCombobox } from "@/components/application/shell/filter-combobox";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useProfile } from "@/hooks/use-profile";
import { useAccounts } from "@/hooks/use-accounts";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { useProjects, useProjectPhases, useHandoffsByProject } from "@/hooks/use-projects";
import { useAcknowledgeHandoff } from "@/hooks/use-deal-handoffs";
import {
  EmptyState,
  PageHeader,
  Panel,
  Toolbar,
  UnderlineTabs,
} from "@/components/application/shell/page-parts";
import type { ProjectPhaseStatus } from "@/integrations/supabase/app-types";
import { PanelHeader, StatusPill } from "@/components/application/shell/panel-parts";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Projects | Startweb" },
      {
        name: "description",
        content: "Delivery projects created automatically when a deal is marked won.",
      },
      { property: "og:title", content: "Projects | Startweb" },
      { property: "og:description", content: "Track delivery projects and handoffs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProjectsPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: profile } = useProfile();
  const { data: projects, isLoading } = useProjects(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: phases } = useProjectPhases(workspaceId);
  const { data: handoffs } = useHandoffsByProject(workspaceId);
  const acknowledge = useAcknowledgeHandoff(workspaceId);

  const [tab, setTab] = useState<"all" | "active" | "completed">("all");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [view, setView] = useState<"list" | "grid">("list");

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "Unknown account";
  const memberName = (id: string | null | undefined) =>
    members?.find((m) => m.userId === id)?.name ?? "Unassigned";

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (projects ?? []).filter((project) => {
      if (tab === "active" && project.status === "completed") return false;
      if (tab === "completed" && project.status !== "completed") return false;
      const owner = (project as { owner_id?: string | null }).owner_id ?? null;
      if (ownerFilter !== "all" && owner !== ownerFilter) return false;
      if (!term) return true;
      return (
        project.name.toLowerCase().includes(term) ||
        accountName(project.account_id).toLowerCase().includes(term)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, accounts, tab, ownerFilter, search]);

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

  function renderProjectCard(project: (typeof filtered)[number]) {
    const projectPhases = (phases ?? [])
      .filter((phase) => phase.project_id === project.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const handoff = handoffs?.find((h) => h.project_id === project.id);
    return (
      <Panel key={project.id} className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="text-base font-semibold text-foreground hover:underline"
            >
              {project.name}
            </Link>
            <p className="text-sm text-muted-foreground">{accountName(project.account_id)}</p>
          </div>
          <StatusPill
            label={project.status.replace("_", " ")}
            tone={
              project.status === "completed"
                ? "positive"
                : project.status === "in_progress"
                  ? "info"
                  : "neutral"
            }
          />
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
              <p className="text-sm text-muted-foreground">
                {handoff.acknowledged_at
                  ? `Handoff acknowledged ${new Date(handoff.acknowledged_at).toLocaleDateString("en-ZA")}`
                  : `Handed off ${new Date(handoff.handed_off_at).toLocaleDateString("en-ZA")}, needs a same-day acknowledgement`}
              </p>
            </div>
            {!handoff.acknowledged_at && (
              <Button size="sm" onClick={() => handleAcknowledge(handoff.deal_id)}>
                Acknowledge
              </Button>
            )}
          </div>
        )}
      </Panel>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Projects"
        description="Created automatically the moment a deal is marked won."
        actions={
          <Button asChild variant="outline">
            <Link to="/pipeline">Open pipeline</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <UnderlineTabs
            ariaLabel="Project filters"
            value={tab}
            onValueChange={setTab}
            options={[
              { value: "all", label: "All projects", count: projects?.length ?? 0 },
              {
                value: "active",
                label: "Active",
                count: projects?.filter((p) => p.status !== "completed").length ?? 0,
              },
              {
                value: "completed",
                label: "Completed",
                count: projects?.filter((p) => p.status === "completed").length ?? 0,
              },
            ]}
          />

          <Toolbar>
            <div className="relative min-w-56 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                aria-label="Search projects"
                className="h-11 bg-card pl-9"
              />
            </div>
            <FilterCombobox
              value={ownerFilter}
              onValueChange={setOwnerFilter}
              icon={Users}
              ariaLabel="Filter by owner"
              placeholder="All owners"
              searchPlaceholder="Search people..."
              emptyLabel="No one found."
              options={[
                { value: "all", label: "All owners" },
                ...(members ?? []).map((member) => ({
                  value: member.userId,
                  label: member.name,
                  avatarName: member.name,
                })),
              ]}
            />
            <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {[
                { value: "list" as const, label: "List view", icon: List },
                { value: "grid" as const, label: "Grid view", icon: LayoutGrid },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  aria-label={option.label}
                  aria-pressed={view === option.value}
                  className={cn(
                    "rounded-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    view === option.value
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <option.icon className="size-4" aria-hidden="true" />
                </button>
              ))}
            </div>
          </Toolbar>

          {isLoading ? (
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
          ) : filtered.length === 0 ? (
            <Panel>
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Mark a deal won on the pipeline board and its project appears here."
                action={
                  <Button asChild>
                    <Link to="/pipeline">Open pipeline</Link>
                  </Button>
                }
              />
            </Panel>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map(renderProjectCard)}
            </div>
          ) : (
            <Panel className="overflow-x-auto">
              <PanelHeader
                title="Projects"
                description={`${filtered.length} ${filtered.length === 1 ? "project" : "projects"} in this workspace.`}
              />
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-5 py-3">
                      Project
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Client
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Owner
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Phase
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((project) => {
                    const projectPhases = (phases ?? [])
                      .filter((phase) => phase.project_id === project.id)
                      .sort((a, b) => a.sort_order - b.sort_order);
                    const currentPhase =
                      projectPhases.find((phase) => phase.status === "in_progress") ??
                      projectPhases.find((phase) => phase.status !== "done") ??
                      projectPhases[0];
                    const owner = (project as { owner_id?: string | null }).owner_id ?? null;
                    return (
                      <tr key={project.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3">
                          <Link
                            to="/projects/$projectId"
                            params={{ projectId: project.id }}
                            className="font-medium text-foreground hover:underline"
                          >
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {accountName(project.account_id)}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{memberName(owner)}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {currentPhase?.name ?? "No phases yet"}
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill
                            label={project.status.replace("_", " ")}
                            tone={
                              project.status === "completed"
                                ? "positive"
                                : project.status === "in_progress"
                                  ? "info"
                                  : "neutral"
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          )}
        </div>

        <Panel className="w-full shrink-0 p-6 xl:w-80">
          <h2 className="text-lg font-semibold text-foreground">Project setup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How work moves from a won deal into delivery.
          </p>
          <ol className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </span>
              <span className="text-muted-foreground">Mark a deal won on the pipeline board.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </span>
              <span className="text-muted-foreground">
                A project and its phases are created for you.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                3
              </span>
              <span className="text-muted-foreground">
                Acknowledge the handoff, then allocate hours on Workload.
              </span>
            </li>
          </ol>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link to="/workload">Go to workload</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Owners shown here come from the team members in your workspace:{" "}
            {memberName(profile?.id)} is signed in.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function phaseToneClass(status: ProjectPhaseStatus): string {
  if (status === "done") return "border-success/30 bg-success/10 text-success";
  if (status === "in_progress") return "border-primary/30 bg-primary/10 text-primary";
  return "border-border text-muted-foreground";
}
