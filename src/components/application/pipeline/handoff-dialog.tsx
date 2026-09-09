import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useDealHandoff, useUpdateHandoff } from "@/hooks/use-deal-handoffs";

interface HandoffFormValues {
  scope: string;
  loginsNote: string;
  signedDocumentUrl: string;
}

/**
 * Opens the moment a deal is marked won — matches the sales-ops brief
 * (docs/sales-ops/PIPELINE_REQUIREMENTS.md #11): delivery needs the scope,
 * any logins/access, and what was actually signed, the same day.
 */
export function HandoffDialog({
  dealId,
  onOpenChange,
}: {
  dealId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { workspaceId } = useActiveWorkspace();
  const { data: handoff } = useDealHandoff(workspaceId, dealId ?? "");
  const updateHandoff = useUpdateHandoff(workspaceId, dealId ?? "");

  const form = useForm<HandoffFormValues>({
    defaultValues: { scope: "", loginsNote: "", signedDocumentUrl: "" },
  });

  useEffect(() => {
    if (handoff) {
      form.reset({
        scope: handoff.scope ?? "",
        loginsNote: handoff.logins_note ?? "",
        signedDocumentUrl: handoff.signed_document_url ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff?.id]);

  async function onSubmit(values: HandoffFormValues) {
    try {
      await updateHandoff.mutateAsync({
        scope: values.scope || null,
        logins_note: values.loginsNote || null,
        signed_document_url: values.signedDocumentUrl || null,
      });
      toast.success("Handoff sent to delivery");
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't save the handoff", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={dealId !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hand off to delivery</DialogTitle>
          <DialogDescription>
            A project was created automatically. Give delivery what they need for a same-day
            acknowledgement. You can always come back and fill this in later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Textarea
              id="scope"
              rows={3}
              placeholder="What was sold, in plain language"
              {...form.register("scope")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logins">Logins / access delivery will need</Label>
            <Textarea id="logins" rows={2} {...form.register("loginsNote")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signed-doc">Link to what they signed</Label>
            <Input id="signed-doc" placeholder="https://" {...form.register("signedDocumentUrl")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateHandoff.isPending}>
              {updateHandoff.isPending ? "Saving…" : "Send handoff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
