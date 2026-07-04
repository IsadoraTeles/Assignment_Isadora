/**
 * Donut — a segmented ring answering ONE question: "how much of the work
 * completed?" Hand-rolled SVG (no chart lib), token-styled. Accessible via
 * role="img" + aria-label; the centre label and an external legend carry the
 * meaning, so it never relies on colour alone.
 */
import { cn } from "@/lib/utils";

export interface DonutSegment {
  value: number;
  /** Tailwind stroke utility for this arc, e.g. "stroke-success-solid". */
  strokeClass: string;
}

interface DonutProps {
  segments: DonutSegment[];
  ariaLabel: string;
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
  /** Track colour behind the arcs. */
  trackClass?: string;
  className?: string;
}

export function Donut({
  segments,
  ariaLabel,
  size = 120,
  thickness = 12,
  centerValue,
  centerLabel,
  trackClass = "stroke-border",
  className,
}: DonutProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // Walk the segments clockwise from 12 o'clock, converting each value into an arc
  // length and offsetting the next one by the running total.
  let offset = 0;
  const arcs = segments.map((segment, i) => {
    const fraction = total > 0 ? segment.value / total : 0;
    const dash = fraction * circumference;
    const el = (
      <circle
        key={i}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={thickness}
        className={segment.strokeClass}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0", className)}
    >
      {/* rotate so arcs start at the top; grouped so the transform is shared */}
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className={trackClass}
        />
        {arcs}
      </g>
      {centerValue && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          dy={centerLabel ? "-0.15em" : "0"}
          className="fill-ink font-semibold"
          style={{ fontSize: size * 0.2 }}
        >
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          dy="1.1em"
          className="fill-muted-text"
          style={{ fontSize: size * 0.09 }}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
}
