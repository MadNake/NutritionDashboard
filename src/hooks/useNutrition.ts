import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNutrition, type Meal } from "@/lib/nutrition-api";
import { presetRange } from "@/lib/dates";

interface NutritionState {
  meals: Meal[];
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads meals for the selected range's start date and keeps the window cached.
 *
 * The fetched window always covers at least the last 7 days, so switching the
 * 1/2/3/7-day presets is instant (no extra requests). Only when the chosen
 * range starts earlier than what's already loaded do we refetch a wider window;
 * the per-end-date cropping is done later in aggregation.
 */
export function useNutrition(rangeStart: string) {
  const [state, setState] = useState<NutritionState>({
    meals: [],
    fetchedAt: null,
    loading: true,
    error: null,
  });

  // The `since` of the currently loaded window.
  const loadedSinceRef = useRef<string | null>(null);
  // Monotonic id of the latest load; stale responses (any earlier id) are
  // dropped so an out-of-order resolution can't overwrite a newer selection.
  const reqIdRef = useRef(0);

  const load = useCallback(async (since: string) => {
    const myReq = ++reqIdRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchNutrition(since);
      if (reqIdRef.current !== myReq) return; // superseded by a newer load
      loadedSinceRef.current = since;
      setState({
        meals: data.meals,
        fetchedAt: data.fetchedAt,
        loading: false,
        error: null,
      });
    } catch (err) {
      if (reqIdRef.current !== myReq) return; // superseded by a newer load
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  // Window must cover both the chosen range start and the 7-day presets.
  const presetSince = presetRange(7).start;
  const neededSince = rangeStart < presetSince ? rangeStart : presetSince;

  useEffect(() => {
    const loaded = loadedSinceRef.current;
    if (loaded === null || neededSince < loaded) {
      void load(neededSince);
    }
  }, [neededSince, load]);

  const refresh = useCallback(() => {
    void load(loadedSinceRef.current ?? neededSince);
  }, [load, neededSince]);

  return { ...state, refresh };
}
