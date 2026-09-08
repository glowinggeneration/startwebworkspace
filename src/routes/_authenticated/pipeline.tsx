import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useIndustries } from "@/hooks/use-industries";
import { usePackages } from "@/hooks/use-packages";
import { useDeals, useTransitionDealStatus, type Deal } from "@/hooks/use-deals";
import { DealCard } from "@/components/application/pipeline/deal-card";
import { NewDealDialog } from "@/components/application/pipeline/new-deal-dialog";
import { HandoffDialog } from "@/components/application/pipeline/handoff-dialog";
import type { DealStatus } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/pipeline")({
  component: PipelinePage,
});

const COLUMNS: { status: DealStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "won", label: "Won" },
  { status: "lost", label: "Lost" },
  { status: "later", label: "Later" },
];

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

function PipelinePage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: deals, isLoading } = useDeals(workspaceId);
  const { data: accounts } = useAccounts(workspaceId);
  const { data: industries } = useIndustries(workspaceId);
  const { data: packages } = usePackages(workspaceId);
  const transitionStatus = useTransitionDealStatus(workspaceId);
  const [handoffDealId, setHandoffDealId] = useState<string | null>(null);

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "Unknown account";
  const industryName = (id: string | null) => industries?.find((i) => i.id === id)?.name ?? null;
  const packageName = (id: string | null) => packages?.find((p) => p.id === id)?.name ?? null;

  async function handleStatusChange(deal: Deal, status: DealStatus) {
    try {
      await transitionStatus.mutateAsync(deal.id, status);
      if (status === "won") {
        toast.success("Deal marked won — a project was created");
        // The status-update transaction runs the won-deal trigger
        // synchronously, so the handoff row already exists by the time
        // this dialog's query fires.
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
    <div className="section-stack p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-display">Pipeline</h1>
          <p className="type-body text-muted-foreground">
            Every open row needs a next step and a next date — that's what makes it a real deal.
          </p>
        </div>
        <NewDealDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.status} className="space-y-3">
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnDeals = (deals ?? []).filter((deal) => deal.status === column.status);
            const columnTotal = columnDeals.reduce((sum, deal) => sum + deal.value, 0);
            return (
              <div key={column.status} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="type-section">{column.label}</h2>
                  <span className="type-meta text-muted-foreground">
                    {columnDeals.length} · {currency.format(columnTotal)}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnDeals.length === 0 && (
                    <p className="type-meta rounded-lg border border-dashed border-border p-4 text-center text-muted-foreground">
                      Nothing here yet.
                    </p>
                  )}
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
                </div>
              </div>
            );
          })}
        </div>
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
