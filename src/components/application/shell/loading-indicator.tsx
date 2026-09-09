import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Loading indicator in the Startweb design language: a hairline track with a
 * brand-blue arc sweeping around it. Falls back to a static arc for people who
 * prefer reduced motion.
 */
export function LoadingIndicator({
  size = "md",
  label,
  className,
}: {
  size?: "sm" | "md" | "lg";
  /** Optional text shown to the right of the spinner and to screen readers. */
  label?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  const dimensions = { sm: 16, md: 20, lg: 32 }[size];
  const strokeWidth = size === "lg" ? 3 : 2.25;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // A quarter-arc feels calm and reads clearly at every size.
  const dash = circumference * 0.25;

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 align-middle", className)}
    >
      <span
        className="relative inline-flex shrink-0"
        style={{ width: dimensions, height: dimensions }}
      >
        <svg
          width={dimensions}
          height={dimensions}
          viewBox={`0 0 ${dimensions} ${dimensions}`}
          aria-hidden="true"
          className="absolute inset-0"
        >
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="opacity-15"
          />
        </svg>
        <motion.svg
          width={dimensions}
          height={dimensions}
          viewBox={`0 0 ${dimensions} ${dimensions}`}
          aria-hidden="true"
          className="absolute inset-0"
          {...(reduceMotion
            ? {}
            : {
                animate: { rotate: 360 },
                transition: {
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 0.9,
                  ease: "linear" as const,
                },
              })}
        >
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </motion.svg>
      </span>
      {label ? (
        <span className="text-sm text-current">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </span>
  );
}
