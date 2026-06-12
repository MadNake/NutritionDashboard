import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { ru } from "react-day-picker/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * react-day-picker styled with the project's tokens (no default RDP stylesheet).
 * Selection state is applied to the day *cell*; we fill the inner button from
 * there. Russian locale, no future-day clutter beyond what callers pass.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={ru}
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        months: "relative flex flex-col",
        month: "flex flex-col gap-3",
        month_caption: "flex h-8 items-center justify-center px-9",
        caption_label: "text-sm font-medium capitalize",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "text-muted-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "text-muted-foreground"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[0.7rem] font-normal text-muted-foreground capitalize",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm focus-within:z-10",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 rounded-lg font-normal"
        ),
        // `selected` also covers a single picked day and the range ends.
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90 [&>button]:hover:text-primary-foreground",
        range_start: "rounded-l-lg",
        range_end: "rounded-r-lg",
        // `!` beats the `selected` fill that also applies to middle days.
        range_middle:
          "bg-accent [&>button]:!bg-transparent [&>button]:!text-foreground [&>button]:hover:!bg-accent-foreground/10",
        today: "[&>button]:font-semibold",
        outside: "[&>button]:text-muted-foreground/50",
        disabled:
          "[&>button]:text-muted-foreground/40 [&>button]:opacity-50 [&>button]:hover:bg-transparent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevClassName }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevClassName)} />
          ) : (
            <ChevronRight className={cn("size-4", chevClassName)} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
