import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Building2, Clock, FolderOpen, Info, Search, Tag, Trophy, Users, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { formatZar } from "@/lib/sales/currency";
import type { DealStatus } from "@/integrations/supabase/app-types";

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: PipelinePage,
  head: () => ({
    meta: [
      { title: "Pipeline | Startweb" },
      { name: "description", content: "Manage deals and their next steps in your Startweb workspace." },
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
  const [handoffDealId, setHandoffDealId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
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
            { value: "board", label: "Board" },
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
            placeholder="Search deals..."
            aria-label="Search deals"
            className="h-11 bg-card pl-9"
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="h-11 w-56 bg-card" aria-label="Filter by industry">
            <Tag className="size-4 text-muted-foreground" aria-hidden="true" />
            <SelectValue placeholder="All industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            {industries?.map((industry) => (
              <SelectItem key={industry.id} value={industry.id}>
                {industry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="h-11 w-56 bg-card" aria-label="Filter by owner">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            <SelectValue placeholder="All owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {members?.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Toolbar>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.status} className="h-[32rem] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
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
                    {columnDeals.length} · {formatZar(columnTotal)}
                  </span>
                </div>
                <div className="flex-1 space-y-3 p-4">
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
                    columnDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        accountName={accountName(deal.account_id)}
                        industryName={industryName(deal.industry_id)}
                        packageName={packageName(deal.package_id)}
                        onStatusChange={(status) => handleStatusChange(deal, status)}
                      />
                    ))
                  )}
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
                  <TableCell className="text-right">{formatZar(deal.value)}</TableCell>
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
          action={
            <NewAccountDialog trigger={<Button variant="outline">Add account</Button>} />
          }
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
