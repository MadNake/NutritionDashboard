import { useState } from "react";
import { Settings2 } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_GOALS, proteinFromWeight, type Goals } from "@/lib/goals";

type DraftStrings = Record<keyof Goals, string>;

const toDraft = (g: Goals): DraftStrings => ({
  calories: String(g.calories),
  protein: String(g.protein),
  fiber: String(g.fiber),
  weight: String(g.weight),
});

const parseDraft = (d: DraftStrings): Goals => ({
  calories: Math.max(0, Math.round(Number(d.calories) || 0)),
  protein: Math.max(0, Math.round(Number(d.protein) || 0)),
  fiber: Math.max(0, Math.round(Number(d.fiber) || 0)),
  weight: Math.max(0, Number(d.weight) || 0),
});

interface SettingsSheetProps {
  goals: Goals;
  onSave: (g: Goals) => void;
  onReset: () => void;
}

export function SettingsSheet({ goals, onSave, onReset }: SettingsSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftStrings>(() => toDraft(goals));

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(toDraft(goals)); // reseed from current goals on open
    setOpen(next);
  };

  const field =
    (key: keyof Goals) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  const handleSave = () => {
    onSave(parseDraft(draft));
    setOpen(false);
  };

  const handleReset = () => {
    setDraft(toDraft(DEFAULT_GOALS));
    onReset();
  };

  const suggestProtein = () =>
    setDraft((d) => ({
      ...d,
      protein: String(proteinFromWeight(Number(d.weight) || 0)),
    }));

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" aria-label="Настройки целей" />}
      >
        <Settings2 className="size-5" />
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Цели (дневные минимумы)</SheetTitle>
          <SheetDescription>
            Не потолки, а ориентиры «сколько добрать». Хранятся на этом устройстве.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor="weight">Вес, кг</Label>
            <div className="flex gap-2">
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                min={0}
                value={draft.weight}
                onChange={field("weight")}
              />
              <Button type="button" variant="secondary" onClick={suggestProtein}>
                Белок ← вес
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Подставит белок = 1.6 × вес (можно потом изменить вручную).
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="calories">Калории, ккал</Label>
            <Input
              id="calories"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.calories}
              onChange={field("calories")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="protein">Белок, г</Label>
              <Input
                id="protein"
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.protein}
                onChange={field("protein")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fiber">Клетчатка, г</Label>
              <Input
                id="fiber"
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.fiber}
                onChange={field("fiber")}
              />
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button onClick={handleSave}>Сохранить</Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Сбросить
            </Button>
            <SheetClose render={<Button variant="ghost" className="flex-1" />}>
              Отмена
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
