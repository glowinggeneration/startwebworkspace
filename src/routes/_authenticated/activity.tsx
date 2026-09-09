import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyLogForm } from "@/components/application/activity/daily-log-form";
import { WeeklyReviewForm } from "@/components/application/activity/weekly-review-form";

export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  return (
    <div className="section-stack p-8">
      <div>
        <h1 className="type-display">Activity</h1>
        <p className="type-body text-muted-foreground">
          Fill this in before you leave the desk. It's what the pace numbers come
          from.
        </p>
      </div>
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekly">Weekly review</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">
          <DailyLogForm />
        </TabsContent>
        <TabsContent value="weekly" className="mt-4">
          <WeeklyReviewForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
