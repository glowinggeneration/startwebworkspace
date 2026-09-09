import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Monitor } from "lucide-react";
import { ShineBorder } from "@/components/vendor/magicui/shine-border";
import { TextAnimate } from "@/components/vendor/magicui/text-animate";


/**
 * Adapted from the supplied Split-Screen Registration Page component
 * (docs/ui-components/COMPONENT_MAP.md) — same two-panel structure,
 * restyled onto our semantic design tokens instead of the original's
 * hardcoded dark palette, and with the actual page content passed in.
 */
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
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <div className="relative flex min-h-[32vh] w-full flex-col justify-between overflow-hidden bg-primary text-primary-foreground lg:min-h-screen lg:w-1/2">
        <div className="relative z-10 flex items-center justify-between p-8 lg:p-10">
          <img src="/brand/startweb-white.svg" alt="Startweb" className="h-6 w-auto" />
        </div>
        <div className="relative z-10 p-8 pb-16 lg:p-10 lg:pb-20">
          <h1 className="mb-4 max-w-md text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            {headline}
          </h1>
          <p className="max-w-md text-base text-primary-foreground/85">{subhead}</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div
            role="status"
            className="rounded-2xl border border-border bg-muted/50 p-6 text-center md:hidden"
          >
            <Monitor className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden />
            <h2 className="text-base font-semibold tracking-tight">
              Use a desktop or tablet
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Startweb is designed for larger screens. Please sign in from a
              desktop or tablet to continue.
            </p>
          </div>
          <div className="hidden md:block">{children}</div>
        </div>
      </div>
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
