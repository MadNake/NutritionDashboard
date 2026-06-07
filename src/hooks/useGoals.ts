import { useCallback, useEffect, useState } from "react";
import { DEFAULT_GOALS, GOALS_STORAGE_KEY, type Goals } from "@/lib/goals";

function loadGoals(): Goals {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return DEFAULT_GOALS;
    const parsed = JSON.parse(raw) as Partial<Goals>;
    // Merge over defaults so fields added later still get a value.
    return { ...DEFAULT_GOALS, ...parsed };
  } catch {
    return DEFAULT_GOALS;
  }
}

export function useGoals() {
  const [goals, setGoalsState] = useState<Goals>(loadGoals);

  useEffect(() => {
    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch {
      // localStorage unavailable (private mode) — keep working in-memory.
    }
  }, [goals]);

  const setGoals = useCallback((next: Goals) => setGoalsState(next), []);
  const resetGoals = useCallback(() => setGoalsState(DEFAULT_GOALS), []);

  return { goals, setGoals, resetGoals };
}
