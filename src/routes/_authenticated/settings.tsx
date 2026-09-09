import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useHasWorkspaceRole } from "@/hooks/use-workspace-role";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { useInvitations, useRevokeInvitation } from "@/hooks/use-invitations";
import { InviteDialog } from "@/components/application/settings/invite-dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { workspaceId, workspaceName } = useActiveWorkspace();
  const canManageMembers = useHasWorkspaceRole(["owner", "admin"]);
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(workspaceId);
  const { data: invitations } = useInvitations(workspaceId);
  const revokeInvitation = useRevokeInvitation(workspaceId);

  const pendingInvitations = invitations?.filter((invitation) => !invitation.accepted_at) ?? [];

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Invite link copied"))
      .catch(() => toast.error("Couldn't copy the link"));
  }

  return (
    <div className="section-stack p-8">
      <div>
        <h1 className="type-display">{workspaceName}</h1>
        <p className="type-body text-muted-foreground">
          Workspace members and pending invitations.
        </p>
      </div>

      <div className="card-surface p-5">
        <h2 className="type-section mb-3">Team</h2>
        {membersLoading && <div className="h-16 animate-pulse rounded-xl bg-muted" />}
        <ul className="space-y-2">
          {members?.map((member) => (
            <li key={member.userId} className="flex items-center justify-between">
              <span className="type-body">{member.name}</span>
              <span className="type-meta rounded-full bg-secondary px-2 py-0.5 capitalize text-secondary-foreground">
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {canManageMembers && (
        <div className="card-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="type-section">Invitations</h2>
            <InviteDialog />
          </div>
          {pendingInvitations.length === 0 && (
            <p className="type-body text-muted-foreground">No pending invitations.</p>
          )}
          <ul className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="type-body">{invitation.email}</span>{" "}
                  <span className="type-meta capitalize text-muted-foreground">
                    ({invitation.role})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyInviteLink(invitation.token)}
                    aria-label="Copy invite link"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => revokeInvitation.mutate(invitation.id)}
                    aria-label="Revoke invitation"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
