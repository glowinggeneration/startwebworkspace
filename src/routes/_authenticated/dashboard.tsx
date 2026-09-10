import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Plus } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import {
  CommandBoard,
  type DashboardPeriod,
} from "@/components/application/dashboard/command-board";
import { WorkspaceOverview } from "@/components/application/dashboard/workspace-overview";
import { DailyLogForm } from "@/components/application/activity/daily-log-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { currentMonthKey } from "@/lib/sales/month";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Overview | Startweb workspace" },
      {
        name: "description",
        content:
          "Track the monthly revenue target, outreach activity and calling block for your Startweb workspace.",
      },
      { property: "og:title", content: "Overview | Startweb workspace" },
      {
        property: "og:description",
        content: "Monthly target, outreach pace and revenue progress in one view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

/** The last twelve months, newest first, for the date control. */
function monthOptions(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    return {
      value,
      label: date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" }),
    };
  });
}

function DashboardPage() {
  const { data: profile } = useProfile();
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [month, setMonth] = useState(currentMonthKey());
  const [logOpen, setLogOpen] = useState(false);
  const months = monthOptions();

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="type-display text-4xl font-bold tracking-tight">Overview</h1>
          <p className="type-body mt-1 text-muted-foreground">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-11 w-52" aria-label="Select month">
              <CalendarDays className="size-4 text-primary" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={logOpen} onOpenChange={setLogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 gap-2">
                <Plus className="size-4" aria-hidden="true" /> Log activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log today's activity</DialogTitle>
                <DialogDescription>
                  These numbers feed the pace and coverage figures on this page.
                </DialogDescription>
              </DialogHeader>
              <DailyLogForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={period} onValueChange={(value) => setPeriod(value as DashboardPeriod)}>
        <TabsList aria-label="Reporting period">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>
      </Tabs>

      <CommandBoard month={month} period={period} periodLabel={PERIOD_LABEL[period]} />

      <WorkspaceOverview />
    </div>
  );
}
