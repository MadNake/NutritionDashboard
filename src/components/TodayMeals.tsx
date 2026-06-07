import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Meal } from "@/lib/nutrition-api";
import { fmt0 } from "@/lib/format";

const MEAL_ORDER = ["Завтрак", "Обед", "Ужин", "Перекус"];

export function TodayMeals({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Сегодня записей ещё нет. Залогируй приём в Notion и нажми «Обновить».
        </CardContent>
      </Card>
    );
  }

  const groups = new Map<string, Meal[]>();
  for (const m of meals) {
    const key = m.meal ?? "Другое";
    const list = groups.get(key);
    if (list) list.push(m);
    else groups.set(key, [m]);
  }
  const known = MEAL_ORDER.filter((k) => groups.has(k));
  const extra = [...groups.keys()].filter((k) => !MEAL_ORDER.includes(k));
  const orderedKeys = [...known, ...extra];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Приёмы сегодня</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderedKeys.map((key) => {
          const items = groups.get(key)!;
          const subtotal = items.reduce((s, m) => s + m.kcal, 0);
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-medium">{key}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {fmt0(subtotal)} ккал
                </span>
              </div>
              <ul className="space-y-1.5">
                {items.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm">
                        {m.name || "Без названия"}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">{fmt0(m.protein)} г белка</span>
                        {m.source === "Оценка по фото" && (
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[10px] font-normal"
                            title="оценка по фото — приблизительно"
                          >
                            ≈ по фото
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 font-display tabular-nums">
                      {fmt0(m.kcal)}
                      <span className="ml-1 text-xs text-muted-foreground">ккал</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
