"use client";

import { useState, useMemo, type FC, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AdaptiveSliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  label?: string;
  unit?: string;
  onChange?: (value: number) => void;
}

const DEFAULT_MIN = 50;
const DEFAULT_MAX = 350;
const DEFAULT_STEP = 25;
const DEFAULT_VALUE = 200;

const ALLOCATION_GRADIENT =
  "linear-gradient(90deg, var(--allocation-gradient-start), var(--allocation-gradient-end))";

export const AdaptiveSlider: FC<AdaptiveSliderProps> = ({
  value,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  step = DEFAULT_STEP,
  defaultValue = DEFAULT_VALUE,
  label = "Calories",
  unit = "kCal",
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState<number>(defaultValue);

  const calories = value ?? internalValue;

  const percentage = ((calories - min) / (max - min)) * 100;

  const dots = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="z-30 h-1.5 w-1.5 rounded-full bg-primary/25 transition-colors" />
      )),
    [],
  );

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setInternalValue(val);
    onChange?.(val);
  };

  return (
    <motion.div className="flex h-[60vh] w-xs flex-col items-center justify-center rounded-3xl bg-card p-6 shadow-[var(--shadow-elevated)] transition-colors select-none sm:w-sm sm:p-12">
      <span className="mb-2 text-xl font-bold text-muted-foreground sm:text-2xl">{label}</span>

      <div className="mb-8 flex items-baseline gap-2">
        <AnimatedText
          value={calories.toString()}
          className="overflow-hidden text-5xl font-extrabold tracking-tight sm:text-6xl"
        />
        <motion.span
          layout
          className="text-4xl font-extrabold text-foreground transition-colors sm:text-5xl"
        >
          {unit}
        </motion.span>
      </div>

      <div className="group relative flex h-13 w-full items-center overflow-hidden rounded-full bg-muted transition-colors">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 transition-colors sm:px-8">
          {dots}
        </div>

        <motion.div
          className="pointer-events-none absolute top-0 left-0 h-full rounded-full"
          animate={{
            width: `calc((${percentage} / 100) * (100% - 52px) + 52px)`,
            background: ALLOCATION_GRADIENT,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        <input
          title="range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={calories}
          onChange={handleSliderChange}
          className="absolute inset-0 z-50 h-13 w-full cursor-pointer opacity-0"
        />

        <motion.div
          className="pointer-events-none absolute top-0 z-40 flex size-13 items-center justify-center rounded-full border-none"
          animate={{
            left: `calc((${percentage} / 100) * (100% - 52px))`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="size-10 rounded-full bg-card shadow-[var(--shadow-soft)] ring-1 ring-border" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const AnimatedText = ({ value, className }: { value: string; className?: string }) => {
  return (
    <div className={cn("flex text-lg tracking-tight will-change-transform", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {value.split("").map((char, index) => {
          const displayChar = char === " " ? "\u00A0" : char;

          return (
            <motion.span
              key={char + index}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  // delay: 0.03 * index,
                },
              }}
              exit={{ opacity: 0, y: 0, scale: 1, transition: { duration: 0 } }}
            >
              {displayChar}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
