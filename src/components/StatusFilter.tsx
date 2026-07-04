import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RunStatus } from "@/lib/types";
import { STATUS_VISUALS } from "@/lib/status";

export type StatusFilterValue = RunStatus | "ALL";

interface StatusFilterProps {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

/** Statuses offered in the filter. RUNNING is intentionally included so the
 *  "zero matches" empty state can be demonstrated against real data. */
const FILTER_ORDER: StatusFilterValue[] = [
  "ALL",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "RUNNING",
];

function labelFor(value: StatusFilterValue): string {
  return value === "ALL" ? "All statuses" : STATUS_VISUALS[value].label;
}

/** Status dropdown (label + shadcn Select) that drives the run-list filter. */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        id="status-filter-label"
        htmlFor="status-filter"
        className="text-sm font-medium text-muted-text"
      >
        Filter
      </label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as StatusFilterValue)}
      >
        <SelectTrigger
          id="status-filter"
          aria-labelledby="status-filter-label"
          className="w-[180px]"
        >
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_ORDER.map((v) => (
            <SelectItem key={v} value={v}>
              {labelFor(v)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
