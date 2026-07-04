/**
 * Gauge — a single-percentage donut in Seqera's efficiency-dial style. Answers ONE
 * question (e.g. "was compute efficient?"). Hand-rolled SVG, token-styled, with
 * role="img" + aria-label. The centre value is always shown, so meaning never
 * depends on the arc colour alone.
 */
import { cn } from "@/lib/utils";

interface GaugeProps {
  /** 0–100. Clamped for the arc; the label shows the real rounded value. */
  value: number;
  ariaLabel: string;
  label?: string;
  size?: number;
  thickness?: number;
  /** Tailwind stroke utility for the filled arc. */
  arcClass?: string;
  trackClass?: string;
  className?: string;
}

export function Gauge({
  value,
  ariaLabel,
  label,
  size = 96,
  thickness = 10,
  arcClass = "stroke-primary-solid",
  trackClass = "stroke-muted-soft",
  className,
}: GaugeProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0", className)}
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          className={arcClass}
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </g>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        dy={label ? "-0.1em" : "0"}
        className="fill-ink font-semibold"
        style={{ fontSize: size * 0.24 }}
      >
        {Math.round(value)}%
      </text>
      {label && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          dy="1.25em"
          className="fill-muted-text"
          style={{ fontSize: size * 0.11 }}
        >
          {label}
        </text>
      )}
    </svg>
  );
}
