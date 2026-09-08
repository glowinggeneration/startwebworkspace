import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
}

interface OnboardingStepperProps {
  steps: OnboardingStep[];
  currentIndex: number;
  className?: string;
}

type StepState = "completed" | "current" | "upcoming";

function stateFor(index: number, currentIndex: number): StepState {
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "upcoming";
}

/**
 * Horizontal step-progress indicator (Account -> Profile -> Billing ->
 * Complete). Hand-built from the supplied text-only generation prompt —
 * see docs/ui-components/COMPONENT_MAP.md.
 */
export function OnboardingStepper({ steps, currentIndex, className }: OnboardingStepperProps) {
  return (
    <ol className={cn("flex w-full items-start", className)} aria-label="Onboarding progress">
      {steps.map((step, index) => {
        const state = stateFor(index, currentIndex);
        const isLast = index === steps.length - 1;

        return (
          <li key={step.id} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center">
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  state === "completed" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-primary text-primary",
                  state === "upcoming" && "border-border text-muted-foreground",
                )}
              >
                {state === "completed" ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <div className="mt-2 max-w-24 text-center">
                <p
                  className={cn(
                    "type-meta font-medium",
                    state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.label}
                </p>
                <p className="type-meta text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {!isLast && (
              <div
                aria-hidden="true"
                className={cn(
                  "mt-4 h-px flex-1 transition-colors",
                  index < currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
