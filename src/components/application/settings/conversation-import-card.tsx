import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/application/shell/loading-indicator";
import { runConversationImport, type ImportOutcome } from "@/lib/conversation-import.functions";

/**
 * Owners and admins preview the conversation import, check the counts, then
 * commit. Committing is idempotent: rows carry an import key, so re-running
 * changes nothing.
 */
export function ConversationImportCard() {
  const runImport = useServerFn(runConversationImport);
  const [preview, setPreview] = useState<ImportOutcome | null>(null);
  const [committed, setCommitted] = useState<ImportOutcome | null>(null);
  const [pending, setPending] = useState<"preview" | "commit" | null>(null);

  async function run(dryRun: boolean) {
    setPending(dryRun ? "preview" : "commit");
    try {
      const result = await runImport({ data: { dryRun } });
      if (dryRun) {
        setPreview(result);
        setCommitted(null);
        toast.success("Preview ready");
      } else {
        setCommitted(result);
        setPreview(null);
        toast.success("Import complete");
      }
    } catch (error) {
      toast.error(dryRun ? "Couldn't build the preview" : "Couldn't finish the import", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPending(null);
    }
  }

  const shown = committed ?? preview;

  return (
    <div className="card-surface p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="type-section">Conversation import</h2>
          <p className="type-body text-muted-foreground">
            Bring the reviewed conversation records into this workspace. Preview first, then
            commit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={pending !== null} onClick={() => void run(true)}>
            {pending === "preview" ? <LoadingIndicator size="sm" label="Building preview" /> : null}
            Preview
          </Button>
          <Button
            disabled={pending !== null || preview === null}
            onClick={() => void run(false)}
            title={preview === null ? "Run a preview first" : undefined}
          >
            {pending === "commit" ? <LoadingIndicator size="sm" label="Importing" /> : null}
            Commit import
          </Button>
        </div>
      </div>

      {shown ? (
        <div className="space-y-3">
          <p className="type-meta text-muted-foreground">
            {shown.dryRun ? "Preview only, nothing saved." : "Saved to this workspace."} Source{" "}
            {shown.namespace}, as at {shown.asOf}.
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left">
              <thead className="bg-muted/50">
                <tr className="type-meta text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Records</th>
                  <th className="px-3 py-2 font-medium">New</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 font-medium">Already there</th>
                  <th className="px-3 py-2 font-medium">Left out</th>
                </tr>
              </thead>
              <tbody>
                {shown.entities.map((entity) => (
                  <tr key={entity.entity} className="type-body border-t border-border">
                    <td className="px-3 py-2">{entity.entity}</td>
                    <td className="px-3 py-2">{entity.create}</td>
                    <td className="px-3 py-2">{entity.update}</td>
                    <td className="px-3 py-2">{entity.unchanged}</td>
                    <td className="px-3 py-2">{entity.skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {shown.entities.some((entity) => entity.conflicts.length > 0) ? (
            <div className="rounded-xl border border-border p-3">
              <h3 className="type-meta mb-1 font-medium">Needs attention</h3>
              <ul className="type-meta list-disc space-y-1 pl-4 text-muted-foreground">
                {shown.entities.flatMap((entity) =>
                  entity.conflicts.map((conflict) => (
                    <li key={`${entity.entity}-${conflict}`}>
                      {entity.entity}: {conflict}
                    </li>
                  )),
                )}
              </ul>
            </div>
          ) : null}

          <Button asChild variant="outline">
            <Link to="/import-review">Open review list</Link>
          </Button>
        </div>
      ) : (
        <p className="type-body text-muted-foreground">
          No preview yet. Run a preview to see what would be added.
        </p>
      )}
    </div>
  );
}
