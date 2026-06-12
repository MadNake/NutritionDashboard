import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  dateFromKey,
  dateKeysInRange,
  formatRangeLabel,
  toLocalKey,
  todayKey,
  type DayRange,
} from "@/lib/dates";

/** A draft DateRange → normalized DayRange (start ≤ end, single day = equal). */
function toDayRange(draft: DateRange): DayRange {
  const from = toLocalKey(draft.from!);
  const to = draft.to ? toLocalKey(draft.to) : from;
  return from <= to ? { start: from, end: to } : { start: to, end: from };
}

/**
 * Calendar popover for picking a single day or a custom range. Selection is a
 * *draft* — it only takes effect after pressing "Применить", so the user can
 * freely adjust the period (react-day-picker has no built-in confirm button).
 */
export function DateRangePicker({
  range,
  onChange,
}: {
  range: DayRange;
  onChange: (r: DayRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const today = dateFromKey(todayKey());

  function handleOpenChange(next: boolean) {
    // Seed the draft from the active range each time the popover opens.
    if (next) {
      setDraft({
        from: dateFromKey(range.start),
        to: range.start === range.end ? undefined : dateFromKey(range.end),
      });
    }
    setOpen(next);
  }

  function apply() {
    if (!draft?.from) return;
    onChange(toDayRange(draft));
    setOpen(false);
  }

  const draftLabel = draft?.from
    ? (() => {
        const r = toDayRange(draft);
        const days = dateKeysInRange(r.start, r.end).length;
        const label = formatRangeLabel(r.start, r.end);
        return days > 1 ? `${label} · ${days} дн.` : label;
      })()
    : "Выберите дату";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-start gap-2 font-normal"
            aria-label="Выбрать дату или период"
          />
        }
      >
        <CalendarDays className="text-muted-foreground" />
        <span className="truncate">
          {formatRangeLabel(range.start, range.end)}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <Calendar
          mode="range"
          required
          selected={draft}
          onSelect={setDraft}
          defaultMonth={dateFromKey(range.end)}
          disabled={{ after: today }}
          endMonth={today}
          autoFocus
        />
        <div className="mt-1 flex items-center justify-between gap-2 border-t px-1 pt-2">
          <span className="min-w-0 truncate text-xs font-medium tabular-nums">
            {draftLabel}
          </span>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={apply} disabled={!draft?.from}>
              Применить
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
