import { cn } from "@/lib/utils";

/** Loading placeholder. Pulse is disabled under prefers-reduced-motion (global CSS). */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-sunk", className)}
      {...props}
    />
  );
}

export { Skeleton };
