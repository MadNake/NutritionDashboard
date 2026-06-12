import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aggregateForPeriod,
  aggregateForRange,
  calorieBreakdown,
  progress,
  remaining,
  sumMeals,
} from "@/lib/aggregation";
import type { Meal } from "@/lib/nutrition-api";

let counter = 0;
const meal = (o: Partial<Meal>): Meal => ({
  id: `m${counter++}`,
  date: null,
  meal: null,
  name: "",
  kcal: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
  source: null,
  ...o,
});

describe("aggregateForPeriod", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0)); // today = 2026-06-15
  });
  afterEach(() => vi.useRealTimers());

  it("N=1 sums only today's meals", () => {
    const agg = aggregateForPeriod(
      [
        meal({ date: "2026-06-15", kcal: 500, protein: 30 }),
        meal({ date: "2026-06-15", kcal: 700, protein: 20 }),
        meal({ date: "2026-06-14", kcal: 999 }),
      ],
      1,
    );
    expect(agg.isAverage).toBe(false);
    expect(agg.display.kcal).toBe(1200);
    expect(agg.display.protein).toBe(50);
    expect(agg.windowMeals).toHaveLength(2);
  });

  it("N=3 averages over 3 calendar days, counting empty days as 0", () => {
    // window = 13, 14, 15; meals only on 13 and 15.
    const agg = aggregateForPeriod(
      [
        meal({ date: "2026-06-15", kcal: 600 }),
        meal({ date: "2026-06-13", kcal: 600 }),
      ],
      3,
    );
    expect(agg.isAverage).toBe(true);
    expect(agg.sum.kcal).toBe(1200);
    expect(agg.display.kcal).toBe(400); // 1200 / 3, not / 2
    expect(agg.perDay).toHaveLength(3);
    expect(agg.perDay.map((day) => day.totals.kcal)).toEqual([600, 0, 600]);
  });

  it("excludes meals outside the N-day window", () => {
    const agg = aggregateForPeriod(
      [
        meal({ date: "2026-06-01", kcal: 9999 }),
        meal({ date: "2026-06-15", kcal: 100 }),
      ],
      7,
    );
    expect(agg.windowMeals).toHaveLength(1);
    expect(agg.sum.kcal).toBe(100);
    expect(agg.display.kcal).toBeCloseTo(100 / 7);
  });

  it("ignores meals with a null date", () => {
    const agg = aggregateForPeriod(
      [meal({ date: null, kcal: 500 }), meal({ date: "2026-06-15", kcal: 100 })],
      1,
    );
    expect(agg.display.kcal).toBe(100);
  });
});

describe("aggregateForRange (arbitrary past windows)", () => {
  it("N=1 past day sums only that day's meals", () => {
    const agg = aggregateForRange(
      [
        meal({ date: "2026-05-10", kcal: 400, protein: 25 }),
        meal({ date: "2026-05-10", kcal: 300, protein: 15 }),
        meal({ date: "2026-05-11", kcal: 999 }),
      ],
      "2026-05-10",
      "2026-05-10",
    );
    expect(agg.isAverage).toBe(false);
    expect(agg.periodDays).toBe(1);
    expect(agg.display.kcal).toBe(700);
    expect(agg.display.protein).toBe(40);
    expect(agg.windowMeals).toHaveLength(2);
  });

  it("averages a past range over calendar days, counting empty days as 0", () => {
    // window = 10, 11, 12; meals only on 10 and 12.
    const agg = aggregateForRange(
      [
        meal({ date: "2026-05-10", kcal: 900 }),
        meal({ date: "2026-05-12", kcal: 900 }),
      ],
      "2026-05-10",
      "2026-05-12",
    );
    expect(agg.isAverage).toBe(true);
    expect(agg.periodDays).toBe(3);
    expect(agg.sum.kcal).toBe(1800);
    expect(agg.display.kcal).toBe(600); // 1800 / 3, not / 2
    expect(agg.perDay.map((day) => day.totals.kcal)).toEqual([900, 0, 900]);
  });
});

describe("helpers", () => {
  it("sumMeals adds every macro", () => {
    expect(
      sumMeals([
        meal({ kcal: 1, protein: 2, fat: 3, carbs: 4, fiber: 5 }),
        meal({ kcal: 1, protein: 2, fat: 3, carbs: 4, fiber: 5 }),
      ]),
    ).toEqual({ kcal: 2, protein: 4, fat: 6, carbs: 8, fiber: 10 });
  });

  it("remaining is never negative; progress can exceed 1", () => {
    expect(remaining(100, 30)).toBe(70);
    expect(remaining(100, 120)).toBe(0);
    expect(progress(120, 100)).toBeCloseTo(1.2);
    expect(progress(50, 0)).toBe(0);
  });

  it("calorieBreakdown uses protein×4, carbs×4, fat×9", () => {
    const bd = calorieBreakdown({
      kcal: 0,
      protein: 10,
      carbs: 20,
      fat: 5,
      fiber: 0,
    });
    expect(bd.protein).toBe(40);
    expect(bd.carbs).toBe(80);
    expect(bd.fat).toBe(45);
    expect(bd.total).toBe(165);
  });
});
