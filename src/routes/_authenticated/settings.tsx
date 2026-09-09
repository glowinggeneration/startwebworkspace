import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useUpdateProfileName } from "@/hooks/use-profile";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useHasWorkspaceRole } from "@/hooks/use-workspace-role";
import { AvatarCircles } from "@/components/vendor/magicui/avatar-circles";
import { AvatarLabelGroup } from "@/components/application/shell/avatar-label-group";
import { UtilityIconButton } from "@/components/application/shell/utility-icon-button";
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

      <ProfileCard />

      <div className="card-surface p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="type-section">Team</h2>
          {members && members.length > 0 ? (
            <AvatarCircles
              size="sm"
              avatars={members.slice(0, 5).map((member) => ({ name: member.name }))}
              numPeople={Math.max(members.length - 5, 0)}
            />
          ) : null}
        </div>
        {membersLoading && <div className="h-16 animate-pulse rounded-xl bg-muted" />}
        <ul className="space-y-2">
          {members?.map((member) => (
            <li
              key={member.userId}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50"
            >
              <AvatarLabelGroup
                size="sm"
                title={member.name}
                subtitle={member.email ?? undefined}
              />
              <span className="type-meta shrink-0 rounded-full bg-secondary px-2 py-0.5 capitalize text-secondary-foreground">
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
                  <UtilityIconButton
                    label="Copy invite link"
                    icon={<Copy className="size-4" aria-hidden="true" />}
                    onClick={() => copyInviteLink(invitation.token)}
                  />
                  <UtilityIconButton
                    label="Revoke invitation"
                    danger
                    icon={<X className="size-4" aria-hidden="true" />}
                    onClick={() => revokeInvitation.mutate(invitation.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProfileCard() {
  const { data: profile, isLoading } = useProfile();
  const updateName = useUpdateProfileName();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error("Enter your name");
      return;
    }
    try {
      await updateName.mutateAsync(trimmed);
      toast.success("Name updated");
    } catch (error) {
      toast.error("Couldn't save your name", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="card-surface p-5">
      <h2 className="type-section mb-3">Your profile</h2>
      {isLoading ? (
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Display name</Label>
            <Input
              id="profile-name"
              className="w-64"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              className="w-64"
              value={profile?.email ?? ""}
              readOnly
              disabled
            />
          </div>
          <Button type="submit" variant="outline" disabled={updateName.isPending}>
            {updateName.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      )}
    </div>
  );
}
