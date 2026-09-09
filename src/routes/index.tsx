import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/vendor/magicui/aurora-text";
import { Highlighter } from "@/components/vendor/magicui/highlighter";
import { TextAnimate } from "@/components/vendor/magicui/text-animate";

// A full marketing landing page (mega nav, bento grid, testimonials, device
// mockups) is Phase 6 — see docs/ui-components/COMPONENT_MAP.md. This is a
// minimal, real placeholder rather than a blank or default-framework page.
export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Startweb Workspace | Pipeline, delivery and invoicing" },
      {
        name: "description",
        content:
          "Startweb Workspace turns closed-won deals into tracked projects, with quoting, invoicing and team workload in one place.",
      },
      {
        property: "og:title",
        content: "Startweb Workspace | Pipeline, delivery and invoicing",
      },
      {
        property: "og:description",
        content: "One workspace for your pipeline, your delivery team and everything you bill.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="type-display max-w-xl">
        Pipeline, delivery and invoicing in <AuroraText>one workspace</AuroraText>.
      </h1>
      <TextAnimate
        as="p"
        by="word"
        animation="blurInUp"
        delay={0.1}
        className="type-body max-w-md text-muted-foreground"
      >
        Startweb Workspace turns closed-won deals straight into tracked projects, one place for your
        team, your clients, and everything you bill them.
      </TextAnimate>
      <p className="type-body max-w-md text-muted-foreground">
        Built for teams who want <Highlighter>fewer spreadsheets</Highlighter> and a clearer month.
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
