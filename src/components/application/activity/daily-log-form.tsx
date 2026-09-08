import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useProfile } from "@/hooks/use-profile";
import { useIndustries } from "@/hooks/use-industries";
import { useLogDailyActivity, useMonthlyActivity } from "@/hooks/use-daily-activity";
import { currentMonthKey } from "@/lib/sales/month";

const NUMERIC_FIELDS = [
  { name: "touches", label: "Touches" },
  { name: "conversations", label: "People who spoke back" },
  { name: "meetingsBooked", label: "Meetings booked" },
  { name: "meetingsHeld", label: "Meetings held" },
  { name: "offersSent", label: "Written offers sent" },
  { name: "wins", label: "Wins (count)" },
] as const;

const dailyLogSchema = z.object({
  industryFocusId: z.string().optional(),
  touches: z.coerce.number().min(0),
  conversations: z.coerce.number().min(0),
  meetingsBooked: z.coerce.number().min(0),
  meetingsHeld: z.coerce.number().min(0),
  offersSent: z.coerce.number().min(0),
  wins: z.coerce.number().min(0),
  hoursCalling: z.coerce.number().min(0),
  notesForTomorrow: z.string().optional(),
});
type DailyLogInput = z.input<typeof dailyLogSchema>;
type DailyLogOutput = z.output<typeof dailyLogSchema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyLogForm() {
  const { workspaceId } = useActiveWorkspace();
  const { data: profile } = useProfile();
  const { data: industries } = useIndustries(workspaceId);
  const { data: monthRows } = useMonthlyActivity(workspaceId, currentMonthKey());
  const logActivity = useLogDailyActivity(workspaceId);

  const todaysRow = monthRows?.find((row) => row.log_date === today());

  const form = useForm<DailyLogInput, unknown, DailyLogOutput>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      industryFocusId: "",
      touches: 0,
      conversations: 0,
      meetingsBooked: 0,
      meetingsHeld: 0,
      offersSent: 0,
      wins: 0,
      hoursCalling: 0,
      notesForTomorrow: "",
    },
  });

  useEffect(() => {
    if (todaysRow) {
      form.reset({
        industryFocusId: todaysRow.industry_focus_id ?? "",
        touches: todaysRow.touches,
        conversations: todaysRow.conversations,
        meetingsBooked: todaysRow.meetings_booked,
        meetingsHeld: todaysRow.meetings_held,
        offersSent: todaysRow.offers_sent,
        wins: todaysRow.wins,
        hoursCalling: todaysRow.hours_calling,
        notesForTomorrow: todaysRow.notes_for_tomorrow ?? "",
      });
    }
    // Only re-sync when today's row identity changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysRow?.id]);

  async function onSubmit(values: DailyLogOutput) {
    if (!profile) return;
    try {
      await logActivity.mutateAsync({
        userId: profile.id,
        log_date: today(),
        industry_focus_id: values.industryFocusId || null,
        touches: values.touches,
        conversations: values.conversations,
        meetings_booked: values.meetingsBooked,
        meetings_held: values.meetingsHeld,
        offers_sent: values.offersSent,
        wins: values.wins,
        hours_calling: values.hoursCalling,
        notes_for_tomorrow: values.notesForTomorrow || null,
      });
      toast.success("Today's activity saved");
    } catch (error) {
      toast.error("Couldn't save today's activity", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="card-surface space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="type-section">Today — {today()}</h2>
          <FormField
            control={form.control}
            name="industryFocusId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Industry focus" />
                </SelectTrigger>
                <SelectContent>
                  {industries?.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {NUMERIC_FIELDS.map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={
                        typeof field.value === "number" ? field.value : String(field.value ?? "")
                      }
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FormField
            control={form.control}
            name="hoursCalling"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours calling</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    value={
                      typeof field.value === "number" ? field.value : String(field.value ?? "")
                    }
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notesForTomorrow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes for tomorrow</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={logActivity.isPending || !profile}>
          {logActivity.isPending ? "Saving…" : "Save today's activity"}
        </Button>
      </form>
    </Form>
  );
}
