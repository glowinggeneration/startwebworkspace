import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Link2, Megaphone, Search, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EmptyState,
  MetricTile,
  PageHeader,
  Panel,
  SegmentedControl,
  Toolbar,
  UnderlineTabs,
} from "@/components/application/shell/page-parts";
import {
  PanelFooter,
  PanelHeader,
  PanelSection,
  PanelTitleBar,
  ProgressMeter,
  StatusPill,
} from "@/components/application/shell/panel-parts";
import { FilterCombobox } from "@/components/application/shell/filter-combobox";
import { LoadingIndicator } from "@/components/application/shell/loading-indicator";
import { UtilityIconButton } from "@/components/application/shell/utility-icon-button";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import {
  useCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useSetTaskCampaign,
  useUpdateCampaign,
  useWorkspaceTasks,
  useCampaignQuotes,
  type CampaignRow,
  type CampaignStatus,
} from "@/hooks/use-campaigns";
import { currency } from "@/lib/sales/currency";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    client: typeof search["client"] === "string" ? search["client"] : "all",
  }),
  head: () => ({
    meta: [
      { title: "Campaigns | Startweb" },
      {
        name: "description",
        content:
          "Track every campaign's status, dates, owner, next action, linked tasks and budget against actual spend.",
      },
      { property: "og:title", content: "Campaigns | Startweb" },
      {
        property: "og:description",
        content: "Campaign status, next actions and budget versus actual spend in one view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const STATUSES: CampaignStatus[] = ["planned", "active", "paused", "completed"];

const statusTone: Record<CampaignStatus, "neutral" | "info" | "attention" | "positive"> = {
  planned: "neutral",
  active: "info",
  paused: "attention",
  completed: "positive",
};

const campaignSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a campaign name"),
    channel: z.string().trim().optional(),
    status: z.enum(["planned", "active", "paused", "completed"]),
    accountId: z.string().optional(),
    ownerId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    nextAction: z.string().trim().optional(),
    nextActionDate: z.string().optional(),
    leadSource: z.string().trim().optional(),
    leadsCount: z.coerce.number().int().min(0, "Leads cannot be negative"),
    plannedCost: z.coerce.number().min(0, "Planned cost cannot be negative"),
    spentCost: z.coerce.number().min(0, "Spent cost cannot be negative"),
    notes: z.string().trim().optional(),
  })
  .refine((values) => !values.startDate || !values.endDate || values.endDate >= values.startDate, {
    path: ["endDate"],
    message: "The end date must be on or after the start date",
  });

type CampaignFormValues = z.input<typeof campaignSchema>;

const EMPTY_FORM: CampaignFormValues = {
  name: "",
  channel: "",
  status: "planned",
  accountId: "none",
  ownerId: "none",
  startDate: "",
  endDate: "",
  nextAction: "",
  nextActionDate: "",
  leadSource: "",
  leadsCount: 0,
  plannedCost: 0,
  spentCost: 0,
  notes: "",
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CampaignsPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: campaigns, isLoading } = useCampaigns(workspaceId);
  const { data: tasks } = useWorkspaceTasks(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: campaignQuotes } = useCampaignQuotes(workspaceId);

  const createCampaign = useCreateCampaign(workspaceId);
  const updateCampaign = useUpdateCampaign(workspaceId);
  const deleteCampaign = useDeleteCampaign(workspaceId);
  const setTaskCampaign = useSetTaskCampaign(workspaceId);

  const [view, setView] = useState<"tracker" | "budget" | "channels">("tracker");
  const [tab, setTab] = useState<"all" | CampaignStatus>("all");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const { client: accountFilter } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setAccountFilter = (value: string) => {
    void navigate({ search: (prev) => ({ ...prev, client: value }) });
  };
  const [panel, setPanel] = useState<{ mode: "create" } | { mode: "edit"; id: string } | null>(
    null,
  );
  const [taskToLink, setTaskToLink] = useState("");

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: EMPTY_FORM,
  });

  const editing = useMemo(
    () => (panel?.mode === "edit" ? (campaigns ?? []).find((c) => c.id === panel.id) : undefined),
    [panel, campaigns],
  );

  useEffect(() => {
    if (!panel) return;
    if (panel.mode === "create") {
      form.reset(EMPTY_FORM);
      return;
    }
    if (!editing) return;
    form.reset({
      name: editing.name,
      channel: editing.channel ?? "",
      status: (editing.status as CampaignStatus) ?? "planned",
      accountId: editing.account_id ?? "none",
      ownerId: editing.owner_id ?? "none",
      startDate: editing.start_date ?? "",
      endDate: editing.end_date ?? "",
      nextAction: editing.next_action ?? "",
      nextActionDate: editing.next_action_date ?? "",
      leadSource: editing.lead_source ?? "",
      leadsCount: Number(editing.leads_count ?? 0),
      plannedCost: Number(editing.planned_cost ?? 0),
      spentCost: Number(editing.spent_cost ?? 0),
      notes: editing.notes ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel?.mode, editing?.id]);

  const memberName = (id: string | null) =>
    members?.find((member) => member.userId === id)?.name ?? "Unassigned";
  const accountName = (id: string | null) =>
    id ? (accounts?.find((account) => account.id === id)?.name ?? null) : null;

  const tasksByCampaign = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const task of tasks ?? []) {
      if (!task.campaign_id) continue;
      const entry = map.get(task.campaign_id) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (task.status === "done") entry.done += 1;
      map.set(task.campaign_id, entry);
    }
    return map;
  }, [tasks]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (campaigns ?? []).filter((campaign) => {
      if (tab !== "all" && campaign.status !== tab) return false;
      if (ownerFilter !== "all" && campaign.owner_id !== ownerFilter) return false;
      if (accountFilter === "unassigned" && campaign.account_id !== null) return false;
      if (
        accountFilter !== "all" &&
        accountFilter !== "unassigned" &&
        campaign.account_id !== accountFilter
      )
        return false;
      if (!term) return true;
      return (
        campaign.name.toLowerCase().includes(term) ||
        (campaign.channel ?? "").toLowerCase().includes(term) ||
        (campaign.lead_source ?? "").toLowerCase().includes(term) ||
        (campaign.next_action ?? "").toLowerCase().includes(term) ||
        (accountName(campaign.account_id) ?? "").toLowerCase().includes(term)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, accounts, tab, ownerFilter, accountFilter, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (sum, campaign) => ({
        planned: sum.planned + Number(campaign.planned_cost ?? 0),
        spent: sum.spent + Number(campaign.spent_cost ?? 0),
      }),
      { planned: 0, spent: 0 },
    );
  }, [filtered]);

  const quotesByCampaign = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    for (const quote of campaignQuotes ?? []) {
      if (!quote.campaign_id) continue;
      const value = (quote.quote_line_items ?? []).reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
        0,
      );
      const entry = map.get(quote.campaign_id) ?? { count: 0, value: 0 };
      entry.count += 1;
      entry.value += value;
      map.set(quote.campaign_id, entry);
    }
    return map;
  }, [campaignQuotes]);

  const channelRows = useMemo(() => {
    const map = new Map<
      string,
      {
        source: string;
        campaigns: number;
        leads: number;
        quotes: number;
        value: number;
        spent: number;
      }
    >();
    for (const campaign of filtered) {
      const source = campaign.lead_source?.trim() || "No source set";
      const row = map.get(source) ?? {
        source,
        campaigns: 0,
        leads: 0,
        quotes: 0,
        value: 0,
        spent: 0,
      };
      const quotes = quotesByCampaign.get(campaign.id);
      row.campaigns += 1;
      row.leads += Number(campaign.leads_count ?? 0);
      row.quotes += quotes?.count ?? 0;
      row.value += quotes?.value ?? 0;
      row.spent += Number(campaign.spent_cost ?? 0);
      map.set(source, row);
    }
    return [...map.values()].sort((a, b) => b.leads - a.leads || b.quotes - a.quotes);
  }, [filtered, quotesByCampaign]);

  const channelTotals = useMemo(
    () =>
      channelRows.reduce(
        (sum, row) => ({
          leads: sum.leads + row.leads,
          quotes: sum.quotes + row.quotes,
          value: sum.value + row.value,
          spent: sum.spent + row.spent,
        }),
        { leads: 0, quotes: 0, value: 0, spent: 0 },
      ),
    [channelRows],
  );

  const leadSourceSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const campaign of campaigns ?? []) {
      const source = campaign.lead_source?.trim();
      if (source) set.add(source);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [campaigns]);

  const linkedTasks = useMemo(
    () => (tasks ?? []).filter((task) => editing && task.campaign_id === editing.id),
    [tasks, editing],
  );
  const unlinkedTasks = useMemo(() => (tasks ?? []).filter((task) => !task.campaign_id), [tasks]);

  async function onSubmit(values: CampaignFormValues) {
    const parsed = campaignSchema.parse(values);
    const payload = {
      name: parsed.name,
      channel: parsed.channel || null,
      status: parsed.status,
      account_id: parsed.accountId && parsed.accountId !== "none" ? parsed.accountId : null,
      owner_id: parsed.ownerId && parsed.ownerId !== "none" ? parsed.ownerId : null,
      start_date: parsed.startDate || null,
      end_date: parsed.endDate || null,
      next_action: parsed.nextAction || null,
      next_action_date: parsed.nextActionDate || null,
      lead_source: parsed.leadSource || null,
      leads_count: parsed.leadsCount,
      planned_cost: parsed.plannedCost,
      spent_cost: parsed.spentCost,
      notes: parsed.notes || null,
    };
    try {
      if (panel?.mode === "edit") {
        await updateCampaign.mutateAsync({ id: panel.id, ...payload });
        toast.success("Campaign updated");
      } else {
        await createCampaign.mutateAsync(payload);
        toast.success("Campaign created");
        setPanel(null);
      }
    } catch (error) {
      toast.error("Couldn't save the campaign", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success("Campaign removed");
      setPanel(null);
    } catch (error) {
      toast.error("Couldn't remove the campaign", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleLinkTask() {
    if (!taskToLink || panel?.mode !== "edit") return;
    try {
      await setTaskCampaign.mutateAsync({ taskId: taskToLink, campaignId: panel.id });
      setTaskToLink("");
      toast.success("Task linked to this campaign");
    } catch (error) {
      toast.error("Couldn't link the task", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleUnlinkTask(taskId: string) {
    try {
      await setTaskCampaign.mutateAsync({ taskId, campaignId: null });
      toast.success("Task unlinked");
    } catch (error) {
      toast.error("Couldn't unlink the task", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const saving = createCampaign.isPending || updateCampaign.isPending;

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Campaigns"
        description="Status, dates, the person on it, the next action and what it costs."
        actions={
          <div className="flex items-center gap-3">
            <SegmentedControl
              ariaLabel="Campaign view"
              value={view}
              onValueChange={setView}
              options={[
                { value: "tracker", label: "Tracker" },
                { value: "budget", label: "Budget" },
                { value: "channels", label: "Channels" },
              ]}
            />
            <Button onClick={() => setPanel({ mode: "create" })}>New campaign</Button>
          </div>
        }
      />

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <UnderlineTabs
            ariaLabel="Campaign status filters"
            value={tab}
            onValueChange={setTab}
            options={[
              { value: "all" as const, label: "All", count: campaigns?.length ?? 0 },
              ...STATUSES.map((status) => ({
                value: status,
                label: status.charAt(0).toUpperCase() + status.slice(1),
                count: (campaigns ?? []).filter((c) => c.status === status).length,
              })),
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
                placeholder="Search campaigns..."
                aria-label="Search campaigns"
                className="h-11 bg-card pl-9"
              />
            </div>
            <FilterCombobox
              value={ownerFilter}
              onValueChange={setOwnerFilter}
              icon={Users}
              ariaLabel="Filter by assigned person"
              placeholder="Everyone"
              searchPlaceholder="Search people..."
              emptyLabel="No one found."
              options={[
                { value: "all", label: "Everyone" },
                ...(members ?? []).map((member) => ({
                  value: member.userId,
                  label: member.name,
                  avatarName: member.name,
                })),
              ]}
            />
            <FilterCombobox
              value={accountFilter}
              onValueChange={setAccountFilter}
              icon={Building2}
              ariaLabel="Filter by client"
              placeholder="All clients"
              searchPlaceholder="Search clients..."
              emptyLabel="No client found."
              options={[
                { value: "all", label: "All clients" },
                { value: "unassigned", label: "No client yet" },
                ...(accounts ?? []).map((account) => ({
                  value: account.id,
                  label: account.name,
                })),
              ]}
            />
          </Toolbar>

          {view === "budget" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricTile label="Planned budget" value={currency.format(totals.planned)} />
              <MetricTile label="Spent so far" value={currency.format(totals.spent)} />
              <MetricTile
                label={totals.spent > totals.planned ? "Over budget" : "Left to spend"}
                value={currency.format(Math.abs(totals.planned - totals.spent))}
                hint={
                  totals.planned > 0
                    ? `${Math.round((totals.spent / totals.planned) * 100)}% of plan used`
                    : "No planned budget captured yet"
                }
              />
            </div>
          ) : null}

          {view === "channels" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricTile label="Leads logged" value={String(channelTotals.leads)} />
              <MetricTile label="Quotes from campaigns" value={String(channelTotals.quotes)} />
              <MetricTile
                label="Leads that became a quote"
                value={
                  channelTotals.leads > 0
                    ? `${Math.round((channelTotals.quotes / channelTotals.leads) * 100)}%`
                    : "0%"
                }
                hint="Link a quote to its campaign when you create it."
              />
            </div>
          ) : null}

          {isLoading ? (
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
          ) : filtered.length === 0 ? (
            <Panel>
              <EmptyState
                icon={Megaphone}
                title="No campaigns yet"
                description="Add a campaign to track its status, dates, owner, next action and budget."
                action={<Button onClick={() => setPanel({ mode: "create" })}>New campaign</Button>}
              />
            </Panel>
          ) : view === "tracker" ? (
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Campaign tracker"
                description="Select a row to update the campaign or link tasks to it."
              />
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full min-w-[56rem] text-sm">
                  <thead className="bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Campaign</th>
                      <th className="px-5 py-3">Lead source</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Dates</th>
                      <th className="px-5 py-3">Assigned</th>
                      <th className="px-5 py-3">Next action</th>
                      <th className="px-5 py-3">Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((campaign) => {
                      const taskCount = tasksByCampaign.get(campaign.id);
                      return (
                        <tr
                          key={campaign.id}
                          className="cursor-pointer border-t border-border/70 transition-colors hover:bg-muted/40"
                          onClick={() => setPanel({ mode: "edit", id: campaign.id })}
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              className="text-left font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPanel({ mode: "edit", id: campaign.id });
                              }}
                            >
                              {campaign.name}
                            </button>
                            <p className="text-xs text-muted-foreground">
                              {[campaign.channel, accountName(campaign.account_id)]
                                .filter(Boolean)
                                .join(" · ") || "No channel set"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-foreground">{campaign.lead_source ?? "Not set"}</p>
                            <p className="text-xs text-muted-foreground">
                              {Number(campaign.leads_count ?? 0)} leads ·{" "}
                              {quotesByCampaign.get(campaign.id)?.count ?? 0} quotes
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill
                              label={campaign.status}
                              tone={statusTone[campaign.status as CampaignStatus] ?? "neutral"}
                            />
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {formatDate(campaign.start_date) ?? "No start"} to{" "}
                            {formatDate(campaign.end_date) ?? "no end"}
                          </td>
                          <td className="px-5 py-4">{memberName(campaign.owner_id)}</td>
                          <td className="px-5 py-4">
                            <p className="text-foreground">{campaign.next_action ?? "Not set"}</p>
                            {campaign.next_action_date ? (
                              <p className="text-xs text-muted-foreground">
                                Due {formatDate(campaign.next_action_date)}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-muted-foreground">
                            {taskCount ? `${taskCount.done} of ${taskCount.total} done` : "None"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : view === "channels" ? (
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Leads by source"
                description="How many logged leads from each source turned into a quote."
              />
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full min-w-[52rem] text-sm">
                  <thead className="bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Lead source</th>
                      <th className="px-5 py-3 text-right">Campaigns</th>
                      <th className="px-5 py-3 text-right">Leads</th>
                      <th className="px-5 py-3 text-right">Quotes</th>
                      <th className="px-5 py-3 text-right">Quote value</th>
                      <th className="w-56 px-5 py-3">Leads to quotes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelRows.map((row) => {
                      const rate = row.leads > 0 ? (row.quotes / row.leads) * 100 : 0;
                      return (
                        <tr key={row.source} className="border-t border-border/70">
                          <td className="px-5 py-4 font-medium text-foreground">{row.source}</td>
                          <td className="px-5 py-4 text-right tabular-nums">{row.campaigns}</td>
                          <td className="px-5 py-4 text-right tabular-nums">{row.leads}</td>
                          <td className="px-5 py-4 text-right tabular-nums">{row.quotes}</td>
                          <td className="px-5 py-4 text-right tabular-nums">
                            {currency.format(row.value)}
                          </td>
                          <td className="px-5 py-4">
                            {row.leads > 0 ? (
                              <ProgressMeter
                                value={Math.min(rate, 100)}
                                label={`Leads that became a quote from ${row.source}`}
                                tone="info"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No leads logged yet
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/30 font-medium">
                      <td className="px-5 py-4">Total</td>
                      <td className="px-5 py-4 text-right tabular-nums">{filtered.length}</td>
                      <td className="px-5 py-4 text-right tabular-nums">{channelTotals.leads}</td>
                      <td className="px-5 py-4 text-right tabular-nums">{channelTotals.quotes}</td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        {currency.format(channelTotals.value)}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {channelTotals.leads > 0
                          ? `${Math.round((channelTotals.quotes / channelTotals.leads) * 100)}% overall`
                          : "No leads logged yet"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Panel>
          ) : (
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Budget versus actual"
                description="Planned cost against what has been spent on each campaign."
              />
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full min-w-[52rem] text-sm">
                  <thead className="bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Campaign</th>
                      <th className="px-5 py-3 text-right">Planned</th>
                      <th className="px-5 py-3 text-right">Spent</th>
                      <th className="px-5 py-3 text-right">Difference</th>
                      <th className="w-64 px-5 py-3">Budget used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((campaign) => {
                      const planned = Number(campaign.planned_cost ?? 0);
                      const spent = Number(campaign.spent_cost ?? 0);
                      const difference = planned - spent;
                      const used = planned > 0 ? (spent / planned) * 100 : spent > 0 ? 100 : 0;
                      return (
                        <tr
                          key={campaign.id}
                          className="cursor-pointer border-t border-border/70 transition-colors hover:bg-muted/40"
                          onClick={() => setPanel({ mode: "edit", id: campaign.id })}
                        >
                          <td className="px-5 py-4 font-medium text-foreground">{campaign.name}</td>
                          <td className="px-5 py-4 text-right tabular-nums">
                            {currency.format(planned)}
                          </td>
                          <td className="px-5 py-4 text-right tabular-nums">
                            {currency.format(spent)}
                          </td>
                          <td
                            className={cn(
                              "px-5 py-4 text-right tabular-nums font-medium",
                              difference < 0 ? "text-danger" : "text-foreground",
                            )}
                          >
                            {currency.format(difference)}
                          </td>
                          <td className="px-5 py-4">
                            <ProgressMeter
                              value={used}
                              label={`Budget used on ${campaign.name}`}
                              tone={spent > planned ? "critical" : "info"}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/30 font-medium">
                      <td className="px-5 py-4">Total</td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        {currency.format(totals.planned)}
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        {currency.format(totals.spent)}
                      </td>
                      <td
                        className={cn(
                          "px-5 py-4 text-right tabular-nums",
                          totals.planned - totals.spent < 0 ? "text-danger" : "text-foreground",
                        )}
                      >
                        {currency.format(totals.planned - totals.spent)}
                      </td>
                      <td className="px-5 py-4" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Panel>
          )}
        </div>

        {panel ? (
          <Panel className="w-full shrink-0 self-start p-6 xl:w-[26rem]">
            <PanelTitleBar
              title={panel.mode === "edit" ? "Edit campaign" : "New campaign"}
              description={
                panel.mode === "edit"
                  ? "Update the plan, the next action and the spend."
                  : "Capture the campaign, who owns it and what it should cost."
              }
              onClose={() => setPanel(null)}
              closeLabel="Close campaign panel"
            />

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <PanelSection>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-name">Campaign name</Label>
                  <Input id="campaign-name" {...form.register("name")} />
                  {form.formState.errors.name ? (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-channel">Channel</Label>
                  <Input
                    id="campaign-channel"
                    placeholder="Email, cold calling, paid social"
                    {...form.register("channel")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) =>
                      form.setValue("status", value as CampaignStatus, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger id="campaign-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-account">Client</Label>
                  <Select
                    value={form.watch("accountId") || "none"}
                    onValueChange={(value) =>
                      form.setValue("accountId", value, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger id="campaign-account">
                      <SelectValue placeholder="No client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {(accounts ?? []).map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PanelSection>

              <PanelSection>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-owner">Assigned to</Label>
                  <Select
                    value={form.watch("ownerId") || "none"}
                    onValueChange={(value) =>
                      form.setValue("ownerId", value, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger id="campaign-owner">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {(members ?? []).map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-start">Start date</Label>
                    <Input id="campaign-start" type="date" {...form.register("startDate")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-end">End date</Label>
                    <Input id="campaign-end" type="date" {...form.register("endDate")} />
                    {form.formState.errors.endDate ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.endDate.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </PanelSection>

              <PanelSection>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-next-action">Next action</Label>
                  <Input
                    id="campaign-next-action"
                    placeholder="Send the follow up list"
                    {...form.register("nextAction")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-next-date">Next action date</Label>
                  <Input id="campaign-next-date" type="date" {...form.register("nextActionDate")} />
                </div>
              </PanelSection>

              <PanelSection>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-lead-source">Lead source</Label>
                  <Input
                    id="campaign-lead-source"
                    list="campaign-lead-sources"
                    placeholder="Referral, LinkedIn, Google, walk in"
                    {...form.register("leadSource")}
                  />
                  <datalist id="campaign-lead-sources">
                    {leadSourceSuggestions.map((source) => (
                      <option key={source} value={source} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">
                    Where the leads came from. The Channels view groups on this.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-leads">Leads captured</Label>
                  <Input
                    id="campaign-leads"
                    type="number"
                    min={0}
                    step="1"
                    {...form.register("leadsCount")}
                  />
                  {form.formState.errors.leadsCount ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.leadsCount.message}
                    </p>
                  ) : null}
                  {panel.mode === "edit" ? (
                    <p className="text-xs text-muted-foreground">
                      {quotesByCampaign.get(panel.id)?.count ?? 0} of these became a quote.
                    </p>
                  ) : null}
                </div>
              </PanelSection>

              <PanelSection>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-planned">Planned cost (ZAR)</Label>
                    <Input
                      id="campaign-planned"
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("plannedCost")}
                    />
                    {form.formState.errors.plannedCost ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.plannedCost.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-spent">Spent to date (ZAR)</Label>
                    <Input
                      id="campaign-spent"
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("spentCost")}
                    />
                    {form.formState.errors.spentCost ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.spentCost.message}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-notes">Notes</Label>
                  <Textarea id="campaign-notes" rows={3} {...form.register("notes")} />
                </div>
              </PanelSection>

              {panel.mode === "edit" ? (
                <PanelSection>
                  <div>
                    <p className="text-sm font-medium text-foreground">Linked tasks</p>
                    <p className="text-xs text-muted-foreground">
                      Work from the task list that belongs to this campaign.
                    </p>
                  </div>

                  {linkedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks linked yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {linkedTasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">{task.title}</p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {task.status.replace("_", " ")}
                              {task.due_date ? ` · due ${formatDate(task.due_date)}` : ""}
                            </p>
                          </div>
                          <UtilityIconButton
                            icon={<Trash2 className="size-4" />}
                            label={`Unlink ${task.title}`}
                            danger
                            onClick={() => handleUnlinkTask(task.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="campaign-link-task">Link an existing task</Label>
                    <div className="flex items-center gap-2">
                      <Select value={taskToLink} onValueChange={setTaskToLink}>
                        <SelectTrigger id="campaign-link-task" className="flex-1">
                          <SelectValue
                            placeholder={
                              unlinkedTasks.length === 0 ? "No unlinked tasks" : "Choose a task"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {unlinkedTasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLinkTask}
                        disabled={!taskToLink || setTaskCampaign.isPending}
                      >
                        <Link2 className="size-4" aria-hidden="true" />
                        Link
                      </Button>
                    </div>
                  </div>
                </PanelSection>
              ) : null}

              <PanelFooter>
                {panel.mode === "edit" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mr-auto text-destructive hover:text-destructive"
                    onClick={() => handleDelete(panel.id)}
                    disabled={deleteCampaign.isPending}
                  >
                    Remove
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => setPanel(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <LoadingIndicator size="sm" label="Saving" />
                  ) : panel.mode === "edit" ? (
                    "Save changes"
                  ) : (
                    "Create campaign"
                  )}
                </Button>
              </PanelFooter>
            </form>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
