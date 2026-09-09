"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type AuroraTextProps = {
  children: React.ReactNode;
  className?: string;
  /** Gradient stops. Defaults to Startweb blue with the warm accent. */
  colors?: string[];
  /** Sweep duration in seconds. */
  speed?: number;
};

/**
 * Gradient wordmark treatment. Adapted from the supplied MagicUI AuroraText:
 * tokenised colours, and the sweep only runs for readers who allow motion
 * (motion-safe), leaving a static gradient otherwise.
 */
export function AuroraText({
  children,
  className,
  colors = [
    "var(--color-primary)",
    "var(--color-accent-warm, #F59E0B)",
    "var(--color-primary)",
  ],
  speed = 12,
}: AuroraTextProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      <span
        className="motion-safe:animate-aurora bg-clip-text text-transparent"
        style={{
          backgroundImage: `linear-gradient(110deg, ${colors.join(", ")})`,
          backgroundSize: "200% 100%",
          animationDuration: `${speed}s`,
        }}
      >
        {children}
      </span>
    </span>
  );
}
