import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useRecordPayment } from "@/hooks/use-payments";

export function RecordPaymentDialog({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const { workspaceId } = useActiveWorkspace();
  const recordPayment = useRecordPayment(workspaceId, invoiceId);

  const [amount, setAmount] = useState(0);
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("");

  async function handleSubmit() {
    if (amount <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    try {
      await recordPayment.mutateAsync({ amount, paidAt, method: method || null });
      toast.success("Payment recorded");
      setAmount(0);
      setMethod("");
      setOpen(false);
    } catch (error) {
      toast.error("Couldn't record the payment", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Amount (ZAR)</Label>
            <Input
              type="number"
              min={0}
              step={100}
              value={amount}
              onChange={(event) => setAmount(event.target.valueAsNumber || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date paid</Label>
            <Input type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Method (optional)</Label>
            <Input
              placeholder="EFT, card, cash…"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={recordPayment.isPending}>
            {recordPayment.isPending ? "Saving…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
