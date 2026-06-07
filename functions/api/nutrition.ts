/**
 * Cloudflare Pages Function — read-only proxy to the Notion "Питание" database.
 *
 * Why a proxy: the Notion API has no CORS and the token must never reach the
 * client. Frontend + this function share one origin, so no CORS headers and no
 * client-side key are needed.
 *
 * Route: GET /api/nutrition?since=YYYY-MM-DD   (since is optional)
 */

const DATA_SOURCE_ID = "0dfffdcc-2586-4b80-853d-678cc149fde9";
const NOTION_VERSION = "2025-09-03";
const NOTION_QUERY_URL = `https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`;
const MAX_PAGES = 25; // safety guard against runaway pagination (25 * 100 rows)

interface Env {
  NOTION_TOKEN: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

// --- Notion response shapes (only the parts we read) ---
interface NotionDate {
  start: string | null;
}
interface NotionSelect {
  name: string | null;
}
interface NotionTitleItem {
  plain_text: string;
}
interface NotionProps {
  [key: string]:
    | { type?: string; date?: NotionDate | null }
    | { type?: string; select?: NotionSelect | null }
    | { type?: string; title?: NotionTitleItem[] }
    | { type?: string; number?: number | null }
    | undefined;
}
interface NotionPage {
  id: string;
  properties: NotionProps;
}
interface NotionQueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

// --- normalized output ---
interface Meal {
  id: string;
  date: string | null;
  meal: string | null;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  source: string | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Personal data — never let intermediaries cache the response.
      "Cache-Control": "no-store",
    },
  });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Field names are matched character-by-character by Notion — keep them exact.
function num(props: NotionProps, key: string): number {
  const prop = props[key] as { number?: number | null } | undefined;
  return prop?.number ?? 0;
}
function selectName(props: NotionProps, key: string): string | null {
  const prop = props[key] as { select?: NotionSelect | null } | undefined;
  return prop?.select?.name ?? null;
}

function normalize(page: NotionPage): Meal {
  const props = page.properties;
  const dateProp = props["Дата"] as { date?: NotionDate | null } | undefined;
  const titleProp = props["Описание"] as { title?: NotionTitleItem[] } | undefined;
  const name = (titleProp?.title ?? []).map((t) => t.plain_text).join("").trim();

  return {
    id: page.id,
    date: dateProp?.date?.start ?? null,
    meal: selectName(props, "Приём"),
    name,
    kcal: num(props, "Калории"),
    protein: num(props, "Белок, г"),
    fat: num(props, "Жиры, г"),
    carbs: num(props, "Углеводы, г"),
    fiber: num(props, "Клетчатка, г"),
    source: selectName(props, "Источник"),
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  if (!env.NOTION_TOKEN) {
    console.error("NOTION_TOKEN is not configured in the environment.");
    return json(
      {
        error:
          "NOTION_TOKEN не задан. Добавь его в переменные окружения Pages (или .dev.vars локально).",
      },
      500,
    );
  }

  const since = new URL(request.url).searchParams.get("since");
  if (since && !ISO_DATE.test(since)) {
    return json({ error: "Параметр since должен быть в формате YYYY-MM-DD." }, 400);
  }

  const body: Record<string, unknown> = {
    page_size: 100,
    sorts: [{ property: "Дата", direction: "ascending" }],
  };
  if (since) {
    body.filter = { property: "Дата", date: { on_or_after: since } };
  }

  const meals: Meal[] = [];
  let cursor: string | null = null;
  let pages = 0;

  try {
    do {
      const res = await fetch(NOTION_QUERY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cursor ? { ...body, start_cursor: cursor } : body),
      });

      if (!res.ok) {
        const detail = await res.text();
        // Do NOT log the token; the detail from Notion is safe to surface.
        console.error(`Notion error ${res.status}: ${detail}`);
        return json(
          { error: `Notion вернул ошибку ${res.status}`, status: res.status, detail },
          res.status === 401 || res.status === 403 ? res.status : 502,
        );
      }

      const data = (await res.json()) as NotionQueryResponse;
      for (const page of data.results) meals.push(normalize(page));

      cursor = data.has_more ? data.next_cursor : null;
      pages += 1;
    } while (cursor && pages < MAX_PAGES);

    console.log(`Returned ${meals.length} meals over ${pages} Notion page(s).`);
    return json({ meals, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Proxy failed to reach Notion:", err);
    return json(
      { error: "Не удалось получить данные из Notion.", detail: String(err) },
      502,
    );
  }
}
