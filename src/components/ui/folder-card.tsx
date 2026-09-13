"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  FolderCard                                                                 */
/*                                                                             */
/*  A folder-shaped media card: a cover sits behind a dark folder panel that    */
/*  is notched over it, with the title and subtitle riding in the tab and a     */
/*  stat line along the bottom.                                                 */
/*                                                                             */
/*  On hover the panel slides down to reveal more of the cover, the cover       */
/*  drifts in, and the whole card lifts — one spring, driven by variants on     */
/*  the root, so the parts stay in sync.                                        */
/*                                                                             */
/*  Every dimension is in container query units (cqw), so the card is           */
/*  pixel-exact at any width.                                                   */
/*                                                                             */
/*  Colours are pulled from this app's own semantic tokens (--card, --muted,    */
/*  --foreground, --primary, ...) defined in src/styles.css, rather than a      */
/*  hand-picked light/dark palette, so the card follows the Startweb theme      */
/*  (including the light/dark toggle) instead of carrying its own.             */
/* -------------------------------------------------------------------------- */

export interface FolderCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
> {
  /** Headline shown inside the folder tab. */
  title?: string;
  /** Supporting line under the title. */
  subtitle?: string;
  /** Large figure in the footer, e.g. "24". */
  count?: React.ReactNode;
  /** Word next to the figure, e.g. "Files". */
  countLabel?: string;
  /** Right-aligned footer text, e.g. "312 Assets". */
  meta?: string;
  /** Cover image URL. Falls back to a brand-blue aurora gradient when omitted. */
  cover?: string;
  /** Alt text for the cover image. */
  coverAlt?: string;
  /** Hover motion. Default: true. */
  interactive?: boolean;
}

/**
 * The folder silhouette. The viewBox matches the inner (inside-bezel) box
 * exactly, so `preserveAspectRatio="none"` scales it without distorting radii.
 *
 * The notch is one cubic Bézier fitted to the design's own curve: a long, flat
 * shoulder easing out of the tab, then a steepening sweep that lands softly on
 * the body. 76 across, 59 down, horizontal tangents at both ends so it meets
 * the straight edges without a kink.
 *
 *   tab top   y = 135, straight edge ends x = 261
 *   body top  y = 194   outer corner radius 32, tab corner 16
 *
 * The path runs past the left/right edges and well past the bottom, so the
 * panel always overhangs the cover and still fills the card while it slides
 * down on hover.
 */
const FOLDER_PATH =
  "M-2,151 a16,16 0 0 1 16,-16 h247 " +
  "c26.6,0 59.3,59 76,59 " +
  "h149 a32,32 0 0 1 32,32 v368 " +
  "a32,32 0 0 1 -32,32 h-456 a32,32 0 0 1 -32,-32 Z";

/** Startweb blue dusk — the brand blue rising out of the bottom-left, same
 * family as the STARTWEB wordmark and the PDF letterhead. */
const AURORA_GRADIENT = [
  "radial-gradient(58% 76% at 76% 114%, rgba(226,236,255,.85) 0%, rgba(120,160,255,.42) 34%, rgba(0,0,0,0) 72%)",
  "radial-gradient(105% 95% at 28% 136%, rgba(63,111,255,.75) 0%, rgba(0,61,255,.4) 46%, rgba(0,0,0,0) 80%)",
  "linear-gradient(172deg, #050a24 0%, #0b1a4d 40%, #143a8f 74%, #1e4fd8 100%)",
].join(",");

const SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
} as const;

const cardVariants: Variants = {
  rest: { y: 0 },
  hover: { y: -8 },
  tap: { y: -4, scale: 0.99 },
};

/** The folder front — panel plus the copy riding in its tab. */
const panelVariants: Variants = {
  rest: { y: "0%" },
  hover: { y: "8%" },
};

const coverVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.07 },
};

/** `motion.div`'s prop type fights this project's `exactOptionalPropertyTypes`
 * once arbitrary HTMLAttributes are spread onto it (a widely-reported
 * friction point between framer-motion/motion and that compiler option).
 * Loosened locally for the one element that spreads `...props`, rather than
 * relaxing strictness project-wide for a third-party component's typings. */
