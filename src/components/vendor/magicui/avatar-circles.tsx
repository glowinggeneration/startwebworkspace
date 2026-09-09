"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type AvatarCircleItem = {
  /** Optional photo. When absent the initials are shown instead. */
  imageUrl?: string | null;
  /** Accessible name, also used to derive initials. */
  name: string;
  /** Optional link target for the avatar. */
  profileUrl?: string;
};

export type AvatarCirclesProps = {
  className?: string;
  /** Extra people beyond the rendered avatars, shown as a +N chip. */
  numPeople?: number;
  avatars: AvatarCircleItem[];
  size?: "sm" | "md";
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Overlapping avatar stack. Adapted from the supplied MagicUI AvatarCircles:
 * semantic tokens instead of hardcoded black/white, initials fallback for
 * people without a photo, and real links only when a target is provided.
 */
export function AvatarCircles({ numPeople, className, avatars, size = "md" }: AvatarCirclesProps) {
  const dimension = size === "sm" ? "size-7 text-[0.625rem]" : "size-9 text-xs";

  return (
    <div className={cn("z-10 flex -space-x-2.5", className)}>
      {avatars.map((avatar, index) => {
        const content = avatar.imageUrl ? (
          <img
            src={avatar.imageUrl}
            alt={avatar.name}
            loading="lazy"
            className={cn(dimension, "rounded-full border-2 border-card object-cover object-top shadow-xs")}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              dimension,
              "flex items-center justify-center rounded-full border-2 border-card bg-primary/10 font-semibold text-primary shadow-xs",
            )}
          >
            {initialsOf(avatar.name)}
          </span>
        );

        return avatar.profileUrl ? (
          <a
            key={`${avatar.name}-${index}`}
            href={avatar.profileUrl}
            title={avatar.name}
            className="rounded-full transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {content}
            <span className="sr-only">{avatar.name}</span>
          </a>
        ) : (
          <span key={`${avatar.name}-${index}`} title={avatar.name} className="rounded-full">
            {content}
            <span className="sr-only">{avatar.name}</span>
          </span>
        );
      })}
      {numPeople && numPeople > 0 ? (
        <span
          className={cn(
            dimension,
            "flex items-center justify-center rounded-full border-2 border-card bg-muted font-semibold text-muted-foreground shadow-xs",
          )}
        >
          +{numPeople}
        </span>
      ) : null}
    </div>
  );
}
