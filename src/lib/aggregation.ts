import type { Meal } from "./nutrition-api";
import { lastNDateKeys } from "./dates";

export interface Totals {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export const emptyTotals = (): Totals => ({
  kcal: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
});

export function sumMeals(meals: Meal[]): Totals {
  return meals.reduce<Totals>(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      fat: acc.fat + m.fat,
      carbs: acc.carbs + m.carbs,
      fiber: acc.fiber + m.fiber,
    }),
    emptyTotals(),
  );
}

function divideTotals(t: Totals, n: number): Totals {
  return {
    kcal: t.kcal / n,
    protein: t.protein / n,
    fat: t.fat / n,
    carbs: t.carbs / n,
    fiber: t.fiber / n,
  };
}

export interface DayTotals {
  date: string;
  totals: Totals;
}

export interface PeriodAggregate {
  /** N — number of calendar days in the window (1 / 2 / 3 / 7). */
  periodDays: number;
  /** The N day keys, oldest → newest. */
  dateKeys: string[];
  /** Meals that fall within the window. */
  windowMeals: Meal[];
  /** Raw sum over the whole window. */
  sum: Totals;
  /** Per-day totals (a day with no meals = 0 — a fair daily average). */
  perDay: DayTotals[];
  /** What to show: the sum for "Сегодня" (N=1) or the per-day average (N>1). */
  display: Totals;
  /** True when display is an average (N>1). */
  isAverage: boolean;
}

/**
 * Aggregate the server window down to a single period.
 * N=1 → today's sum. N>1 → sum over the window divided by N calendar days,
 * counting empty days as 0 (an honest "average per day").
 */
export function aggregateForPeriod(meals: Meal[], n: number): PeriodAggregate {
  const dateKeys = lastNDateKeys(n);
  const keySet = new Set(dateKeys);
  const windowMeals = meals.filter((m) => m.date !== null && keySet.has(m.date));

  const byDay = new Map<string, Meal[]>();
  for (const k of dateKeys) byDay.set(k, []);
  for (const m of windowMeals) byDay.get(m.date as string)!.push(m);

  const perDay: DayTotals[] = dateKeys.map((date) => ({
    date,
    totals: sumMeals(byDay.get(date)!),
  }));

  const sum = sumMeals(windowMeals);
  const isAverage = n > 1;
  const display = isAverage ? divideTotals(sum, n) : sum;

  return { periodDays: n, dateKeys, windowMeals, sum, perDay, display, isAverage };
}

/** How much is still needed to reach a minimum (never negative). */
export function remaining(goal: number, value: number): number {
  return Math.max(0, goal - value);
}

/** Fraction of a goal reached (can exceed 1 — we never frame it as a cap). */
export function progress(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return value / goal;
}

export interface CalorieBreakdown {
  protein: number; // kcal contributed by protein (×4)
  carbs: number; // ×4
  fat: number; // ×9
  total: number;
}

/** Split total calories by macro contribution (protein×4, carbs×4, fat×9). */
export function calorieBreakdown(t: Totals): CalorieBreakdown {
  const protein = t.protein * 4;
  const carbs = t.carbs * 4;
  const fat = t.fat * 9;
  return { protein, carbs, fat, total: protein + carbs + fat };
}
