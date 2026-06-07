import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lastNDateKeys, sinceKey, toLocalKey, todayKey } from "@/lib/dates";

describe("dates (local timezone)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 2026-06-15, local noon (noon avoids any midnight/DST rollover).
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("todayKey is local YYYY-MM-DD", () => {
    expect(todayKey()).toBe("2026-06-15");
  });

  it("sinceKey(6) and default give today − 6 days", () => {
    expect(sinceKey(6)).toBe("2026-06-09");
    expect(sinceKey()).toBe("2026-06-09");
  });

  it("lastNDateKeys(7) is 7 ascending keys including today", () => {
    expect(lastNDateKeys(7)).toEqual([
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
      "2026-06-13",
      "2026-06-14",
      "2026-06-15",
    ]);
  });

  it("lastNDateKeys(1) is just today", () => {
    expect(lastNDateKeys(1)).toEqual(["2026-06-15"]);
  });

  it("toLocalKey zero-pads month and day", () => {
    expect(toLocalKey(new Date(2026, 0, 3))).toBe("2026-01-03");
  });
});
