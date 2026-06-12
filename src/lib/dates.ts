/**
 * All "today" / period math is done in the user's LOCAL timezone.
 * Notion stores meals as pure dates (YYYY-MM-DD, no time), so we compare on
 * local calendar-day keys.
 */

/** Format a Date as a local YYYY-MM-DD key (not UTC). */
export function toLocalKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local midnight today, as a fresh Date. */
function localMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Today's local date key, e.g. "2026-06-06". */
export function todayKey(): string {
  return toLocalKey(localMidnight());
}

/** Parse a "YYYY-MM-DD" key into a local Date (midnight). */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Inclusive range of date keys from start to end, oldest → newest. */
export function dateKeysInRange(startKey: string, endKey: string): string[] {
  const end = dateFromKey(endKey);
  const out: string[] = [];
  for (const d = dateFromKey(startKey); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(toLocalKey(d));
  }
  return out;
}

/** An inclusive selection of calendar days, as local date keys. */
export interface DayRange {
  start: string;
  end: string;
}

/** A range of the last N days ending today, as local date keys. */
export function presetRange(n: number): DayRange {
  const end = localMidnight();
  const start = new Date(end);
  start.setDate(end.getDate() - (n - 1));
  return { start: toLocalKey(start), end: toLocalKey(end) };
}

const dayLabelFmt = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});
const singleDateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});
const shortDateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
});

/** Short label for charts/axes, e.g. "Mon, 6" (locale-formatted). */
export function formatDayLabel(key: string): string {
  return dayLabelFmt.format(dateFromKey(key));
}

/** Time-only label for the last-refresh timestamp, e.g. "14:32". */
export function formatFetchedAt(iso: string): string {
  const d = new Date(iso);
  return timeFmt.format(d);
}

/**
 * Label for the selected range: a single day → "12 июня"; a span → "01.05 – 31.05".
 */
export function formatRangeLabel(startKey: string, endKey: string): string {
  if (startKey === endKey) return singleDateFmt.format(dateFromKey(startKey));
  return `${shortDateFmt.format(dateFromKey(startKey))} – ${shortDateFmt.format(
    dateFromKey(endKey),
  )}`;
}
