import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { useNutrition } from "@/hooks/useNutrition";
import { useGoals } from "@/hooks/useGoals";
import { aggregateForPeriod, remaining } from "@/lib/aggregation";
import { formatFetchedAt } from "@/lib/dates";
import { fmt0 } from "@/lib/format";
import { COLORS } from "@/lib/colors";
import { ProgressRing } from "@/components/ProgressRing";
import { MacroCard } from "@/components/MacroCard";
import { CaloriesDonut } from "@/components/CaloriesDonut";
import { DailyBarChart } from "@/components/DailyBarChart";
import { TodayMeals } from "@/components/TodayMeals";
import { PeriodSwitcher } from "@/components/PeriodSwitcher";
import { RefreshButton } from "@/components/RefreshButton";
import { SettingsSheet } from "@/components/SettingsSheet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});

export default function App() {
  const { meals, fetchedAt, loading, error, refresh } = useNutrition();
  const { goals, setGoals, resetGoals } = useGoals();
  const [period, setPeriod] = useState(1);

  useEffect(() => {
    if (error) toast.error("Не удалось обновить данные", { description: error });
  }, [error]);

  const agg = useMemo(() => aggregateForPeriod(meals, period), [meals, period]);
  const d = agg.display;
  const isAverage = agg.isAverage;
  const firstLoad = loading && meals.length === 0;

  const caloriesLeft = remaining(goals.calories, d.kcal);
  const remainingLabel = isAverage ? "в среднем не хватает" : "осталось добрать";

  return (
    <div className="mx-auto min-h-svh w-full max-w-md px-4 pb-16 pt-5">
      {/* Header */}
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl leading-tight">Питание</h1>
          <p className="text-sm text-muted-foreground">
            {isAverage
              ? `Среднее за ${period} дн.`
              : `Сегодня, ${dateFmt.format(new Date())}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <SettingsSheet goals={goals} onSave={setGoals} onReset={resetGoals} />
          <RefreshButton onClick={() => void refresh()} loading={loading} />
        </div>
      </header>

      <PeriodSwitcher period={period} onChange={setPeriod} />

      <p className="mt-2 mb-4 text-center text-xs text-muted-foreground">
        {loading
          ? "Загрузка данных…"
          : fetchedAt
            ? `Обновлено в ${formatFetchedAt(fetchedAt)}`
            : "—"}
      </p>

      {error && (
        <Card className="mb-4 border-destructive/50">
          <CardContent className="flex items-start gap-2 py-3 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span className="text-muted-foreground">{error}</span>
          </CardContent>
        </Card>
      )}

      {firstLoad ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          {/* Overview rings */}
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-5">
              <ProgressRing
                hero
                size={184}
                strokeWidth={16}
                value={d.kcal}
                goal={goals.calories}
                unit="ккал"
                label="Калории"
                color={COLORS.calories}
              />
              <p className="text-center text-sm">
                {isAverage ? (
                  <span className="text-muted-foreground">
                    В среднем{" "}
                    <span className="tabular-nums text-foreground">
                      {fmt0(d.kcal)}
                    </span>{" "}
                    ккал/день
                  </span>
                ) : caloriesLeft > 0 ? (
                  <span className="text-muted-foreground">
                    Осталось добрать{" "}
                    <span
                      className="font-display tabular-nums"
                      style={{ color: COLORS.calories }}
                    >
                      {fmt0(caloriesLeft)}
                    </span>{" "}
                    ккал
                  </span>
                ) : (
                  <span style={{ color: COLORS.calories }}>
                    ✓ минимум по калориям закрыт
                  </span>
                )}
              </p>
              <div className="grid w-full grid-cols-2 gap-2 border-t pt-4">
                <ProgressRing
                  size={120}
                  value={d.protein}
                  goal={goals.protein}
                  unit="г"
                  label="Белок"
                  color={COLORS.protein}
                />
                <ProgressRing
                  size={120}
                  value={d.fiber}
                  goal={goals.fiber}
                  unit="г"
                  label="Клетчатка"
                  color={COLORS.fiber}
                />
              </div>
            </CardContent>
          </Card>

          {/* Macro cards */}
          <div className="grid grid-cols-2 gap-3">
            <MacroCard
              title="Белок"
              value={d.protein}
              unit="г"
              goal={goals.protein}
              color={COLORS.protein}
              remainingLabel={remainingLabel}
            />
            <MacroCard
              title="Клетчатка"
              value={d.fiber}
              unit="г"
              goal={goals.fiber}
              color={COLORS.fiber}
              remainingLabel={remainingLabel}
            />
            <MacroCard
              title="Углеводы"
              value={d.carbs}
              unit="г"
              color={COLORS.carbs}
            />
            <MacroCard title="Жиры" value={d.fat} unit="г" color={COLORS.fat} />
          </div>

          {/* Calorie structure */}
          <CaloriesDonut totals={d} />

          {/* Period-specific */}
          {isAverage ? (
            <>
              <DailyBarChart perDay={agg.perDay} goal={goals.calories} />
              <p className="text-center text-xs text-muted-foreground">
                Среднее за {period} календарных дней; день без записей считается
                как 0.
              </p>
            </>
          ) : (
            <TodayMeals meals={agg.windowMeals} />
          )}

          <p className="pt-2 text-center text-xs text-muted-foreground/80">
            Цели — это минимумы, к которым стоит стремиться, а не потолки. Оценки
            «по фото» приблизительны.
          </p>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
