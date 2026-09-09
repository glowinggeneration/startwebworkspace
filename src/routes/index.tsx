import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

// A full marketing landing page (mega nav, bento grid, testimonials, device
// mockups) is Phase 6 — see docs/ui-components/COMPONENT_MAP.md. This is a
// minimal, real placeholder rather than a blank or default-framework page.
export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="type-display max-w-xl">Pipeline, delivery and invoicing in one workspace.</h1>
      <p className="type-body max-w-md text-muted-foreground">
        Startweb Workspace turns closed-won deals straight into tracked projects, one place for
        your team, your clients, and everything you bill them.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/register">Get started</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
