import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Toaster } from "../components/ui/sonner";
import { ThemeProvider } from "../components/providers/theme-provider";
import appCss from "../styles.css?url";

function LostBulbIllustration() {
  return (
    <svg viewBox="0 0 200 220" fill="none" aria-hidden="true" className="h-52 w-52 text-[#164BFA]">
      <circle cx="100" cy="108" r="88" className="fill-[#164BFA]/[0.05]" />
      {/* Bulb glass, cracked */}
      <path
        d="M100 28c-30 0-52 22-52 50 0 17 8 31 20 40 6 5 10 12 12 20l2 10h36l2-10c2-8 6-15 12-20 12-9 20-23 20-40 0-28-22-50-52-50Z"
        className="fill-white stroke-[#164BFA]/70"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Crack */}
      <path
        d="M112 32 104 52l10 10-8 14 12 10-6 14"
        className="stroke-[#164BFA]"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Filament suggestion */}
      <path
        d="M84 116c4-10 12-16 16-16s12 6 16 16"
        className="stroke-[#164BFA]/40"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Base */}
      <rect x="80" y="150" width="40" height="8" rx="4" className="fill-[#164BFA]" />
      <rect x="82" y="162" width="36" height="8" rx="4" className="fill-[#164BFA]" />
      <rect x="84" y="174" width="32" height="8" rx="4" className="fill-[#164BFA]" />
      <path d="M90 184h20l-4 12a6 6 0 0 1-12 0l-4-12Z" className="fill-[#164BFA]" />
    </svg>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EDEEF2] px-4 py-10">
      <div className="w-full max-w-4xl rounded-[28px] bg-white px-6 py-14 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)] sm:px-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#164BFA]">Startweb</p>
        <div className="mt-8 flex flex-col items-center gap-10 md:flex-row md:items-center md:gap-16">
          <div className="shrink-0">
            <LostBulbIllustration />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-7xl font-extrabold tracking-tight text-[#164BFA] sm:text-8xl">
              404
            </h1>
            <h2 className="mt-4 text-lg font-bold uppercase tracking-wide text-foreground">
              Looks like you're lost
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              The page you're looking for isn't available. It may have been moved or the link is out
              of date.
            </p>
            <div className="mt-8">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-3 rounded-xl bg-[#164BFA] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all hover:bg-[#164BFA]/90 active:scale-[0.98]"
              >
                Go to dashboard
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          We couldn't load this page right now.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing was lost. Try again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Startweb Workspace" },
      {
        name: "description",
        content: "Pipeline, delivery and invoicing for one agency workspace.",
      },
      { property: "og:title", content: "Startweb Workspace" },
      {
        property: "og:description",
        content: "Pipeline, delivery and invoicing for one agency workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
