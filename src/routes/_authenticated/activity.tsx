import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { DailyLogForm } from "@/components/application/activity/daily-log-form";
import { WeeklyReviewForm } from "@/components/application/activity/weekly-review-form";
import {
  PageHeader,
  Panel,
  Toolbar,
  UnderlineTabs,
} from "@/components/application/shell/page-parts";

export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
  head: () => ({
    meta: [
      { title: "Activity | Startweb" },
      {
        name: "description",
        content: "Log daily calls, meetings and quotes so the pace numbers stay honest.",
      },
      { property: "og:title", content: "Activity | Startweb" },
      { property: "og:description", content: "Daily activity logging and weekly review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ActivityPage() {
  const [tab, setTab] = useState<"today" | "weekly">("today");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Activity"
        description="Fill this in before you leave the desk. It's what the pace numbers come from."
        actions={
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Activity date"
            className="h-11 w-48 bg-card"
          />
        }
      />

      <UnderlineTabs
        ariaLabel="Activity views"
        value={tab}
        onValueChange={setTab}
        options={[
          { value: "today", label: "Today" },
          { value: "weekly", label: "Weekly review" },
        ]}
      />

      {tab === "today" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <DailyLogForm />
          <Panel className="h-fit p-6">
            <h2 className="text-lg font-semibold text-foreground">Tomorrow's priorities</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Three things that move a deal forward, written before you close the laptop.
            </p>
            <ol className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                Follow up on the oldest open deal in your pipeline.
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                Send any quote a client is waiting on.
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                Book your calling block for the morning.
              </li>
            </ol>
          </Panel>
        </div>
      ) : (
        <Toolbar className="block">
          <WeeklyReviewForm />
        </Toolbar>
      )}
    </div>
  );
}
