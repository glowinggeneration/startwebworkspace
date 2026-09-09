import * as React from "react";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

const sizes = {
  sm: { avatar: "size-8 text-[0.6875rem]", title: "text-sm", subtitle: "text-xs" },
  md: { avatar: "size-10 text-xs", title: "text-[0.9375rem]", subtitle: "text-[0.8125rem]" },
} as const;

/**
 * Person row: avatar with initials, name, and a secondary line such as an
 * email address or role. Used wherever the roster is shown.
 */
export function AvatarLabelGroup({
  title,
  subtitle,
  imageUrl,
  size = "md",
  status,
  trailing,
  className,
}: {
  title: string;
  subtitle?: string | undefined;
  /** Optional profile photo. Falls back to initials when absent. */
  imageUrl?: string | null | undefined;
  size?: keyof typeof sizes | undefined;
  /** Optional presence-style dot colour class, e.g. "bg-success". */
  status?: string | undefined;
  trailing?: React.ReactNode | undefined;
  className?: string | undefined;
}) {
  const s = sizes[size];
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className="relative shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className={cn("rounded-full object-cover object-top", s.avatar)}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              "flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
              s.avatar,
            )}
          >
            {initials(title)}
          </span>
        )}
        {status ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background",
              status,
            )}
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate font-semibold text-foreground", s.title)}>{title}</span>
        {subtitle ? (
          <span className={cn("block truncate text-muted-foreground", s.subtitle)} title={subtitle}>
            {subtitle}
          </span>
        ) : null}
      </span>
      {trailing}
    </div>
  );
}
