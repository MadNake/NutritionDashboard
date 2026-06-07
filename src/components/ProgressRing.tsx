import { cn } from "@/lib/utils";
import { fmt0 } from "@/lib/format";

interface ProgressRingProps {
  value: number;
  goal: number;
  label: string;
  unit?: string;
  color: string;
  size?: number;
  strokeWidth?: number;
  /** Bigger value text for the primary (calories) ring. */
  hero?: boolean;
  format?: (n: number) => string;
}

export function ProgressRing({
  value,
  goal,
  label,
  unit,
  color,
  size = 128,
  strokeWidth = 12,
  hero = false,
  format = fmt0,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const frac = goal > 0 ? Math.min(value / goal, 1) : 0;
  const dash = frac * circumference;
  const reached = goal > 0 && value >= goal;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            style={{
              transition: "stroke-dasharray 600ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-display leading-none tabular-nums",
              hero ? "text-[2.6rem]" : "text-2xl",
            )}
            style={{ color }}
          >
            {format(value)}
          </span>
          <span className="mt-1 text-xs tabular-nums text-muted-foreground">
            / {format(goal)}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-foreground/90">{label}</span>
        {reached && (
          <span title="минимум достигнут" style={{ color }}>
            ✓
          </span>
        )}
      </div>
    </div>
  );
}