const MotionDiv = motion.div as React.ForwardRefExoticComponent<
  Record<string, unknown> & React.RefAttributes<HTMLDivElement>
>;

export const FolderCard = React.forwardRef<HTMLDivElement, FolderCardProps>(function FolderCard(
  {
    title = "Brand kit",
    subtitle = "Logos & Typography",
    count = "18",
    countLabel = "Files",
    meta = "240 Assets",
    cover,
    coverAlt = "",
    interactive = true,
    className,
    style,
    ...props
  },
  ref,
) {
  const gradientId = React.useId();
  const reduceMotion = useReducedMotion();
  const animate = interactive && !reduceMotion;

  return (
    <MotionDiv
      ref={ref}
      initial="rest"
      animate="rest"
      whileHover={animate ? "hover" : undefined}
      whileTap={animate ? "tap" : undefined}
      transition={SPRING}
      variants={animate ? cardVariants : {}}
      style={style}
      className={cn("w-[360px] max-w-full select-none [container-type:inline-size]", className)}
      {...props}
    >
      {/* bezel */}
      <div className="relative box-border aspect-[544/522] w-full rounded-[8.46cqw] bg-muted p-[2.57cqw] shadow-[0_2cqw_5cqw_-2cqw_rgb(0_0_0/.5)]">
        <div className="relative h-full w-full overflow-hidden rounded-[5.88cqw] bg-card">
          {/*
              The card's edge lands on a fractional device pixel, so anything
              clipped there paints at partial alpha. The cover is held 1px in
              and the folder runs 1px proud, which leaves that column filled
              with surface/panel colour instead of a hairline of cover.
            */}
          <div className="absolute left-px right-px top-0 h-[54%] overflow-hidden">
            <motion.div
              variants={animate ? coverVariants : {}}
              transition={SPRING}
              className="h-full w-full origin-bottom"
            >
              {cover ? (
                <img
                  src={cover}
                  alt={coverAlt}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  style={{ background: AURORA_GRADIENT }}
                  className="h-full w-full"
                />
              )}
            </motion.div>
          </div>

          {/* folder front: panel + tab copy, moving as one */}
          <div className="absolute -left-px -right-px inset-y-0 overflow-hidden">
            <motion.div
              variants={animate ? panelVariants : {}}
              transition={SPRING}
              className="absolute inset-0"
            >
              <svg
                aria-hidden
                viewBox="0 0 516 494"
                preserveAspectRatio="none"
                className="absolute inset-0 block h-full w-full"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--card)" />
                    <stop offset="1" stopColor="var(--muted)" />
                  </linearGradient>
                </defs>
                {/* stroked as well as filled so no seam shows at the edges */}
                <path
                  d={FOLDER_PATH}
                  fill={"url(#" + gradientId + ")"}
                  stroke={"url(#" + gradientId + ")"}
                  strokeWidth="2"
                />
              </svg>

              <div className="absolute left-[4.78cqw] top-[29cqw] leading-none">
                <h3 className="m-0 text-[4.25cqw] font-semibold tracking-[0.005em] text-foreground">
                  {title}
                </h3>
                <p className="mt-[2.15cqw] text-[4.4cqw] font-normal tracking-[0.005em] text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            </motion.div>
          </div>

          {/* footer stays put while the folder front slides */}
          <div className="absolute inset-x-[4.78cqw] bottom-[4.3cqw] flex items-baseline justify-between leading-none text-foreground">
            <p className="m-0">
              <span className="text-[9.2cqw] font-semibold tracking-[-0.01em]">{count}</span>
              <span className="ml-[1.6cqw] text-[4.2cqw] font-normal text-muted-foreground">
                {countLabel}
              </span>
            </p>
            <p className="m-0 text-[4.2cqw] font-semibold text-primary">{meta}</p>
          </div>
        </div>
      </div>
    </MotionDiv>
  );
});

export default FolderCard;

export { FolderCard as Component };
