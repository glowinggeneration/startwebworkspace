"use client";

import * as React from "react";
import { motion, useReducedMotion, type TargetAndTransition, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

type Animation = "blurInUp" | "fadeIn" | "slideUp";
type By = "character" | "word" | "line" | "text";

export type TextAnimateProps = {
  children: string;
  className?: string;
  segmentClassName?: string;
  animation?: Animation;
  by?: By;
  once?: boolean;
  delay?: number;
  duration?: number;
  as?: "p" | "span" | "h1" | "h2" | "h3" | "div";
};

const hidden: Record<Animation, TargetAndTransition> = {
  blurInUp: { opacity: 0, y: 12, filter: "blur(8px)" },
  fadeIn: { opacity: 0 },
  slideUp: { opacity: 0, y: 8 },
};

const shown: Record<Animation, TargetAndTransition> = {
  blurInUp: { opacity: 1, y: 0, filter: "blur(0px)" },
  fadeIn: { opacity: 1 },
  slideUp: { opacity: 1, y: 0 },
};

function split(text: string, by: By): string[] {
  if (by === "character") return text.split("");
  if (by === "word") return text.split(/(\s+)/);
  if (by === "line") return text.split("\n");
  return [text];
}

/**
 * Reveals text on mount. Adapted from the supplied MagicUI TextAnimate:
 * the visible text is split for animation but exposed to assistive tech as a
 * single label, and motion is skipped entirely when the reader prefers it.
 */
export function TextAnimate({
  children,
  className,
  segmentClassName,
  animation = "blurInUp",
  by = "word",
  once: _once = true,
  delay = 0,
  duration = 0.45,
  as = "p",
}: TextAnimateProps) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  const segments = split(children, by);
  const container: Variants = {
    hidden: {},
    show: {
      transition: { delayChildren: delay, staggerChildren: by === "character" ? 0.015 : 0.05 },
    },
  };
  const item: Variants = {
    hidden: hidden[animation],
    show: { ...shown[animation], transition: { duration, ease: [0.22, 0.61, 0.36, 1] } },
  };

  return (
    <Component
      className={cn(className)}
      aria-label={children}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {segments.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          aria-hidden="true"
          variants={item}
          className={cn("inline-block whitespace-pre", segmentClassName)}
        >
          {segment}
        </motion.span>
      ))}
    </Component>
  );
}
