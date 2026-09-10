import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/application/shell/page-parts";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useHasWorkspaceRole } from "@/hooks/use-workspace-role";
import {
  useImportReviewItems,
  useSetImportReviewStatus,
  type ImportReviewItem,
  type ImportReviewStatus,
} from "@/hooks/use-import-review";

export const Route = createFileRoute("/_authenticated/import-review")({
  component: ImportReviewPage,
  head: () => ({
    meta: [
      { title: "Import review | Startweb Workspace" },
      {
        name: "description",
        content: "Decide on imported records that need a human check before they are used.",
      },
      { property: "og:title", content: "Import review | Startweb Workspace" },
      {
        property: "og:description",
        content: "Decide on imported records that need a human check before they are used.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ImportReviewPage() {
  const { workspaceId } = useActiveWorkspace();
  const canReview = useHasWorkspaceRole(["owner", "admin"]);
  const { data: items, isLoading } = useImportReviewItems(workspaceId);
  const setStatus = useSetImportReviewStatus(workspaceId);

  if (!canReview) {
    return (
      <div className="section-stack p-8">
        <PageHeader
          title="Import review"
          description="Only workspace owners and admins can see this list."
        />
      </div>
    );
  }

  const open = items?.filter((item) => item.status === "open") ?? [];
  const decided = items?.filter((item) => item.status !== "open") ?? [];

  function update(id: string, status: ImportReviewStatus) {
    setStatus.mutate(
      { id, status },
      {
        onError: (error) =>
          toast.error("Couldn't update this item", {
            description: error instanceof Error ? error.message : undefined,
          }),
        onSuccess: () =>
          toast.success(
            status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Reopened",
          ),
      },
    );
  }

  return (
    <div className="section-stack p-8">
      <PageHeader
        title="Import review"
        description="Imported records that need a decision before you rely on them."
      />

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : open.length === 0 && decided.length === 0 ? (
        <div className="card-surface p-5">
          <p className="type-body text-muted-foreground">
            Nothing to review. Run an import preview in Settings to see what needs checking.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <ReviewList
            heading={`Needs a decision (${open.length})`}
            items={open}
            onDecide={update}
            pending={setStatus.isPending}
          />
          {decided.length > 0 ? (
            <ReviewList
              heading={`Decided (${decided.length})`}
              items={decided}
              onDecide={update}
              pending={setStatus.isPending}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function ReviewList({
  heading,
  items,
  onDecide,
  pending,
}: {
  heading: string;
  items: ImportReviewItem[];
  onDecide: (id: string, status: ImportReviewStatus) => void;
  pending: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="card-surface p-5">
        <h2 className="type-section mb-2">{heading}</h2>
        <p className="type-body text-muted-foreground">Nothing here.</p>
      </div>
    );
  }

  return (
    <div className="card-surface p-5">
      <h2 className="type-section mb-3">{heading}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-3"
          >
            <div className="min-w-0">
              <p className="type-body font-medium">{item.issue}</p>
              <p className="type-meta text-muted-foreground">
                {item.record_type}
                {item.record_key ? ` · ${item.record_key}` : ""}
              </p>
              {item.evidence ? <p className="type-meta mt-1">{item.evidence}</p> : null}
              {item.required_decision ? (
                <p className="type-meta mt-1 text-muted-foreground">
                  Decision needed: {item.required_decision}
                </p>
              ) : null}
              {item.source_refs ? (
                <p className="type-meta mt-1 text-muted-foreground">Source: {item.source_refs}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.status === "open" ? (
                <>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => onDecide(item.id, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button disabled={pending} onClick={() => onDecide(item.id, "approved")}>
                    Approve
                  </Button>
                </>
              ) : (
                <>
                  <span className="type-meta capitalize text-muted-foreground">{item.status}</span>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => onDecide(item.id, "open")}
                  >
                    Reopen
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
