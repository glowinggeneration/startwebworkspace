"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  InteractiveTimetable                                                       */
/*                                                                             */
/*  A weekly schedule grid: days across the top, hours down the side, events   */
/*  laid out by their real start/end time rather than snapped to a row. A      */
/*  block lifts on hover and expands in place on click to show its time        */
/*  range and subtitle, instead of opening a separate popover — the detail     */
/*  stays anchored to the thing it describes.                                  */
/*                                                                             */
/*  A "now" line is drawn on whichever column's label matches today's day      */
/*  name, if any — a nice-to-have that costs nothing when the days shown       */
/*  aren't actual weekdays (a "Room A / Room B" resource grid, say).           */
/* -------------------------------------------------------------------------- */

export interface TimetableEvent {
  id: string;
  /** Index into `days`. */
  day: number;
  /** Hour of day, 0-24. Decimals are fine — 9.5 is 9:30. */
  start: number;
  end: number;
  title: string;
  subtitle?: string;
  /** Any CSS colour. Defaults to the theme's primary. */
  color?: string;
}

export interface InteractiveTimetableProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick"
> {
  /** Column headers. Defaults to a Mon-Fri work week. */
  days?: string[];
  /** First hour shown. Defaults to 8. */
  startHour?: number;
  /** Last hour shown (exclusive of the following hour's row). Defaults to 18. */
  endHour?: number;
  /** px per hour row. Defaults to 56. */
  hourHeight?: number;
  events: TimetableEvent[];
  /** Fires when an event block is selected (clicked, or Enter/Space on focus). */
  onEventClick?: (event: TimetableEvent) => void;
  /** Accessible name for the grid. */
  label?: string;
}

const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIME_COL_WIDTH = 52;

function formatHourLabel(hour: number) {
  const h = Math.floor(hour);
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

function formatEventTime(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${display} ${period}` : `${display}:${String(m).padStart(2, "0")} ${period}`;
}

export const InteractiveTimetable = React.forwardRef<HTMLDivElement, InteractiveTimetableProps>(
  function InteractiveTimetable(
    {
      days = DEFAULT_DAYS,
      startHour = 8,
      endHour = 18,
      hourHeight = 56,
      events,
      onEventClick,
      label = "Timetable",
      className,
      ...props
    },
    ref,
  ) {
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
    const bodyHeight = (endHour - startHour) * hourHeight;

    const [nowOffset, setNowOffset] = React.useState<number | null>(null);
    const todayIndex = React.useMemo(() => {
      const todayName = new Date().toLocaleDateString("en-US", { weekday: "short" });
      return days.findIndex((day) => day.slice(0, 3).toLowerCase() === todayName.toLowerCase());
    }, [days]);

    React.useEffect(() => {
      if (todayIndex === -1) return;
      const update = () => {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60;
        if (hour < startHour || hour > endHour) {
          setNowOffset(null);
          return;
        }
        setNowOffset((hour - startHour) * hourHeight);
      };
      update();
      const interval = setInterval(update, 60_000);
      return () => clearInterval(interval);
    }, [todayIndex, startHour, endHour, hourHeight]);

    function selectEvent(event: TimetableEvent) {
      setSelectedId((current) => (current === event.id ? null : event.id));
      onEventClick?.(event);
    }

    return (
      <div
        ref={ref}
        className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
        {...props}
      >
        <div
          role="grid"
          aria-label={label}
          className="grid"
          style={{ gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${days.length}, 1fr)` }}
        >
          <div className="border-b border-border" />
          {days.map((day, i) => (
            <div
              key={day + i}
              role="columnheader"
              className={cn(
                "border-b border-l border-border px-2 py-2 text-center text-[12px] font-medium",
                i === todayIndex ? "text-primary" : "text-muted-foreground",
              )}
            >
              {day}
            </div>
          ))}
        </div>

        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${days.length}, 1fr)`,
            height: bodyHeight,
          }}
        >
          <div className="relative">
            {hours.slice(0, -1).map((hour) => (
              <span
                key={hour}
                style={{ top: (hour - startHour) * hourHeight }}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
              >
                {formatHourLabel(hour)}
              </span>
            ))}
          </div>

          {days.map((day, dayIndex) => (
            <div key={day + dayIndex} className="relative border-l border-border">
              {hours.map((hour) => (
                <div
                  key={hour}
                  style={{ top: (hour - startHour) * hourHeight }}
                  className="absolute inset-x-0 border-t border-border/60"
                />
              ))}

              {dayIndex === todayIndex && nowOffset !== null && (
                <div
                  aria-hidden
                  style={{ top: nowOffset }}
                  className="absolute inset-x-0 z-10 flex items-center"
                >
                  <span className="-ml-[3px] size-1.5 rounded-full bg-destructive" />
                  <span className="h-px flex-1 bg-destructive" />
                </div>
              )}

              {events
                .filter((event) => event.day === dayIndex)
                .map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    startHour={startHour}
                    hourHeight={hourHeight}
                    selected={selectedId === event.id}
                    onSelect={() => selectEvent(event)}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  },
);

function EventBlock({
  event,
  startHour,
  hourHeight,
  selected,
  onSelect,
}: {
  event: TimetableEvent;
  startHour: number;
  hourHeight: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const top = (event.start - startHour) * hourHeight;
  const height = Math.max((event.end - event.start) * hourHeight, 22);
  const color = event.color ?? "var(--color-primary)";

  return (
    <motion.button
      type="button"
      layout
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      style={{
        top,
        height: selected ? "auto" : height,
        minHeight: height,
        left: 4,
        right: 4,
        backgroundColor: `color-mix(in oklab, ${color} 14%, var(--color-card))`,
        borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
      }}
      className={cn(
        "absolute z-0 overflow-hidden rounded-md border px-2 py-1 text-left transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "z-20 shadow-elevated",
      )}
    >
      <p style={{ color }} className="truncate text-[12px] font-medium leading-tight">
        {event.title}
      </p>
      {(selected || height >= 40) && (
        <p className="truncate text-[11px] leading-tight text-muted-foreground">
          {formatEventTime(event.start)} – {formatEventTime(event.end)}
        </p>
      )}
      {selected && event.subtitle && (
        <p className="mt-1 whitespace-normal text-[11px] leading-snug text-muted-foreground">
          {event.subtitle}
        </p>
      )}
    </motion.button>
  );
}

export default InteractiveTimetable;

export { InteractiveTimetable as Component };
