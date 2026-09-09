"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type HighlighterProps = {
  children: React.ReactNode;
  className?: string;
  /** Marker sweep or a drawn underline. */
  action?: "highlight" | "underline";
  /** Any CSS colour. Defaults to the warm accent. */
  color?: string;
};

/**
 * Marks a phrase without adding a drawing dependency: a background sweep that
 * grows once on mount, and a plain tint when motion is reduced.
 */
export function Highlighter({
  children,
  className,
  action = "highlight",
  color = "var(--color-accent-warm, #F59E0B)",
}: HighlighterProps) {
  return (
    <span
      className={cn(
        "relative inline-block px-0.5",
        action === "highlight" ? "highlight-sweep" : "underline-sweep",
        className,
      )}
      style={{ "--highlight-color": color } as React.CSSProperties}
    >
      <span className="relative z-10">{children}</span>
    </span>
  );
}
