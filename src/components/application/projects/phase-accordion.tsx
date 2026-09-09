import { useState, type ReactNode } from "react";
import { motion, MotionConfig, type Transition } from "motion/react";
import useMeasure from "react-use-measure";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectPhaseStatus } from "@/integrations/supabase/app-types";

export interface PhaseAccordionItem {
  id: string;
  title: string;
  status: ProjectPhaseStatus;
  content: ReactNode;
}

const springTransition: Transition = { type: "spring", stiffness: 500, damping: 46, mass: 1 };

/**
 * Adapted from the supplied Animated Accordion component (see
 * docs/ui-components/COMPONENT_MAP.md) — same dynamic corner-radius morph
 * between open/adjacent/edge items, generalized from a fixed text string
 * per item to arbitrary content (a phase's task list).
 */
export function PhaseAccordion({ items }: { items: PhaseAccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const openIndex = items.findIndex((item) => item.id === openId);

  return (
    <MotionConfig transition={springTransition}>
      <ul>
        {items.map((item, index) => (
          <PhaseAccordionItemRow
            key={item.id}
            item={item}
            isOpen={index === openIndex}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            isBeforeOpen={index === openIndex - 1}
            isAfterOpen={index === openIndex + 1}
            onToggle={() => setOpenId(index === openIndex ? null : item.id)}
          />
        ))}
      </ul>
    </MotionConfig>
  );
}

function PhaseAccordionItemRow({
  item,
  isOpen,
  isFirst,
  isLast,
  isBeforeOpen,
  isAfterOpen,
  onToggle,
}: {
  item: PhaseAccordionItem;
  isOpen: boolean;
  isFirst: boolean;
  isLast: boolean;
  isBeforeOpen: boolean;
  isAfterOpen: boolean;
  onToggle: () => void;
}) {
  const [ref, bounds] = useMeasure();
  const isAlone = (isAfterOpen && isLast) || (isBeforeOpen && isFirst);
  const rounded =
    isOpen || isAlone
      ? "rounded-2xl"
      : isBeforeOpen
        ? "rounded-b-2xl"
        : isAfterOpen
          ? "rounded-t-2xl"
          : isFirst
            ? "rounded-t-2xl"
            : isLast
              ? "rounded-b-2xl"
              : "";

  return (
    <motion.li layout>
      <motion.div
        className={cn(
          "overflow-hidden border border-border bg-card will-change-transform",
          rounded,
          !isOpen && !isFirst && !isBeforeOpen && "border-t-0",
        )}
        style={{ marginBlock: isOpen ? "8px" : "0px" }}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <StatusDot status={item.status} />
            <span className="type-card">{item.title}</span>
          </div>
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-muted-foreground">
            <ChevronDown className="size-4" aria-hidden="true" />
          </motion.span>
        </button>
        <motion.div
          initial={false}
          animate={{ height: isOpen ? bounds.height : 0, opacity: isOpen ? 1 : 0 }}
          className="overflow-hidden will-change-transform"
        >
          <div ref={ref}>
            <div className="border-t border-border px-4 py-3">{item.content}</div>
          </div>
        </motion.div>
      </motion.div>
    </motion.li>
  );
}

function StatusDot({ status }: { status: ProjectPhaseStatus }) {
  const toneClass =
    status === "done"
      ? "bg-success"
      : status === "in_progress"
        ? "bg-primary"
        : "bg-muted-foreground/40";
  return <span className={cn("size-2 rounded-full", toneClass)} aria-hidden="true" />;
}
