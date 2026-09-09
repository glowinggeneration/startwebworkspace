import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface UtilityIconButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "children" | "aria-label"> {
  /** Short, task-based label used for both the tooltip and screen readers. */
  label: string;
  icon: React.ReactNode;
  /** Shows the icon in the destructive colour and a soft danger hover. */
  danger?: boolean;
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * Small icon-only action button with a tooltip, matching the platform's
 * icon + hint pattern for copy/edit/download/delete actions.
 */
export function UtilityIconButton({
  label,
  icon,
  danger = false,
  side = "top",
  className,
  type = "button",
  variant = "ghost",
  size = "icon-sm",
  ...props
}: UtilityIconButtonProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type={type}
            variant={variant}
            size={size}
            aria-label={label}
            className={cn(
              "text-muted-foreground transition-all duration-200 ease-out",
              "hover:text-foreground active:scale-95",
              danger && "hover:text-destructive hover:bg-destructive/10",
              className,
            )}
            {...props}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
