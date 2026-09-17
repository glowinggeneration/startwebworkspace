/**
 * The thirteen website production stages. Delivery phases on Projects stay
 * as they are — this is the technology view of the same work, owned by the
 * CTO, and never reused as a sales status.
 */
export const PRODUCTION_STAGES = [
  { value: "brief_received", label: "Brief received" },
  { value: "content_gathering", label: "Content gathering" },
  { value: "design", label: "Design" },
  { value: "design_approval", label: "Design approval" },
  { value: "build", label: "Build" },
  { value: "internal_review", label: "Internal review" },
  { value: "client_review", label: "Client review" },
  { value: "changes", label: "Changes" },
  { value: "qa", label: "QA" },
  { value: "launch_ready", label: "Launch ready" },
  { value: "launched", label: "Launched" },
  { value: "post_launch_support", label: "Post launch support" },
  { value: "complete", label: "Complete" },
] as const;

export type ProductionStage = (typeof PRODUCTION_STAGES)[number]["value"];

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  PRODUCTION_STAGES.map((stage) => [stage.value, stage.label]),
);

export function stageLabel(value: string | null | undefined): string {
  if (!value) return "Brief received";
  return STAGE_LABEL[value] ?? value;
}
