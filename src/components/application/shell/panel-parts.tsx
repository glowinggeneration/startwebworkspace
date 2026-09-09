import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header row for a data panel: title, supporting sentence and optional
 * trailing actions. Sits above a table inside the same white surface.
 */
export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 py-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.016em] text-foreground">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Side panel title block with a close control. */
export function PanelTitleBar({
  title,
  description,
  onClose,
  closeLabel,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 pb-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.018em] text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="-mt-1 -mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * A group of related fields inside a side panel, separated from the next
 * group by a dotted hairline rather than a hard rule.
 */
export function PanelSection({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "space-y-4 py-4 first:pt-0 last:pb-0",
        "border-b border-dashed border-border/70 last:border-b-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Action row pinned to the bottom of a side panel. */
export function PanelFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 -mx-6 -mb-6 mt-2 flex items-center justify-end gap-3 rounded-b-[0.875rem] border-t border-border bg-card/85 px-6 py-4 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

type StatusTone = "neutral" | "positive" | "attention" | "critical" | "info";

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-border bg-muted/50 text-muted-foreground [&>span]:bg-muted-foreground/60",
  positive: "border-success/30 bg-success/10 text-success [&>span]:bg-success",
  attention: "border-warning/30 bg-warning/10 text-warning [&>span]:bg-warning",
  critical: "border-danger/30 bg-danger/10 text-danger [&>span]:bg-danger",
  info: "border-primary/30 bg-primary/10 text-primary [&>span]:bg-primary",
};

/** Small pill with a leading dot, used for record statuses in tables and cards. */
export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        toneClasses[tone],
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Horizontal meter with the percentage shown beside the track. */
export function ProgressMeter({
  value,
  label,
  tone = "info",
  className,
}: {
  /** 0-100. */
  value: number;
  /** Accessible name for the meter. */
  label: string;
  tone?: "info" | "critical";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            tone === "critical" ? "bg-danger" : "bg-primary",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
