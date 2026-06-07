import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDayLabel } from "@/lib/dates";
import type { DayTotals } from "@/lib/aggregation";

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { label: string; kcal: number } }>;
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="text-muted-foreground">{p.label}</div>
      <div className="tabular-nums">{p.kcal.toLocaleString("ru-RU")} ккал</div>
    </div>
  );
}

export function DailyBarChart({
  perDay,
  goal,
}: {
  perDay: DayTotals[];
  goal: number;
}) {
  const data = perDay.map((d) => ({
    label: formatDayLabel(d.date),
    kcal: Math.round(d.totals.kcal),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Калории по дням</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={<BarTooltip />}
            />
            <ReferenceLine
              y={goal}
              stroke="var(--primary)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
            />
            <Bar
              dataKey="kcal"
              radius={[6, 6, 0, 0]}
              fill="var(--chart-1)"
              maxBarSize={56}
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Пунктир — дневной минимум {goal.toLocaleString("ru-RU")} ккал
        </p>
      </CardContent>
    </Card>
  );
}
