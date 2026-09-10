import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Megaphone, ListChecks, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { useTeamWork, isOpenTask, type TeamTask } from "@/hooks/use-team";
import { AvatarLabelGroup } from "@/components/application/shell/avatar-label-group";
import {
  EmptyState,
  MetricTile,
  PageHeader,
  Panel,
  SegmentedControl,
} from "@/components/application/shell/page-parts";
import { StatusPill } from "@/components/application/shell/panel-parts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
  head: () => ({
    meta: [
      { title: "Team | Startweb" },
      {
        name: "description",
        content: "See each person's campaigns, assigned tasks and pipeline clients in one view.",
      },
      { property: "og:title", content: "Team | Startweb" },
      {
        property: "og:description",
        content: "Who is working on what across campaigns, tasks and clients.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

function SectionHeading({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" aria-hidden={true} />
      <p className="text-[0.8125rem] font-semibold tracking-[-0.006em] text-foreground">{label}</p>
      <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

function TaskLine({ task, projectName }: { task: TeamTask; projectName: string | undefined }) {
  const due = formatDate(task.due_date);
  return (
    <li className="flex items-start justify-between gap-3 py-1.5">
      <span className="min-w-0">
        <span className="block truncate text-sm text-foreground">{task.title}</span>
        {projectName ? (
          <span className="block truncate text-xs text-muted-foreground">{projectName}</span>
        ) : null}
      </span>
      {due ? (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{due}</span>
      ) : null}
    </li>
  );
}

function TeamPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(workspaceId);
  const { data: work, isLoading: workLoading, error } = useTeamWork(workspaceId);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"open" | "all">("open");

  const projectsById = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of work?.projects ?? []) map.set(project.id, project.name);
    return map;
  }, [work]);

  const people = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (members ?? [])
      .filter(
        (member) =>
          query === "" ||
          member.name.toLowerCase().includes(query) ||
          (member.email ?? "").toLowerCase().includes(query),
      )
      .map((member) => {
        const tasks = (work?.tasks ?? []).filter(
          (task) => task.assignee_id === member.userId && (scope === "all" || isOpenTask(task)),
        );
        const campaigns = (work?.campaigns ?? []).filter(
          (campaign) => campaign.owner_id === member.userId,
        );
        const projects = (work?.projects ?? []).filter(
          (project) => project.owner_id === member.userId,
        );

        const clientNames = new Map<string, string>();
        for (const project of projects) clientNames.set(project.account_id, project.account_name);
        for (const task of tasks) {
          const project = (work?.projects ?? []).find((p) => p.id === task.project_id);
          if (project) clientNames.set(project.account_id, project.account_name);
        }

        return {
          member,
          tasks,
          campaigns,
          projects,
          clients: [...clientNames.entries()].map(([id, name]) => ({ id, name })),
        };
      });
  }, [members, work, search, scope]);

  const totals = useMemo(
    () => ({
      people: members?.length ?? 0,
      tasks: (work?.tasks ?? []).filter(isOpenTask).length,
      campaigns: (work?.campaigns ?? []).length,
      unassigned: (work?.projects ?? []).filter((project) => project.owner_id === null).length,
    }),
    [members, work],
  );

  const loading = membersLoading || workLoading;

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Team"
        description="Who is working on what across campaigns, tasks and pipeline clients."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="People" value={String(totals.people)} />
        <MetricTile label="Open tasks" value={String(totals.tasks)} />
        <MetricTile label="Campaigns" value={String(totals.campaigns)} />
        <MetricTile
          label="Projects without an owner"
          value={String(totals.unassigned)}
          hint="Assign an owner on the project page."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search people"
          aria-label="Search people"
          className="w-full max-w-xs"
        />
        <SegmentedControl
          ariaLabel="Task scope"
          value={scope}
          onValueChange={setScope}
          options={[
            { value: "open", label: "Open tasks" },
            { value: "all", label: "All tasks" },
          ]}
        />
      </div>

      {error ? (
        <Panel>
          <EmptyState
            icon={Users}
            title="We could not load the team"
            description="Refresh the page to try again."
          />
        </Panel>
      ) : loading ? (
        <Panel>
          <EmptyState icon={Users} title="Loading the team" />
        </Panel>
      ) : people.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Users}
            title="No one matches that search"
            description="Clear the search to see everyone in the workspace."
          />
        </Panel>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {people.map(({ member, tasks, campaigns, projects, clients }) => (
            <Panel key={member.userId} className="reveal p-5">
              <div className="flex items-start justify-between gap-3">
                <AvatarLabelGroup
                  title={member.name}
                  subtitle={member.jobTitle ?? member.email ?? undefined}
                  imageUrl={member.avatarUrl}
                />
                <StatusPill
                  tone={tasks.length > 0 || campaigns.length > 0 ? "info" : "neutral"}
                  label={`${tasks.length + campaigns.length + projects.length} items`}
                />
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <SectionHeading icon={Megaphone} label="Campaigns" count={campaigns.length} />
                  {campaigns.length === 0 ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">No campaigns assigned.</p>
                  ) : (
                    <ul className="mt-1.5 divide-y divide-border/60">
                      {campaigns.map((campaign) => (
                        <li
                          key={campaign.id}
                          className="flex items-start justify-between gap-3 py-1.5"
                        >
                          <Link
                            to="/campaigns"
                            search={{ client: campaign.account_id ?? "" }}
                            className="min-w-0 truncate text-sm text-foreground underline-offset-4 hover:underline"
                          >
                            {campaign.name}
                          </Link>
                          <span className="shrink-0 text-xs capitalize text-muted-foreground">
                            {campaign.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <SectionHeading
                    icon={ListChecks}
                    label={scope === "open" ? "Open tasks" : "Tasks"}
                    count={tasks.length}
                  />
                  {tasks.length === 0 ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">Nothing assigned.</p>
                  ) : (
                    <ul className="mt-1.5 divide-y divide-border/60">
                      {tasks.slice(0, 6).map((task) => (
                        <TaskLine
                          key={task.id}
                          task={task}
                          projectName={projectsById.get(task.project_id)}
                        />
                      ))}
                    </ul>
                  )}
                  {tasks.length > 6 ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      and {tasks.length - 6} more
                    </p>
                  ) : null}
                </div>

                <div>
                  <SectionHeading
                    icon={Building2}
                    label="Pipeline clients"
                    count={clients.length}
                  />
                  {clients.length === 0 ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">No clients yet.</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {clients.map((client) => (
                        <Link
                          key={client.id}
                          to="/accounts"
                          className={cn(
                            "rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs text-foreground",
                            "transition-colors hover:bg-muted",
                          )}
                        >
                          {client.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
