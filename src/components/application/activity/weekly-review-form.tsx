import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useProfile } from "@/hooks/use-profile";
import { useWeeklyReview, useSaveWeeklyReview } from "@/hooks/use-weekly-reviews";

/** The Friday on or after today, as an ISO date. */
function upcomingFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  return friday.toISOString().slice(0, 10);
}

interface WeeklyReviewValues {
  question1: string;
  question2: string;
  question3: string;
  callingBlockKept: boolean;
  nextWeekNotes: string;
}

export function WeeklyReviewForm() {
  const { workspaceId } = useActiveWorkspace();
  const { data: profile } = useProfile();
  const weekEnding = upcomingFriday();
  const { data: existing } = useWeeklyReview(workspaceId, profile?.id ?? "", weekEnding);
  const saveReview = useSaveWeeklyReview(workspaceId);

  const form = useForm<WeeklyReviewValues>({
    defaultValues: {
      question1: "",
      question2: "",
      question3: "",
      callingBlockKept: false,
      nextWeekNotes: "",
    },
  });

  useEffect(() => {
    if (existing) {
      form.reset({
        question1: existing.question_1 ?? "",
        question2: existing.question_2 ?? "",
        question3: existing.question_3 ?? "",
        callingBlockKept: existing.calling_block_kept ?? false,
        nextWeekNotes: existing.next_week_notes ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  async function onSubmit(values: WeeklyReviewValues) {
    if (!profile) return;
    try {
      await saveReview.mutateAsync({
        user_id: profile.id,
        week_ending: weekEnding,
        question_1: values.question1 || null,
        question_2: values.question2 || null,
        question_3: values.question3 || null,
        calling_block_kept: values.callingBlockKept,
        next_week_notes: values.nextWeekNotes || null,
      });
      toast.success("Weekly review saved");
    } catch (error) {
      toast.error("Couldn't save the review", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="card-surface space-y-5 p-5">
      <div>
        <h2 className="type-section">Week ending {weekEnding}</h2>
        <p className="type-meta text-muted-foreground">
          Argue with the numbers, not the weather — one sentence each.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="q1">
          If I only called the way I did this week, what does next month's invoice book look like?
        </Label>
        <Textarea id="q1" rows={2} {...form.register("question1")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="q2">
          Which industry produced real conversations, and which was just motion?
        </Label>
        <Textarea id="q2" rows={2} {...form.register("question2")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="q3">
          Which open deal has no date on the next step, and why is it still on the board?
        </Label>
        <Textarea id="q3" rows={2} {...form.register("question3")} />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="calling-block-kept"
          checked={form.watch("callingBlockKept")}
          onCheckedChange={(checked) => form.setValue("callingBlockKept", checked)}
        />
        <Label htmlFor="calling-block-kept">The 08:00–10:00 calling block was kept this week</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="next-week-notes">Next week's plan</Label>
        <Textarea id="next-week-notes" rows={3} {...form.register("nextWeekNotes")} />
      </div>

      <Button type="submit" disabled={saveReview.isPending || !profile}>
        {saveReview.isPending ? "Saving…" : "Save weekly review"}
      </Button>
    </form>
  );
}
