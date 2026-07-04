/**
 * Single source of truth for turning a RunStatus into its visual language:
 * semantic role, icon, and token-based colour classes. Centralised so every
 * status indicator stays "icon + text + colour" and no component re-maps status.
 */
import {
  CheckCircle2,
  XCircle,
  Ban,
  Loader2,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { RunStatus } from "./types";

/** Semantic role a status maps to, per the token brief. */
export type StatusRole = "success" | "danger" | "primary" | "muted";

export interface StatusVisual {
  /** Human label used in badges, filters, summary. */
  label: string;
  role: StatusRole;
  Icon: LucideIcon;
  /** Badge = icon + text + colour (never colour alone). Soft bg + AA text. */
  badgeClass: string;
  /** Colour for the leading icon (solid role token, AA for large/icon use). */
  iconClass: string;
  /** Strong text colour token (AA small text). */
  textClass: string;
  /** Soft tint background token. */
  softClass: string;
}

/**
 * Status → role mapping from the brief:
 *   SUCCEEDED→success, FAILED→danger, RUNNING→primary, CANCELLED/UNKNOWN→muted.
 * SUBMITTED isn't in the data but is in the domain; treat it as muted/pending.
 */
export const STATUS_VISUALS: Record<RunStatus, StatusVisual> = {
  SUCCEEDED: {
    label: "Succeeded",
    role: "success",
    Icon: CheckCircle2,
    badgeClass: "bg-success-soft text-success-text",
    iconClass: "text-success-solid",
    textClass: "text-success-text",
    softClass: "bg-success-soft",
  },
  FAILED: {
    label: "Failed",
    role: "danger",
    Icon: XCircle,
    badgeClass: "bg-danger-soft text-danger-text",
    iconClass: "text-danger-solid",
    textClass: "text-danger-text",
    softClass: "bg-danger-soft",
  },
  RUNNING: {
    label: "Running",
    role: "primary",
    Icon: Loader2,
    badgeClass: "bg-primary-soft text-primary-text",
    iconClass: "text-primary-solid",
    textClass: "text-primary-text",
    softClass: "bg-primary-soft",
  },
  CANCELLED: {
    label: "Cancelled",
    role: "muted",
    Icon: Ban,
    badgeClass: "bg-muted-soft text-muted-text",
    iconClass: "text-muted-solid",
    textClass: "text-muted-text",
    softClass: "bg-muted-soft",
  },
  SUBMITTED: {
    label: "Submitted",
    role: "muted",
    Icon: Clock,
    badgeClass: "bg-muted-soft text-muted-text",
    iconClass: "text-muted-solid",
    textClass: "text-muted-text",
    softClass: "bg-muted-soft",
  },
};

export function getStatusVisual(status: RunStatus): StatusVisual {
  return STATUS_VISUALS[status] ?? STATUS_VISUALS.SUBMITTED;
}
