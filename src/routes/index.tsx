import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuroraText } from "@/components/vendor/magicui/aurora-text";
import { Highlighter } from "@/components/vendor/magicui/highlighter";
import { TextAnimate } from "@/components/vendor/magicui/text-animate";
import { SpotlightNavbar } from "@/components/vendor/vengeance/navbar-docs/spotlight-navbar";
import { HighlightGrid } from "@/components/vendor/vengeance/layout-cards/highlight-grid";
import { FaqAccordion } from "@/components/vendor/vengeance/tooltip-marquee/faq-accordion";
import AnimatedButton from "@/components/vendor/vengeance/buttons/animated-button";

// A full marketing landing page (mega nav, bento grid, testimonials, device
// mockups) is Phase 6 — see docs/ui-components/COMPONENT_MAP.md. This wires
// in a first real pass at that phase rather than a blank or default page.
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

const WORKFLOW_ROWS = [
  [
    { label: "Pipeline", color: "#2176FF" },
    { label: "Deals", color: "#4381C1" },
  ],
  [
    { label: "Projects", color: "#04A777" },
    { label: "Quotes", color: "#5B8C5A" },
    { label: "Invoices", color: "#22AAA1" },
  ],
  [
    { label: "Workload", color: "#F79824" },
    { label: "Roles", color: "#818D92" },
  ],
];

const FAQ_ITEMS = [
  {
    question: "What does Startweb Workspace actually track?",
    answer:
      "Accounts and contacts, your sales pipeline, the projects that come out of a closed-won deal, and every quote and invoice tied to them — one workspace instead of separate spreadsheets for each.",
  },
  {
    question: "What happens when I mark a deal won?",
    answer:
      "A project is created from that deal automatically, carrying over the account and owner, so delivery starts from the same record sales closed.",
  },
  {
    question: "Can a client see their own projects?",
    answer:
      "Client-role members are scoped to their own account's projects, quotes and invoices only — enforced at the database level, not just hidden in the UI.",
  },
  {
    question: "How does invoicing work?",
    answer:
      "Quotes convert straight into invoices with the same line items, each numbered per workspace, with payments recorded against the outstanding balance and a downloadable PDF for both.",
  },
  {
    question: "How do team members get added?",
    answer:
      "An owner or admin sends an invite from Settings; the invited person picks a role (owner, admin, sales, PM, member or client) that determines what they can see.",
  },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="px-4">
        <SpotlightNavbar
          items={[
            { label: "How it works", href: "#how-it-works" },
            { label: "FAQ", href: "#faq" },
          ]}
          onItemClick={(item) => scrollToId(item.href.slice(1))}
        />
      </div>

      <section className="relative isolate flex min-h-[85dvh] items-center justify-center overflow-hidden bg-background">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center text-foreground">
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
            Startweb Workspace turns closed-won deals straight into tracked projects, one place for
            your team, your clients, and everything you bill them.
          </TextAnimate>
          <p className="type-body max-w-md text-muted-foreground">
            Built for teams who want <Highlighter>fewer spreadsheets</Highlighter> and a clearer
            month.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <AnimatedButton onClick={() => navigate({ to: "/register" })}>
              Get started
            </AnimatedButton>
            <Link
              to="/auth"
              className="inline-flex h-9 items-center justify-center rounded-[0.625rem] border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="type-section text-2xl font-semibold">How it fits together</h2>
        <p className="type-body mx-auto mt-2 max-w-lg text-muted-foreground">
          A deal closes, a project starts, and quoting and invoicing stay linked to both — no
          re-entering the same client details three times.
        </p>
        <div className="mt-10 flex justify-center">
          <HighlightGrid rows={WORKFLOW_ROWS} />
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-2xl px-4 pb-24">
        <FaqAccordion title="Frequently asked" items={FAQ_ITEMS} />
      </section>
    </div>
  );
}
