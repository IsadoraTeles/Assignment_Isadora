/**
 * SortControl — a shadcn Select for ordering the run list. Purely reorders by the
 * chosen field (see lib/sort.ts for why the keys are field-based, not sequential).
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type SortKey } from "@/lib/sort";

interface SortControlProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        id="sort-label"
        htmlFor="sort-control"
        className="text-sm font-medium text-muted-text"
      >
        Sort by
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
        <SelectTrigger
          id="sort-control"
          aria-labelledby="sort-label"
          className="w-[160px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
