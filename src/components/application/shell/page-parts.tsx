import * as React from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextAnimate } from "@/components/vendor/magicui/text-animate";


/** Page title block with an optional right-hand action area. */
export function PageHeader({
  title,
  description,
  actions,
  aside,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <TextAnimate
          as="h1"
          by="word"
          animation="blurInUp"
          duration={0.4}
          className="text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.032em] text-foreground"
        >
          {title}
        </TextAnimate>

        {description ? (
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed tracking-[-0.006em] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions || aside ? (
        <div className="flex flex-col items-end gap-2">
          {actions}
          {aside}
        </div>
      ) : null}
    </div>
  );
}

/** Grey pill group with one selected segment, used for Board/List style switches. */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-[0.75rem] border border-border/70 bg-muted/70 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-[0.5rem] px-4 py-1.5 text-sm font-medium tracking-[-0.006em] transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              selected
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  selected ? "bg-muted text-muted-foreground" : "bg-card text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Underlined tab row with count chips, used above data tables. */
export function UnderlineTabs<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap items-center gap-6", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              selected
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** White panel used for tables, forms and side cards. */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card-surface", className)}>{children}</div>;
}

/** Centred empty state with an outline icon, message and optional action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
    >
      <Icon className="mb-5 size-11 stroke-[1.1] text-muted-foreground/55" aria-hidden={true} />
      <p className="text-[1.0625rem] font-semibold tracking-[-0.016em] text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/** Compact metric tile: quiet label above a large value. */
export function MetricTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Panel className={cn("reveal lift-hover p-5", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </Panel>
  );
}

/** Dismissible prompt bar shown under the main content of a page. */
export function HintBar({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <Panel className="flex flex-wrap items-center gap-4 p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="size-5 text-primary" aria-hidden={true} />
      </span>
      <div className="min-w-48 flex-1">
        <p className="text-[0.9375rem] font-semibold tracking-[-0.012em] text-foreground">
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={`Dismiss ${title}`}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-5" aria-hidden={true} />
      </button>
    </Panel>
  );
}

/** Expandable explainer row that sits at the bottom of a page. */
export function ExplainerPanel({
  icon: Icon,
  title,
  description,
  defaultOpen = false,
  children,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Panel>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-[0.875rem] p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {Icon ? (
          <Icon className="size-5 text-muted-foreground" aria-hidden={true} />
        ) : (
          <ChevronRight
            className={cn("size-5 text-muted-foreground transition-transform", open && "rotate-90")}
            aria-hidden={true}
          />
        )}
        <span className="flex-1">
          <span className="block text-[0.9375rem] font-semibold tracking-[-0.012em] text-foreground">
            {title}
          </span>
          {description ? (
            <span className="block text-sm text-muted-foreground">{description}</span>
          ) : null}
        </span>
        {Icon ? (
          <ChevronDown
            className={cn(
              "size-5 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden={true}
          />
        ) : null}
      </button>
      {open ? <div className="border-t border-border p-5">{children}</div> : null}
    </Panel>
  );
}

/** Toolbar row above a table: search on the left, filters on the right. */
export function Toolbar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>;
}
