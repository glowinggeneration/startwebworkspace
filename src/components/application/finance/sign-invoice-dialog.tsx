import { useState } from "react";
import { toast } from "sonner";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingIndicator } from "@/components/application/shell/loading-indicator";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useSignInvoice } from "@/hooks/use-invoices";
import type { InvoiceStatus } from "@/integrations/supabase/app-types";

/** Records who signed an invoice for the client and when. */
export function SignInvoiceDialog({
  invoiceId,
  invoiceNumber,
  status,
  defaultSigner,
}: {
  invoiceId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  defaultSigner?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { workspaceId } = useActiveWorkspace();
  const signInvoice = useSignInvoice(workspaceId);
  const [signedBy, setSignedBy] = useState(defaultSigner ?? "");
  const [signedAt, setSignedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const voided = status === "void";

  async function handleSubmit() {
    if (!signedBy.trim()) {
      toast.error("Enter who signed the invoice");
      return;
    }
    if (!signedAt) {
      toast.error("Choose the date it was signed");
      return;
    }
    try {
      await signInvoice.mutateAsync({
        id: invoiceId,
        signedBy: signedBy.trim(),
        signedAt,
        signedNote: note.trim() || null,
        currentStatus: status,
      });
      toast.success(`Invoice ${invoiceNumber} marked as signed`);
      setOpen(false);
    } catch (error) {
      toast.error("Couldn't record the signature", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={voided} title={voided ? "This invoice is void" : undefined}>
          <PenLine className="size-4" aria-hidden="true" />
          Record signature
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record the client's signature</DialogTitle>
          <DialogDescription>
            Invoice {invoiceNumber} moves to Signed and payment tracking starts.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor={`signed-by-${invoiceId}`}>Signed by</Label>
            <Input
              id={`signed-by-${invoiceId}`}
              value={signedBy}
              onChange={(event) => setSignedBy(event.target.value)}
              placeholder="Name of the person who signed"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`signed-at-${invoiceId}`}>Date signed</Label>
            <Input
              id={`signed-at-${invoiceId}`}
              type="date"
              value={signedAt}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setSignedAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`signed-note-${invoiceId}`}>Reference (optional)</Label>
            <Input
              id={`signed-note-${invoiceId}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="PO number or where the signed copy is filed"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={signInvoice.isPending}>
            {signInvoice.isPending ? (
              <LoadingIndicator size="sm" label="Saving" />
            ) : (
              "Mark as signed"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
