import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COLORS } from "@/lib/colors";
import { calorieBreakdown, type Totals } from "@/lib/aggregation";
import { fmt0 } from "@/lib/format";

export function CaloriesDonut({ totals }: { totals: Totals }) {
  const bd = calorieBreakdown(totals);
  const total = bd.total;
  const data = [
    { name: "Белок", value: bd.protein, color: COLORS.protein },
    { name: "Углеводы", value: bd.carbs, color: COLORS.carbs },
    { name: "Жиры", value: bd.fat, color: COLORS.fat },
  ];
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Структура калорий</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[180px]">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              нет данных
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl tabular-nums">{fmt0(total)}</span>
            <span className="text-xs text-muted-foreground">ккал из БЖУ</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {data.map((d) => (
            <div key={d.name} className="flex flex-col items-center gap-0.5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ background: d.color }}
                />
                {d.name}
              </span>
              <span className="text-sm tabular-nums">{pct(d.value)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
