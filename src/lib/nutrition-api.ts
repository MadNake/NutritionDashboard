/** One normalized meal row, as returned by /api/nutrition. */
export interface Meal {
  id: string;
  date: string | null; // "YYYY-MM-DD"
  meal: string | null; // Breakfast / Lunch / Dinner / Snack (Notion field values)
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  source: string | null; // "Photo estimate" | "Exact" (Notion field values)
}

export interface NutritionResponse {
  meals: Meal[];
  fetchedAt: string; // ISO timestamp
}

interface ApiError {
  error?: string;
  detail?: string;
  status?: number;
}

/**
 * Fetch the meal window from the proxy. Throws an Error carrying the proxy's
 * own message so the UI can show something actionable.
 */
export async function fetchNutrition(since: string): Promise<NutritionResponse> {
  let res: Response;
  try {
    res = await fetch(`/api/nutrition?since=${encodeURIComponent(since)}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("Нет сети — не удалось обратиться к серверу.");
  }

  if (!res.ok) {
    let message = `Ошибка ${res.status}`;
    try {
      const body = (await res.json()) as ApiError;
      if (body.error) message = body.error;
      if (body.detail) message += ` — ${body.detail}`;
    } catch {
      // response wasn't JSON; keep the status-based message
    }
    throw new Error(message);
  }

  return (await res.json()) as NutritionResponse;
}
