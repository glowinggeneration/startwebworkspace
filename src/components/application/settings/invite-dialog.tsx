import { useState } from "react";
import { UserPlus } from "lucide-react";
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
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useCreateInvitation } from "@/hooks/use-invitations";
import type { WorkspaceRole } from "@/integrations/supabase/app-types";

const ASSIGNABLE_ROLES: WorkspaceRole[] = ["admin", "sales", "pm", "member", "client"];

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const { workspaceId } = useActiveWorkspace();
  const { data: accounts } = useAccounts(workspaceId);
  const createInvitation = useCreateInvitation(workspaceId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [clientAccountId, setClientAccountId] = useState("");

  async function handleSubmit() {
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    if (role === "client" && !clientAccountId) {
      toast.error("A client invite needs an account to scope them to");
      return;
    }
    try {
      const invitation = await createInvitation.mutateAsync({
        email,
        role,
        clientAccountId: role === "client" ? clientAccountId : null,
      });
      const link = `${window.location.origin}/invite/${invitation.token}`;
      await navigator.clipboard.writeText(link).catch(() => {});
      toast.success("Invitation created", {
        description: "The invite link was copied to your clipboard.",
      });
      setEmail("");
      setRole("member");
      setClientAccountId("");
      setOpen(false);
    } catch (error) {
      toast.error("Couldn't create the invitation", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" aria-hidden="true" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite someone to this workspace</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as WorkspaceRole)}>
              <SelectTrigger className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {role === "client" && (
            <div className="space-y-2">
              <Label>Client's account</Label>
              <Select value={clientAccountId} onValueChange={setClientAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick the account they belong to" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="type-meta text-muted-foreground">
                A client role only ever sees this account's projects, quotes and invoices.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createInvitation.isPending}>
            {createInvitation.isPending ? (
              <LoadingIndicator size="sm" label="Creating" />
            ) : (
              "Create invite link"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
