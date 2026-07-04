/**
 * shadcn/ui Badge — a small label/status pill with token-based role variants
 * (neutral / success / danger / primary / muted).
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-surface-sunk text-ink-2",
        success: "bg-success-soft text-success-text",
        danger: "bg-danger-soft text-danger-text",
        primary: "bg-primary-soft text-primary-text",
        muted: "bg-muted-soft text-muted-text",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
