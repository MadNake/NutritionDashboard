import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const OPTIONS = [
  { value: "1", label: "Сегодня" },
  { value: "2", label: "2 дня" },
  { value: "3", label: "3 дня" },
  { value: "7", label: "7 дней" },
];

export function PeriodSwitcher({
  period,
  onChange,
}: {
  period: number;
  onChange: (n: number) => void;
}) {
  return (
    <ToggleGroup
      // Base UI: single-select (multiple defaults to false); value is an array.
      value={[String(period)]}
      onValueChange={(vals) => {
        const v = vals[0];
        if (v) onChange(Number(v));
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
