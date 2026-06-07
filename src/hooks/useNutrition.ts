import { useCallback, useEffect, useState } from "react";
import { fetchNutrition, type Meal } from "@/lib/nutrition-api";
import { sinceKey } from "@/lib/dates";

interface NutritionState {
  meals: Meal[];
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads the 7-day meal window once on mount and on demand via refresh().
 * All period switching (Today/2/3/7) is computed on the client from this data,
 * so it's instant and needs no extra requests.
 */
export function useNutrition() {
  const [state, setState] = useState<NutritionState>({
    meals: [],
    fetchedAt: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchNutrition(sinceKey(6));
      setState({
        meals: data.meals,
        fetchedAt: data.fetchedAt,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
