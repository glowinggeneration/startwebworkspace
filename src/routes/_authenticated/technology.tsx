import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MonitorCog, ShieldCheck, TriangleAlert, Wrench } from "lucide-react";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import {
  useAddBlocker,
  useProductionProjects,
  useProjectBlockers,
  useProjectTech,
  useQaSubmissions,
  useResolveBlocker,
  useReviewQa,
  useSaveProjectTech,
  useSetProductionStage,
  type ProjectTech,
} from "@/hooks/use-technology";
import { PRODUCTION_STAGES, stageLabel } from "@/lib/production-stages";
import {
  EmptyState,
  MetricTile,
  PageHeader,
  Panel,
  UnderlineTabs,
} from "@/components/application/shell/page-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/technology")({
  component: TechnologyPage,
  head: () => ({
    meta: [
      { title: "Technology | Startweb workspace" },
      {
        name: "description",
        content:
          "Website production stages, technical details, QA sign off and support for every Startweb build.",
      },
      { property: "og:title", content: "Technology | Startweb workspace" },
      {
        property: "og:description",
        content: "Every website in production, its stage, its technical record and its QA status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type TabValue = "overview" | "board" | "qa" | "support";

function TechnologyPage() {
  const workspace = useActiveWorkspace();
  const workspaceId = workspace.workspaceId;
  const [tab, setTab] = useState<TabValue>("overview");

  const { data: projects = [] } = useProductionProjects(workspaceId);
  const { data: tech = [] } = useProjectTech(workspaceId);
  const { data: qa = [] } = useQaSubmissions(workspaceId);
  const { data: blockers = [] } = useProjectBlockers(workspaceId);
  const { data: accounts = [] } = useAccounts(workspaceId);
  const { data: members = [] } = useWorkspaceMembers(workspaceId);

  const setStage = useSetProductionStage(workspaceId);
  const saveTech = useSaveProjectTech(workspaceId);
  const reviewQa = useReviewQa(workspaceId);
  const addBlocker = useAddBlocker(workspaceId);
  const resolveBlocker = useResolveBlocker(workspaceId);

  const accountName = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of accounts) map.set(account.id, account.name);
    return map;
  }, [accounts]);

  const techByProject = useMemo(() => {
    const map = new Map(tech.map((row) => [row.project_id, row]));
    return map;
  }, [tech]);

  const openQa = qa.filter((row) => row.status === "submitted");
  const openBlockers = blockers.filter((row) => row.status === "open");
  const live = projects.filter((p) =>
    ["launched", "post_launch_support", "complete"].includes(p.production_stage ?? ""),
  );
  const inProduction = projects.length - live.length;

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Technology"
        description="Every website we are building, what stage it is at, and what is holding it up."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Sites in production" value={String(inProduction)} />
        <MetricTile label="Launched or live" value={String(live.length)} />
        <MetricTile label="Waiting on QA" value={String(openQa.length)} />
        <MetricTile label="Open blockers" value={String(openBlockers.length)} />
      </div>

      <UnderlineTabs
        value={tab}
        onValueChange={setTab}
        ariaLabel="Technology views"
        options={[
          { value: "overview", label: "Overview" },
          { value: "board", label: "Production board", count: projects.length },
          { value: "qa", label: "QA and launches", count: openQa.length },
          { value: "support", label: "Support", count: openBlockers.length },
        ]}
      />

      {tab === "overview" ? (
        <Panel className="p-6">
          {projects.length === 0 ? (
            <EmptyState
              icon={MonitorCog}
              title="No website projects yet"
              description="Projects created from won work appear here with their production stage."
            />
          ) : (
            <ul className="divide-y divide-border">
              {projects.map((project) => {
                const row = techByProject.get(project.id);
                return (
                  <li key={project.id} className="flex flex-wrap items-center gap-4 py-3">
                    <div className="min-w-56 flex-1">
                      <p className="text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {accountName.get(project.account_id) ?? "Client"} ·{" "}
                        {stageLabel(project.production_stage)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {row?.live_url ?? row?.staging_url ?? "No link yet"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      ) : null}

      {tab === "board" ? (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <Panel className="p-6">
              <EmptyState
                icon={MonitorCog}
                title="Nothing in production"
                description="Once a website project exists you can move it through the thirteen stages here."
              />
            </Panel>
          ) : (
            projects.map((project) => {
              const row = techByProject.get(project.id);
              return (
                <Panel key={project.id} className="space-y-4 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.9375rem] font-semibold text-foreground">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {accountName.get(project.account_id) ?? "Client"}
                      </p>
                    </div>
                    <Select
                      value={project.production_stage ?? "brief_received"}
                      onValueChange={(value) => setStage.mutate({ id: project.id, stage: value })}
                    >
                      <SelectTrigger className="h-10 w-56" aria-label={`Stage for ${project.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCTION_STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <TechForm
                    projectId={project.id}
                    value={row}
                    members={members.map((m) => ({ user_id: m.userId, full_name: m.name }))}
                    onSave={(values) => saveTech.mutate(values)}
                  />
                </Panel>
              );
            })
          )}
        </div>
      ) : null}

      {tab === "qa" ? (
        <Panel className="p-6">
          {qa.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No QA submissions"
              description="When a builder submits a site for QA it appears here for approval."
            />
          ) : (
            <ul className="divide-y divide-border">
              {qa.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="min-w-56 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {projects.find((p) => p.id === row.project_id)?.name ?? "Project"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.submitted_at).toLocaleDateString("en-ZA")} · {row.status}
                    </p>
                    {row.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">{row.notes}</p>
                    ) : null}
                  </div>
                  {row.status === "submitted" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => reviewQa.mutate({ id: row.id, status: "approved" })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          reviewQa.mutate({ id: row.id, status: "changes_required" })
                        }
                      >
                        Send back
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      {tab === "support" ? (
        <div className="space-y-4">
          <BlockerForm
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            onAdd={(values) => addBlocker.mutate(values)}
          />
          <Panel className="p-6">
            {blockers.length === 0 ? (
              <EmptyState
                icon={TriangleAlert}
                title="Nothing blocked"
                description="Missing content, access or assets raised against a site show up here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {blockers.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center gap-4 py-3">
                    <div className="min-w-56 flex-1">
                      <p className="text-sm text-foreground">{row.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {projects.find((p) => p.id === row.project_id)?.name ?? "Project"} ·{" "}
                        {row.kind} · {row.status}
                      </p>
                    </div>
                    {row.status === "open" ? (
                      <Button size="sm" variant="outline" onClick={() => resolveBlocker.mutate(row.id)}>
                        Mark resolved
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function TechForm({
  projectId,
  value,
  members,
  onSave,
}: {
  projectId: string;
  value: ProjectTech | undefined;
  members: { user_id: string; full_name: string | null }[];
  onSave: (values: Record<string, unknown> & { project_id: string }) => void;
}) {
  const [domain, setDomain] = useState(value?.domain ?? "");
  const [hosting, setHosting] = useState(value?.hosting ?? "");
  const [stack, setStack] = useState(value?.tech_stack ?? "");
  const [staging, setStaging] = useState(value?.staging_url ?? "");
  const [liveUrl, setLiveUrl] = useState(value?.live_url ?? "");
  const [builder, setBuilder] = useState(value?.builder_id ?? "none");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Field label="Domain" value={domain} onChange={setDomain} id={`domain-${projectId}`} />
      <Field label="Hosting" value={hosting} onChange={setHosting} id={`hosting-${projectId}`} />
      <Field label="Stack" value={stack} onChange={setStack} id={`stack-${projectId}`} />
      <Field label="Staging link" value={staging} onChange={setStaging} id={`staging-${projectId}`} />
      <Field label="Live link" value={liveUrl} onChange={setLiveUrl} id={`live-${projectId}`} />
      <div className="space-y-1.5">
        <Label htmlFor={`builder-${projectId}`}>Builder</Label>
        <Select value={builder} onValueChange={setBuilder}>
          <SelectTrigger id={`builder-${projectId}`} className="h-10">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.full_name ?? "Team member"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-3">
        <Button
          variant="outline"
          onClick={() =>
            onSave({
              project_id: projectId,
              domain: domain || null,
              hosting: hosting || null,
              tech_stack: stack || null,
              staging_url: staging || null,
              live_url: liveUrl || null,
              builder_id: builder === "none" ? null : builder,
            })
          }
        >
          <Wrench className="size-4" aria-hidden="true" /> Save technical details
        </Button>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function BlockerForm({
  projects,
  onAdd,
}: {
  projects: { id: string; name: string }[];
  onAdd: (values: { projectId: string; kind: string; description: string }) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [kind, setKind] = useState("content");
  const [description, setDescription] = useState("");

  if (projects.length === 0) return null;

  return (
    <Panel className="space-y-4 p-6">
      <p className="text-[0.9375rem] font-semibold text-foreground">Raise a blocker</p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="blocker-project">Website</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="blocker-project" className="h-10">
              <SelectValue placeholder="Choose a website" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="blocker-kind">What is missing</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger id="blocker-kind" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="assets">Assets</SelectItem>
              <SelectItem value="access">Access</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 md:col-span-3">
          <Label htmlFor="blocker-note">Detail</Label>
          <Textarea
            id="blocker-note"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
          />
        </div>
      </div>
      <Button
        disabled={!projectId || !description.trim()}
        onClick={() => {
          onAdd({ projectId, kind, description: description.trim() });
          setDescription("");
        }}
      >
        Add blocker
      </Button>
    </Panel>
  );
}
