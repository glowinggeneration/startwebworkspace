import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock, Megaphone } from "lucide-react";
import { EmptyState, MetricTile, Panel } from "@/components/application/shell/page-parts";
import { PanelHeader, ProgressMeter, StatusPill } from "@/components/application/shell/panel-parts";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useClientBoard, lineItemsTotal, openTasks } from "@/hooks/use-client-board";
import { currency } from "@/lib/sales/currency";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
  });
}

type NextItem = {
  id: string;
  title: string;
  context: string;
  date: string | null;
  kind: "task" | "campaign";
  to: "/pipeline" | "/campaigns";
  clientId?: string;
};

/**
 * A live roll-up of the workspace: clients, campaigns, projects, tasks and
 * campaign budget, with the next actions that are due soonest.
 */
export function WorkspaceOverview() {
  const workspace = useActiveWorkspace();
  const clients = useClientBoard(workspace.workspace_id);
  const campaigns = useCampaigns(workspace.workspace_id);

  const accounts = clients.data ?? [];
  const campaignRows = campaigns.data ?? [];

  const totals = useMemo(() => {
    const projects = accounts.flatMap((account) => account.projects);
    const tasks = accounts.flatMap((account) => openTasks(account));
    const planned = campaignRows.reduce((sum, row) => sum + Number(row.planned_cost ?? 0), 0);
    const spent = campaignRows.reduce((sum, row) => sum + Number(row.spent_cost ?? 0), 0);
    const quoted = accounts.reduce(
      (sum, account) =>
        sum +
        (account.quotes ?? []).reduce(
          (inner, quote) => inner + lineItemsTotal(quote.quote_line_items ?? []),
          0,
        ),
      0,
    );
    const invoiced = accounts.reduce(
      (sum, account) =>
        sum +
        (account.invoices ?? []).reduce(
          (inner, invoice) => inner + lineItemsTotal(invoice.invoice_line_items ?? []),
          0,
        ),
      0,
    );
    return {
      clients: accounts.length,
      contacts: accounts.reduce((sum, account) => sum + account.contacts.length, 0),
      projects: projects.length,
      openProjects: projects.filter((project) => project.status !== "complete").length,
      tasks: tasks.length,
      campaigns: campaignRows.length,
      activeCampaigns: campaignRows.filter((row) => row.status === "active").length,
      planned,
      spent,
      quoted,
      invoiced,
    };
  }, [accounts, campaignRows]);

  const nextUp = useMemo(() => {
    const items: NextItem[] = [];
    for (const account of accounts) {
      for (const project of account.projects) {
        for (const task of project.tasks) {
          if (task.status === "done") continue;
          items.push({
            id: task.id,
            title: task.title,
            context: `${account.name} · ${project.name}`,
            date: task.due_date,
            kind: "task",
            to: "/pipeline",
          });
        }
      }
    }
    for (const campaign of campaignRows) {
      if (!campaign.next_action) continue;
      items.push({
        id: campaign.id,
        title: campaign.next_action,
        context: campaign.name,
        date: campaign.next_action_date,
        kind: "campaign",
        to: "/campaigns",
        clientId: campaign.account_id ?? undefined,
      });
    }
    return items
      .sort((a, b) => {
        if (a.date && b.date) return a.date.localeCompare(b.date);
        if (a.date) return -1;
        if (b.date) return 1;
        return a.title.localeCompare(b.title);
      })
      .slice(0, 8);
  }, [accounts, campaignRows]);

  if (clients.isLoading || campaigns.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (clients.isError || campaigns.isError) {
    return (
      <Panel className="p-6">
        <p className="text-sm text-destructive">
          The workspace overview could not load. Refresh the page to try again.
        </p>
      </Panel>
    );
  }

  const spendShare = totals.planned > 0 ? (totals.spent / totals.planned) * 100 : 0;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Clients"
          value={String(totals.clients)}
          hint={`${totals.contacts} contacts recorded`}
        />
        <MetricTile
          label="Projects"
          value={String(totals.projects)}
          hint={`${totals.openProjects} still open`}
        />
        <MetricTile
          label="Open tasks"
          value={String(totals.tasks)}
          hint="Next steps not yet done"
        />
        <MetricTile
          label="Campaigns"
          value={String(totals.campaigns)}
          hint={`${totals.activeCampaigns} running now`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel className="p-6 xl:col-span-1">
          <h2 className="type-section">Budget and value</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Campaign spend against plan, with quoted and invoiced value across every client.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Planned campaign budget</span>
              <span className="text-sm font-semibold text-foreground">
                {currency.format(totals.planned)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Spent so far</span>
              <span className="text-sm font-semibold text-foreground">
                {currency.format(totals.spent)}
              </span>
            </div>
            <ProgressMeter
              value={Math.min(spendShare, 100)}
              label="Campaign budget used"
              tone={spendShare > 100 ? "danger" : "info"}
            />
            <p className="text-xs text-muted-foreground">
              {totals.planned === 0
                ? "No campaign budget set yet."
                : `${Math.round(spendShare)}% of the planned budget used.`}
            </p>
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Quoted</span>
                <span className="text-sm font-semibold text-foreground">
                  {currency.format(totals.quoted)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Invoiced</span>
                <span className="text-sm font-semibold text-foreground">
                  {currency.format(totals.invoiced)}
                </span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden xl:col-span-2">
          <PanelHeader
            title="What's next"
            description="The next steps and campaign actions due soonest."
          />
          {nextUp.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nothing outstanding"
              description="Next steps you add to projects and campaigns appear here."
              className="py-14"
            />
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {nextUp.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="flex items-start justify-between gap-4 px-6 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      to={item.to}
                      {...(item.to === "/campaigns" && item.clientId
                        ? { search: { client: item.clientId } }
                        : {})}
                      className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      {item.kind === "campaign" ? (
                        <Megaphone className="size-3.5 shrink-0" aria-hidden="true" />
                      ) : null}
                      {item.context}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.date ? (
                      <StatusPill
                        label={formatDate(item.date) ?? item.date}
                        tone={item.date < today ? "danger" : "neutral"}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No date</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
