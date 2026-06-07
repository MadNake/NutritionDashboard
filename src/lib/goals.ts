/**
 * Daily MINIMUMS to reliably hit — framed as "сколько ещё добрать", never caps.
 * Editable in-app (stored in localStorage); these are the seed defaults.
 */
export interface Goals {
  calories: number; // ккал/день, минимум
  protein: number; // г/день
  fiber: number; // г/день
  weight: number; // кг — для подсказки белка (1.6 × вес)
}

export const DEFAULT_GOALS: Goals = {
  calories: 2250,
  protein: 100, // ≈ 1.6 × 62 кг
  fiber: 30, // ориентир 25–35
  weight: 62,
};

/** Suggested protein minimum from bodyweight (1.6 g/kg, rounded to 5 g). */
export function proteinFromWeight(weightKg: number): number {
  return Math.round((1.6 * weightKg) / 5) * 5;
}

export const GOALS_STORAGE_KEY = "nutrition-dashboard:goals:v1";
