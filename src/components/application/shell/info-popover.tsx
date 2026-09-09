import * as React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Small "what does this mean" affordance. Explains how a figure on the page is
 * calculated without adding another card to the layout.
 */
export function InfoPopover({
  title,
  children,
  label,
  className,
}: {
  title: string;
  children: React.ReactNode;
  /** Accessible name for the trigger. Defaults to "About {title}". */
  label?: string;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 rounded-full text-muted-foreground transition-transform hover:text-foreground active:scale-95",
            className,
          )}
        >
          <Info className="size-4" aria-hidden="true" />
          <span className="sr-only">{label ?? `About ${title}`}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-xl p-4">
        <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">{title}</p>
        <div className="mt-1.5 space-y-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}
