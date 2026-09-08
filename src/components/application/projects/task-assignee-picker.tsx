import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";

export function TaskAssigneePicker({
  assignedUserIds,
  onChange,
}: {
  assignedUserIds: string[];
  onChange: (userIds: string[]) => void;
}) {
  const { workspaceId } = useActiveWorkspace();
  const { data: members } = useWorkspaceMembers(workspaceId);

  function toggle(userId: string, checked: boolean) {
    onChange(
      checked ? [...assignedUserIds, userId] : assignedUserIds.filter((id) => id !== userId),
    );
  }

  const assignedNames = (members ?? [])
    .filter((m) => assignedUserIds.includes(m.userId))
    .map((m) => m.name);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="size-4" aria-hidden="true" />
          {assignedNames.length > 0 ? assignedNames.join(", ") : "Assign"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-2">
          {members?.map((member) => (
            <div key={member.userId} className="flex items-center gap-2">
              <Checkbox
                id={`assignee-${member.userId}`}
                checked={assignedUserIds.includes(member.userId)}
                onCheckedChange={(checked) => toggle(member.userId, checked === true)}
              />
              <Label htmlFor={`assignee-${member.userId}`} className="type-body font-normal">
                {member.name}
              </Label>
            </div>
          ))}
          {members && members.length === 0 && (
            <p className="type-meta text-muted-foreground">No workspace members yet.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
