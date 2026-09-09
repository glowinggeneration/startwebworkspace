import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { AdaptiveSlider } from "@/components/vendor/collection/adaptive-slider";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { useProjects } from "@/hooks/use-projects";
import { useSetAllocation } from "@/hooks/use-resource-allocations";

/**
 * Uses the supplied Adaptive Slider as-is (see
 * docs/ui-components/COMPONENT_MAP.md) for the 0-40h allocation input —
 * its colour-by-load gradient reads naturally as "how full is this week."
 */
export function AllocationDialog({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const { workspaceId } = useActiveWorkspace();
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: projects } = useProjects(workspaceId);
  const setAllocation = useSetAllocation(workspaceId);

  const [userId, setUserId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [hours, setHours] = useState(20);

  async function handleSave() {
    if (!userId || !projectId) {
      toast.error("Pick a team member and a project");
      return;
    }
    try {
      await setAllocation.mutateAsync({ userId, projectId, allocatedHours: hours });
      toast.success("Allocation saved");
      setOpen(false);
    } catch (error) {
      toast.error("Couldn't save the allocation", {
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
            Allocate hours
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allocate hours this week</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Team member</Label>
            <Select onValueChange={setUserId} value={userId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a team member" />
              </SelectTrigger>
              <SelectContent>
                {members?.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select onValueChange={setProjectId} value={projectId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hours this week</Label>
            <div className="flex justify-center py-2">
              <AdaptiveSlider min={0} max={40} step={1} value={hours} onChange={setHours} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={setAllocation.isPending}>
            {setAllocation.isPending ? "Saving…" : "Save allocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
