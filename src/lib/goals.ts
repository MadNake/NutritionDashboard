/**
 * Daily MINIMUMS to reliably hit — framed as "how much more to eat", never caps.
 * Editable in-app (stored in localStorage); these are the seed defaults.
 */
export interface Goals {
  calories: number; // kcal/day, minimum
  protein: number; // g/day
  fiber: number; // g/day
  weight: number; // kg — used for protein suggestion (1.6 × weight)
}

export const DEFAULT_GOALS: Goals = {
  calories: 2250,
  protein: 100, // ≈ 1.6 × 62 kg
  fiber: 30, // target 25–35
  weight: 62,
};

/** Suggested protein minimum from bodyweight (1.6 g/kg, rounded to 5 g). */
export function proteinFromWeight(weightKg: number): number {
  return Math.round((1.6 * weightKg) / 5) * 5;
}

export const GOALS_STORAGE_KEY = "nutrition-dashboard:goals:v1";
