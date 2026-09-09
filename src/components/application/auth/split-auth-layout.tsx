import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Monitor, Building2, KanbanSquare, ReceiptText } from "lucide-react";

/**
 * Split authentication surface: a full-bleed Startweb blue field with a
 * floating two-panel card — product highlights on the blue side, the form
 * on the white side.
 */

const highlights = [
  {
    icon: KanbanSquare,
    title: "One pipeline",
    description: "Track every deal from first call to signed scope, with owners and next steps.",
  },
  {
    icon: Building2,
    title: "Delivery in view",
    description: "Projects, phases and team workload sit beside the accounts they belong to.",
  },
  {
    icon: ReceiptText,
    title: "Quotes to cash",
    description: "Turn an approved quote into an invoice and follow payment without leaving here.",
  },
];

export function SplitAuthLayout({
  headline,
  subhead,
  children,
}: {
  headline: string;
  subhead: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-primary px-4 py-10 lg:px-10 lg:py-16">
      <Decor />
      <div className="relative mx-auto flex w-full max-w-6xl overflow-hidden rounded-sm bg-primary/40 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.55)] backdrop-blur-[2px] lg:min-h-[620px]">
        <div className="relative hidden w-1/2 flex-col justify-center gap-10 p-12 text-primary-foreground lg:flex">
          <span className="absolute top-10 left-12 text-sm font-bold tracking-[0.18em] text-white uppercase">
            Startweb
          </span>
          <div className="mt-10 flex flex-col gap-8">
            {highlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-sm bg-white/12 ring-1 ring-white/20">
                  <Icon className="size-6 text-white" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full bg-card p-8 sm:p-12 lg:w-1/2 lg:p-14">
          <div
            role="status"
            className="rounded-2xl border border-border bg-muted/50 p-6 text-center md:hidden"
          >
            <Monitor className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden />
            <h2 className="text-base font-semibold tracking-tight">Use a desktop or tablet</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Startweb is designed for larger screens. Please sign in from a desktop or tablet to
              continue.
            </p>
          </div>

          <div className="hidden md:block">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {headline}
              <span className="block text-primary">Startweb workspace</span>
            </h1>
            <div className="mt-3 h-px w-12 bg-border" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{subhead}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Decor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 -left-24 size-72 rounded-full border border-white/15" />
      <div className="absolute top-1/3 left-8 size-40 rounded-full border border-white/10" />
      <div className="absolute right-10 bottom-16 size-56 rounded-full border border-white/10" />
      <div className="absolute top-20 right-1/4 size-3 rounded-full bg-white/30" />
      <div className="absolute bottom-24 left-1/3 size-2 rounded-full bg-white/25" />
      <div
        className="absolute top-24 left-1/3 h-24 w-32 opacity-25"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "10px 10px",
          color: "white",
        }}
      />
      <div
        className="absolute right-16 bottom-40 h-24 w-32 opacity-20"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "10px 10px",
          color: "white",
        }}
      />
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  linkLabel,
  to,
}: {
  prompt: string;
  linkLabel: string;
  to: string;
}) {
  return (
    <p className="mt-8 text-center text-sm text-muted-foreground">
      {prompt}{" "}
      <Link to={to} className="font-medium text-primary hover:underline">
        {linkLabel}
      </Link>
    </p>
  );
}
