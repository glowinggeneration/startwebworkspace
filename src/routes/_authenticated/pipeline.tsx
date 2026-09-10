import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Building2,
  Clock,
  FolderOpen,
  Info,
  Search,
  Tag,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterCombobox } from "@/components/application/shell/filter-combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useIndustries } from "@/hooks/use-industries";
import { usePackages } from "@/hooks/use-packages";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { useDeals, useTransitionDealStatus, type Deal } from "@/hooks/use-deals";
import { DealCard } from "@/components/application/pipeline/deal-card";
import { NewDealDialog } from "@/components/application/pipeline/new-deal-dialog";
import { NewAccountDialog } from "@/components/application/accounts/new-account-dialog";
import { HandoffDialog } from "@/components/application/pipeline/handoff-dialog";
import {
  EmptyState,
  HintBar,
  PageHeader,
  Panel,
  SegmentedControl,
  Toolbar,
} from "@/components/application/shell/page-parts";
import { Button } from "@/components/ui/button";
import { AnimatedList } from "@/components/vendor/magicui/animated-list";
import { ProgressiveBlur } from "@/components/core/progressive-blur";
import { currency } from "@/lib/sales/currency";
import { useClientBoard } from "@/hooks/use-client-board";
import { ClientBoard } from "@/components/application/pipeline/client-board";
import type { DealStatus } from "@/integrations/supabase/app-types";

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: PipelinePage,
  head: () => ({
    meta: [
      { title: "Pipeline | Startweb" },
      {
        name: "description",
        content: "Manage deals and their next steps in your Startweb workspace.",
      },
      { property: "og:title", content: "Pipeline | Startweb" },
      { property: "og:description", content: "Manage deals and their next steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const COLUMNS: {
  status: DealStatus;
  label: string;
  emptyTitle: string;
  emptyBody: string;
  icon: typeof FolderOpen;
}[] = [
  {
    status: "open",
    label: "Open",
    emptyTitle: "No open deals",
    emptyBody: "Deals will appear here when you add them.",
    icon: FolderOpen,
  },
  {
    status: "won",
    label: "Won",
    emptyTitle: "No won deals",
    emptyBody: "Closed deals will appear here.",
    icon: Trophy,
  },
  {
    status: "lost",
    label: "Lost",
    emptyTitle: "No lost deals",
    emptyBody: "Deals you lose will appear here.",
    icon: XCircle,
  },
  {
    status: "later",
    label: "Later",
    emptyTitle: "No deals for later",
    emptyBody: "Deals you postpone will appear here.",
    icon: Clock,
  },
];

function PipelinePage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: deals, isLoading } = useDeals(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const { data: industries } = useIndustries(workspaceId);
  const { data: packages } = usePackages(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const transitionStatus = useTransitionDealStatus(workspaceId);
  const { data: clientAccounts, isLoading: clientsLoading } = useClientBoard(workspaceId);
  const [handoffDealId, setHandoffDealId] = useState<string | null>(null);
  const [view, setView] = useState<"clients" | "board" | "list">("clients");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "Unknown account";
  const industryName = (id: string | null) => industries?.find((i) => i.id === id)?.name ?? null;
  const packageName = (id: string | null) => packages?.find((p) => p.id === id)?.name ?? null;
  const hasAccounts = (accounts?.length ?? 0) > 0;

  const visibleDeals = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (deals ?? []).filter((deal) => {
      if (industryFilter !== "all" && deal.industry_id !== industryFilter) return false;
      if (ownerFilter !== "all" && deal.owner_id !== ownerFilter) return false;
      if (!term) return true;
      return (
        accountName(deal.account_id).toLowerCase().includes(term) ||
        (deal.next_step ?? "").toLowerCase().includes(term)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, accounts, search, industryFilter, ownerFilter]);

  const visibleClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientAccounts ?? [];
    return (clientAccounts ?? []).filter((account) =>
      [
        account.name,
        account.primary_service ?? "",
        account.relationship_status ?? "",
        ...account.contacts.map((contact) => contact.name),
        ...account.projects.map((project) => project.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [clientAccounts, search]);

  async function handleStatusChange(deal: Deal, status: DealStatus) {
    try {
      await transitionStatus.mutateAsync(deal.id, status);
      if (status === "won") {
        toast.success("Deal marked won, a project was created");
        setHandoffDealId(deal.id);
      } else {
        toast.success(`Moved to ${status}`);
      }
    } catch (error) {
      toast.error("Couldn't update the deal", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Pipeline"
        description="Manage deals and their next steps."
        actions={<NewDealDialog />}
        aside={
          hasAccounts ? undefined : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="size-4" aria-hidden="true" />
              Add an account first
            </p>
          )
        }
      />

      <Toolbar>
        <SegmentedControl
          ariaLabel="Pipeline view"
          value={view}
          onValueChange={setView}
          options={[
            { value: "clients", label: "Clients" },
            { value: "board", label: "Deals" },
            { value: "list", label: "List" },
          ]}
        />
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={view === "clients" ? "Search clients..." : "Search deals..."}
            aria-label={view === "clients" ? "Search clients" : "Search deals"}
            className="h-11 bg-card pl-9"
          />
        </div>
        <FilterCombobox
          value={industryFilter}
          onValueChange={setIndustryFilter}
          icon={Tag}
          ariaLabel="Filter by industry"
          placeholder="All industries"
          searchPlaceholder="Search industries..."
          emptyLabel="No industry found."
          options={[
            { value: "all", label: "All industries" },
            ...(industries ?? []).map((industry) => ({
              value: industry.id,
              label: industry.name,
            })),
          ]}
        />
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
      </Toolbar>

      {(view === "clients" ? clientsLoading : isLoading) ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.status} className="h-[32rem] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : view === "clients" ? (
        <ClientBoard accounts={visibleClients} />
      ) : view === "board" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnDeals = visibleDeals.filter((deal) => deal.status === column.status);
            const columnTotal = columnDeals.reduce((sum, deal) => sum + deal.value, 0);
            return (
              <Panel key={column.status} className="flex min-h-[32rem] flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold text-foreground">{column.label}</h2>
                  <span className="text-sm text-muted-foreground">
                    {columnDeals.length} · {currency.format(columnTotal)}
                  </span>
                </div>
                <div className="relative flex-1">
                  <div className="max-h-[28rem] space-y-3 overflow-y-auto p-4">
                    {columnDeals.length === 0 ? (
                      <EmptyState
                        icon={column.icon}
                        title={column.emptyTitle}
                        description={column.emptyBody}
                        className="py-14"
                        action={
                          column.status === "open" ? (
                            <NewDealDialog
                              trigger={
                                <Button>
                                  <span aria-hidden="true">+</span> Add deal
                                </Button>
                              }
                            />
                          ) : undefined
                        }
                      />
                    ) : (
                      <AnimatedList>
                        {columnDeals.map((deal) => (
                          <DealCard
                            key={deal.id}
                            deal={deal}
                            accountName={accountName(deal.account_id)}
                            industryName={industryName(deal.industry_id)}
                            packageName={packageName(deal.package_id)}
                            onStatusChange={(status) => handleStatusChange(deal, status)}
                          />
                        ))}
                      </AnimatedList>
                    )}
                  </div>
                  {columnDeals.length > 3 ? (
                    <ProgressiveBlur
                      position="bottom"
                      height="2.5rem"
                      backgroundColor="var(--card)"
                      className="rounded-b-[inherit]"
                    />
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Next step</TableHead>
                <TableHead>Next date</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{accountName(deal.account_id)}</TableCell>
                  <TableCell className="text-muted-foreground">{deal.next_step}</TableCell>
                  <TableCell className="text-muted-foreground">{deal.next_date}</TableCell>
                  <TableCell className="text-right">{currency.format(deal.value)}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{deal.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {visibleDeals.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No deals to show"
              description="Add a deal or clear the filters above."
            />
          ) : null}
        </Panel>
      )}

      {hasAccounts ? null : (
        <HintBar
          icon={Building2}
          title="Start with an account"
          description="Add a client company before creating its first deal."
          action={<NewAccountDialog trigger={<Button variant="outline">Add account</Button>} />}
        />
      )}

      <HandoffDialog
        dealId={handoffDealId}
        onOpenChange={(open) => {
          if (!open) setHandoffDealId(null);
        }}
      />
    </div>
  );
}
