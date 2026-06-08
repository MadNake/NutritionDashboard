import { Card } from "@/components/ui/card";
import { fmt0, fmt1 } from "@/lib/format";
import { progress, remaining } from "@/lib/aggregation";

interface MacroCardProps {
  title: string;
  value: number;
  unit: string;
  color: string;
  /** Present → goal mode (progress + remaining). Absent → informational. */
  goal?: number;
  /** Wording for the gap, e.g. "still needed" or "shortfall/day". */
  remainingLabel?: string;
}

export function MacroCard({
  title,
  value,
  unit,
  color,
  goal,
  remainingLabel = "осталось добрать",
}: MacroCardProps) {
  const hasGoal = typeof goal === "number" && goal > 0;
  const frac = hasGoal ? Math.min(progress(value, goal), 1) : 0;
  const left = hasGoal ? remaining(goal, value) : 0;
  const reached = hasGoal && value >= goal;

  return (
    <Card className="gap-0 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {hasGoal && (
          <span className="text-xs tabular-nums text-muted-foreground">
            цель {fmt0(goal)} {unit}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-2xl tabular-nums" style={{ color }}>
          {fmt1(value)}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>

      {hasGoal ? (
        <>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${frac * 100}%`,
                background: color,
                transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </div>
          <p className="mt-2 text-xs">
            {reached ? (
              <span style={{ color }}>✓ минимум закрыт</span>
            ) : (
              <span className="text-muted-foreground">
                {remainingLabel}{" "}
                <span className="tabular-nums text-foreground">
                  {fmt1(left)} {unit}
                </span>
              </span>
            )}
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">информационно</p>
      )}
    </Card>
  );
}
