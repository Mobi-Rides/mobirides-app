import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, UI, DayFlag, SelectionState } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        [UI.Months]: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        [UI.Month]: "space-y-4",
        [UI.MonthCaption]: "flex justify-center pt-1 relative items-center",
        [UI.CaptionLabel]: "text-sm font-medium",
        [UI.Nav]: "space-x-1 flex items-center",
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        ),
        [UI.MonthGrid]: "w-full border-collapse space-y-1",
        [UI.Weekdays]: "flex w-full justify-between",
        [UI.Weekday]:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex items-center justify-center",
        [UI.Week]: "flex w-full mt-2 justify-between",
        [UI.Day]: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        [UI.DayButton]: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center"
        ),
        [SelectionState.range_end]: "day-range-end",
        [SelectionState.selected]:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        [DayFlag.today]: "bg-accent text-accent-foreground",
        [DayFlag.outside]:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        [DayFlag.disabled]: "text-muted-foreground opacity-50 line-through",
        [SelectionState.range_middle]:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        [DayFlag.hidden]: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      modifiersClassNames={{
        booked: "bg-red-100 text-red-800 line-through opacity-70 cursor-not-allowed dark:bg-red-900/30 dark:text-red-400"
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
