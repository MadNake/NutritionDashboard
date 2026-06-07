import { describe, expect, it } from "vitest";
import { handleNutrition } from "./index";

/**
 * LIVE integration check for the Notion proxy. It hits the real Notion API, so
 * it only runs when NOTION_TOKEN is set in the environment:
 *
 *   NOTION_TOKEN=ntn_xxx npm test
 *
 * This is the one test that actually validates the 2025-09-03 query shape AND
 * the Russian field-name mapping against the live database — worth running once
 * before deploying. Without a token it is skipped (so `npm test` stays green in
 * CI / on machines without the secret).
 */
const token = process.env.NOTION_TOKEN;

describe("Notion proxy (live)", () => {
  it.runIf(Boolean(token))(
    "queries the data source and returns normalized meals",
    async () => {
      const res = await handleNutrition(
        new Request("http://localhost/api/nutrition?since=2026-01-01"),
        { NOTION_TOKEN: token! },
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        meals: Array<Record<string, unknown>>;
        fetchedAt: string;
      };
      expect(Array.isArray(data.meals)).toBe(true);

      // Eyeball the mapping: dates, meal names, and macro numbers should look right.
      console.log(`total meals: ${data.meals.length}`);
      console.log(JSON.stringify(data.meals.slice(0, 3), null, 2));

      if (data.meals.length > 0) {
        const m = data.meals[0];
        expect(typeof m.id).toBe("string");
        expect(typeof m.kcal).toBe("number");
        expect("date" in m).toBe(true);
        expect("protein" in m).toBe(true);
      }
    },
    20000,
  );
});
