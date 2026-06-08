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

/**
 * The `since` date for the API request = today − (days) in local time.
 * Default 6 → a 7-day window including today.
 */
export function sinceKey(daysBack = 6): string {
  const d = localMidnight();
  d.setDate(d.getDate() - daysBack);
  return toLocalKey(d);
}

/** Last N calendar-day keys including today, oldest → newest. */
export function lastNDateKeys(n: number): string[] {
  const base = localMidnight();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(toLocalKey(d));
  }
  return out;
}

/** Parse a "YYYY-MM-DD" key into a local Date (midnight). */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const dayLabelFmt = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
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
