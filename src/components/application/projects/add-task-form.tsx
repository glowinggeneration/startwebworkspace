import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useCreateTask } from "@/hooks/use-tasks";

export function AddTaskForm({ projectId, phaseId }: { projectId: string; phaseId: string }) {
  const { workspaceId } = useActiveWorkspace();
  const createTask = useCreateTask(workspaceId, projectId);
  const [title, setTitle] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask.mutateAsync({ phase_id: phaseId, title: title.trim() });
      setTitle("");
    } catch (error) {
      toast.error("Couldn't add the task", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task…"
        className="h-8"
      />
      <Button type="submit" size="sm" variant="outline" disabled={createTask.isPending}>
        <Plus className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
