import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dateKeysInRange,
  formatRangeLabel,
  presetRange,
  toLocalKey,
  todayKey,
} from "@/lib/dates";

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

  it("presetRange(7) is a 7-day window ending today", () => {
    expect(presetRange(7)).toEqual({ start: "2026-06-09", end: "2026-06-15" });
  });

  it("presetRange(1) is just today (start === end)", () => {
    expect(presetRange(1)).toEqual({ start: "2026-06-15", end: "2026-06-15" });
  });

  it("dateKeysInRange is inclusive and ascending", () => {
    expect(dateKeysInRange("2026-06-13", "2026-06-15")).toEqual([
      "2026-06-13",
      "2026-06-14",
      "2026-06-15",
    ]);
  });

  it("dateKeysInRange with equal start/end is a single key", () => {
    expect(dateKeysInRange("2026-06-15", "2026-06-15")).toEqual(["2026-06-15"]);
  });

  it("formatRangeLabel renders a span with a numeric DD.MM dash range", () => {
    expect(formatRangeLabel("2026-05-01", "2026-05-31")).toBe("01.05 – 31.05");
  });

  it("formatRangeLabel renders a single day without a dash separator", () => {
    const label = formatRangeLabel("2026-06-15", "2026-06-15");
    expect(label).not.toContain("–");
    expect(label.length).toBeGreaterThan(0);
  });

  it("toLocalKey zero-pads month and day", () => {
    expect(toLocalKey(new Date(2026, 0, 3))).toBe("2026-01-03");
  });
});
