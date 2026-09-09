import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TaskAssigneePicker } from "@/components/application/projects/task-assignee-picker";
import type { TaskStatus } from "@/integrations/supabase/app-types";

interface TaskRowProps {
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  assignedUserIds: string[];
  onToggleDone: (done: boolean) => void;
  onAssigneesChange: (userIds: string[]) => void;
}

export function TaskRow({
  title,
  status,
  dueDate,
  assignedUserIds,
  onToggleDone,
  onAssigneesChange,
}: TaskRowProps) {
  const isDone = status === "done";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Checkbox checked={isDone} onCheckedChange={(checked) => onToggleDone(checked === true)} />
        <div className="min-w-0">
          <p className={cn("type-body truncate", isDone && "text-muted-foreground line-through")}>
            {title}
          </p>
          {dueDate && <p className="type-meta text-muted-foreground">Due {dueDate}</p>}
        </div>
      </div>
      <TaskAssigneePicker assignedUserIds={assignedUserIds} onChange={onAssigneesChange} />
    </div>
  );
}
