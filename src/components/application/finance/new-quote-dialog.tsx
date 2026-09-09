import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/application/shell/loading-indicator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineItemsEditor,
  type LineItemDraft,
} from "@/components/application/finance/line-items-editor";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useCreateQuote } from "@/hooks/use-quotes";

export function NewQuoteDialog({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const { workspaceId } = useActiveWorkspace();
  const { data: accounts } = useAccounts(workspaceId);
  const createQuote = useCreateQuote(workspaceId);

  const [accountId, setAccountId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);

  async function handleSubmit() {
    if (!accountId) {
      toast.error("Pick an account");
      return;
    }
    try {
      const quote = await createQuote.mutateAsync({
        accountId,
        expiryDate: expiryDate || null,
        lineItems,
      });
      toast.success(`Quote ${quote.quote_number} created`);
      setAccountId("");
      setExpiryDate("");
      setLineItems([]);
      setOpen(false);
    } catch (error) {
      toast.error("Couldn't create the quote", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" aria-hidden="true" />
            New quote
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New quote</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select onValueChange={setAccountId} value={accountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry date (optional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
              />
            </div>
          </div>
          <LineItemsEditor items={lineItems} onChange={setLineItems} />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createQuote.isPending}>
            {createQuote.isPending ? (
              <LoadingIndicator size="sm" label="Creating" />
            ) : (
              "Create quote"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
