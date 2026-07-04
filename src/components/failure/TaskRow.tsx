/**
 * TaskRow — one stopped task as evidence: an outlined status pill, the tool that
 * ran, its exit signal, and the full process path (mono) the claim is grounded in.
 * Handles the INT_MAX "no exit recorded" sentinel that aborted tasks carry.
 */
import type { Task } from "@/lib/types";
import {
  formatExit,
  processLeaf,
  taskStatusLabel,
  taskStatusRole,
  wasRetried,
} from "@/lib/tasks";

const PILL_CLASS: Record<string, string> = {
  danger: "text-danger-text",
  muted: "text-muted-text",
  success: "text-success-text",
  primary: "text-primary-text",
};

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  const role = taskStatusRole(task.status);
  const exit = formatExit(task.exit);
  const detail = [
    processLeaf(task.process),
    exit ? `exit ${exit}` : "no exit recorded",
    wasRetried(task) ? "retried" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-sm border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span
          className={`rounded-full border border-current px-2 py-0.5 text-[11px] ${PILL_CLASS[role]}`}
        >
          {taskStatusLabel(task.status)}
        </span>
        <span className="min-w-0 truncate">{detail}</span>
      </div>
      <p className="mt-1.5 truncate font-mono text-[11px] text-muted-text">
        {task.process} (task {task.taskId})
      </p>
    </div>
  );
}
