import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { presetRange, type DayRange } from "@/lib/dates";

const OPTIONS = [
  { value: "1", label: "Сегодня" },
  { value: "2", label: "2 дня" },
  { value: "3", label: "3 дня" },
  { value: "7", label: "7 дней" },
];

export function PeriodSwitcher({
  range,
  onSelect,
}: {
  range: DayRange;
  onSelect: (r: DayRange) => void;
}) {
  // Highlight a preset only when the active range matches it exactly;
  // a custom calendar selection leaves all presets unselected.
  const active =
    OPTIONS.find((o) => {
      const p = presetRange(Number(o.value));
      return p.start === range.start && p.end === range.end;
    })?.value ?? null;

  return (
    <ToggleGroup
      // Base UI: single-select (multiple defaults to false); value is an array.
      value={active ? [active] : []}
      onValueChange={(vals) => {
        const v = vals[0];
        if (v) onSelect(presetRange(Number(v)));
      }}
      variant="outline"
      className="w-full"
    >
      {OPTIONS.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="flex-1 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
