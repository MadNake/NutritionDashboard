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

  // The `since` of the currently loaded window, and the one in flight (dedupe).
  const loadedSinceRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);

  const load = useCallback(async (since: string) => {
    if (inFlightRef.current === since) return;
    inFlightRef.current = since;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchNutrition(since);
      loadedSinceRef.current = since;
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
    } finally {
      inFlightRef.current = null;
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
