/**
 * Door — a navigational button that announces what's behind it with an
 * always-visible descriptor (not a hover tooltip, which fails for touch/keyboard/SR
 * users). Pushes the target view onto the DrillStack.
 */
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useDrill } from "./DrillStack";

interface DoorProps {
  to: string;
  title: string;
  descriptor: string;
  Icon: LucideIcon;
}

export function Door({ to, title, descriptor, Icon }: DoorProps) {
  const { push } = useDrill();
  return (
    <button
      type="button"
      onClick={() => push(to)}
      className="flex w-full items-center gap-3 rounded-md border border-border bg-bg p-3 text-left transition-colors hover:border-brand-solid hover:bg-surface"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-sunk text-ink-2">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {/* Descriptor is always visible — the door states what it opens. */}
        <span className="block text-xs text-muted-text">{descriptor}</span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-text"
        aria-hidden="true"
      />
    </button>
  );
}
