"use client";

import * as React from "react";
import { motion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  IOKnob                                                                     */
/*                                                                             */
/*  A rotary knob for a bounded numeric value — the audio-mixer/synth style   */
/*  control: a 270° arc (a 90° gap at the bottom) with a filled portion        */
/*  showing how far value sits between min and max, and a pointer dot         */
/*  showing the exact angle.                                                  */
/*                                                                             */
/*  Rotating a knob with a mouse is ambiguous (there's no fixed "start"        */
/*  point to grab), so — matching how every real knob plugin does it — drag   */
/*  is vertical: up increases, down decreases, and the distance dragged       */
/*  maps to a value delta rather than to an absolute angle. Shift+drag        */
/*  slows it down for fine adjustment.                                       */
/* -------------------------------------------------------------------------- */

export interface IOKnobProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
> {
  value: number;
  onChange?: (value: number) => void;
  /** Defaults to 0. */
  min?: number;
  /** Defaults to 100. */
  max?: number;
  /** Defaults to 1. */
  step?: number;
  /** Knob diameter in px. Defaults to 64. */
  size?: number;
  /** Shown above the knob. */
  label?: string;
  /** Appended to the value readout, e.g. "%". */
  unit?: string;
  disabled?: boolean;
}

/** Degrees swept by the track: a 270° arc leaves a 90° gap centred at the
 * bottom, the shape every hardware knob uses so 12 o'clock reads as "half". */
const SWEEP = 270;
/** Where the arc starts, in the SVG's own angle convention (0° = 3 o'clock,
 * clockwise) — rotating a dasharray-drawn circle by this puts the gap at
 * the bottom instead of the default start at 3 o'clock. */
const START_ROTATION = 90 + (360 - SWEEP) / 2;
/** px of vertical drag, at normal speed, to sweep the full min-to-max range. */
const DRAG_RANGE_PX = 160;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number, min: number, step: number) {
  return Math.round((value - min) / step) * step + min;
}

export const IOKnob = React.forwardRef<HTMLDivElement, IOKnobProps>(function IOKnob(
  {
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    size = 64,
    label,
    unit,
    disabled = false,
    className,
    ...props
  },
  ref,
) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{ startY: number; startValue: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const angleMotion = useSpring(0, { stiffness: 300, damping: 30, mass: 0.6 });

  const clamped = clamp(value, min, max);
  const fraction = max > min ? (clamped - min) / (max - min) : 0;
  const angle = -SWEEP / 2 + fraction * SWEEP;

  React.useEffect(() => {
    angleMotion.set(angle);
  }, [angle, angleMotion]);

  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const trackLength = (SWEEP / 360) * circumference;
  const fillLength = trackLength * fraction;

  const commit = React.useCallback(
    (next: number) => {
      const snapped = clamp(snap(next, min, step), min, max);
      if (snapped !== value) onChange?.(snapped);
    },
    [min, step, max, value, onChange],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startValue: clamped };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const speed = e.shiftKey ? 4 : 1;
    const deltaY = (drag.startY - e.clientY) * speed;
    const deltaValue = (deltaY / DRAG_RANGE_PX) * (max - min);
    commit(drag.startValue + deltaValue);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragRef.current) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const big = (max - min) / 10 || step;
    const table: Record<string, number> = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
      PageUp: big,
      PageDown: -big,
    };
    if (e.key === "Home") {
      e.preventDefault();
      commit(min);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      commit(max);
      return;
    }
    const delta = table[e.key];
    if (delta !== undefined) {
      e.preventDefault();
      commit(clamped + delta);
    }
  };

  const decimals = step < 1 ? (String(step).split(".")[1]?.length ?? 0) : 0;
  const display = clamped.toFixed(decimals);

  return (
    <div
      ref={ref}
      className={cn("inline-flex select-none flex-col items-center gap-2", className)}
      {...props}
    >
      {label && (
        <span className="type-meta text-muted-foreground" id={`${label}-knob-label`}>
          {label}
        </span>
      )}

      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-valuetext={unit ? `${display}${unit}` : display}
        aria-disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        style={{ width: size, height: size }}
        className={cn(
          "relative touch-none rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          disabled
            ? "cursor-not-allowed opacity-50"
            : dragging
              ? "cursor-ns-resize"
              : "cursor-grab",
        )}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
            className="stroke-muted"
            strokeDasharray={`${trackLength} ${circumference}`}
            transform={`rotate(${START_ROTATION} ${size / 2} ${size / 2})`}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
            className="stroke-primary"
            strokeDasharray={`${fillLength} ${circumference}`}
            transform={`rotate(${START_ROTATION} ${size / 2} ${size / 2})`}
            initial={false}
            animate={{ strokeDasharray: `${fillLength} ${circumference}` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </svg>

        {/* the bezel and pointer dot, rotated together to the current angle */}
        <motion.div
          className="absolute inset-[8px] rounded-full border border-border bg-card shadow-sm"
          style={{ rotate: angleMotion }}
        >
          <span className="absolute left-1/2 top-[3px] size-1.5 -translate-x-1/2 rounded-full bg-primary" />
        </motion.div>
      </div>

      {unit !== undefined ? (
        <span className="type-meta tabular-nums text-foreground">
          {display}
          {unit}
        </span>
      ) : (
        <span className="type-meta tabular-nums text-foreground">{display}</span>
      )}
    </div>
  );
});

export default IOKnob;

export { IOKnob as Component };
