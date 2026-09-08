import type { ComponentType } from "react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="type-title">{title}</h1>
      <p className="type-body max-w-sm text-muted-foreground">{description}</p>
      <p className="type-meta text-muted-foreground">{phase}</p>
    </div>
  );
}
