"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type AnimatedListProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger between items in ms. */
  delay?: number;
};

/**
 * Reveals list children in sequence once. Adapted from the supplied MagicUI
 * AnimatedList: no endless cycling, so items stay put after they appear.
 */
export function AnimatedList({ children, className, delay = 60 }: AnimatedListProps) {
  const reduced = useReducedMotion();
  const items = React.Children.toArray(children);

  if (reduced) {
    return <div className={cn("flex flex-col gap-3", className)}>{children}</div>;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <AnimatePresence initial={true}>
        {items.map((item, index) => (
          <motion.div
            key={(item as { key?: React.Key }).key ?? index}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{
              duration: 0.3,
              delay: (index * delay) / 1000,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
