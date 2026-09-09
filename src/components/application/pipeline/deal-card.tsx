import { useState } from "react";
import { currency } from "@/lib/sales/currency";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  ChevronDown,
  Handshake,
  MessageSquareText,
  NotebookText,
  Package,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useIndustryPlaybooks } from "@/hooks/use-industry-playbooks";
import type { Deal } from "@/hooks/use-deals";
import type { DealStatus } from "@/integrations/supabase/app-types";

interface DealCardProps {
  deal: Deal;
  accountName: string;
  industryName: string | null;
  packageName: string | null;
  onStatusChange: (status: DealStatus) => void;
}

/**
 * Adapted from the supplied Expandable Profile Card component (see
 * docs/ui-components/COMPONENT_MAP.md) — same click-to-expand interaction,
 * rebuilt around a deal instead of a lead-generation company profile and
 * restyled onto our design tokens.
 */
export function DealCard({
  deal,
  accountName,
  industryName,
  packageName,
  onStatusChange,
}: DealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const springConfig = { type: "spring", stiffness: 300, damping: 30 } as const;
  const { workspaceId } = useActiveWorkspace();
  const { data: playbooks } = useIndustryPlaybooks(workspaceId);
  const playbook = deal.industry_id
    ? playbooks?.find((p) => p.industry_id === deal.industry_id)
    : undefined;

  return (
    <motion.div layout transition={springConfig} className="card-surface overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-3.5 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <div className="min-w-0 flex-1">
          <p className="type-card truncate" title={accountName}>
            {accountName}
          </p>
          <p className="type-meta text-muted-foreground">{currency.format(deal.value)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {industryName && (
            <span className="max-w-20 truncate rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {industryName}
            </span>
          )}
          <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} className="text-muted-foreground">
            <ChevronDown className="size-4" aria-hidden="true" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springConfig}
            className="border-t border-border"
          >
            <div className="space-y-3 p-4">
              <DataRow icon={Package} label="Package">
                {packageName ?? "No package"}
              </DataRow>
              {deal.next_step && (
                <DataRow icon={MessageSquareText} label="Next step">
                  {deal.next_step}
                </DataRow>
              )}
              {deal.next_date && (
                <DataRow icon={Calendar} label="Next date">
                  {new Date(deal.next_date).toLocaleDateString("en-ZA", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </DataRow>
              )}
              {deal.notes && (
                <DataRow icon={Tag} label="Notes">
                  {deal.notes}
                </DataRow>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {playbook && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline">
                        <NotebookText className="size-4" aria-hidden="true" />
                        Desk card
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 space-y-3" align="start">
                      <p className="type-body italic">"{playbook.opening_line}"</p>
                      <ol className="type-meta list-decimal space-y-1 pl-4 text-muted-foreground">
                        {playbook.questions.map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ol>
                    </PopoverContent>
                  </Popover>
                )}
                {deal.status !== "won" && (
                  <Button size="sm" onClick={() => onStatusChange("won")}>
                    <Handshake className="size-4" aria-hidden="true" />
                    Mark won
                  </Button>
                )}
                {deal.status !== "later" && deal.status !== "won" && (
                  <Button size="sm" variant="outline" onClick={() => onStatusChange("later")}>
                    Later
                  </Button>
                )}
                {deal.status !== "lost" && deal.status !== "won" && (
                  <Button size="sm" variant="outline" onClick={() => onStatusChange("lost")}>
                    Lost
                  </Button>
                )}
                {deal.status !== "open" && (
                  <Button size="sm" variant="ghost" onClick={() => onStatusChange("open")}>
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DataRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Package;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start gap-3")}>
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <p className="type-meta text-muted-foreground">{label}</p>
        <p className="type-body break-words">{children}</p>
      </div>
    </div>
  );
}
