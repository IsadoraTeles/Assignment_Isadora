import { Badge } from "@/components/ui/badge";
import { getStatusVisual } from "@/lib/status";
import type { RunStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: RunStatus;
  className?: string;
}

/**
 * Status indicator = icon + text + colour, never colour alone.
 * aria-label restates the status so screen readers don't rely on the icon.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, role, Icon } = getStatusVisual(status);
  return (
    <Badge
      variant={role}
      className={cn("shrink-0", className)}
      aria-label={`Status: ${label}`}
    >
      {/* Icon is decorative; the visible text + aria-label carry the meaning. */}
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}
