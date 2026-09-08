import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { currentMonthKey } from "@/lib/sales/month";
import type { FunnelStageCounts } from "@/lib/sales/funnel";

type DailyLogInsert = Database["public"]["Tables"]["daily_activity_log"]["Insert"];

export function useMonthlyActivity(workspaceId: string, month = currentMonthKey()) {
  const monthStart = month;
  const [year, monthNum] = month.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year!, monthNum!, 1)).toISOString().slice(0, 10);

  return useQuery({
    queryKey: ["daily-activity", workspaceId, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_activity_log")
        .select(
          "id, user_id, log_date, industry_focus_id, touches, conversations, meetings_booked, meetings_held, offers_sent, wins, hours_calling, notes_for_tomorrow",
        )
        .eq("workspace_id", workspaceId)
        .gte("log_date", monthStart)
        .lt("log_date", monthEnd)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function summarizeActivity(
  rows: {
    touches: number;
    conversations: number;
    meetings_booked: number;
    meetings_held: number;
    offers_sent: number;
    wins: number;
  }[],
): FunnelStageCounts {
  return rows.reduce(
    (totals, row) => ({
      touches: totals.touches + row.touches,
      conversations: totals.conversations + row.conversations,
      meetingsBooked: totals.meetingsBooked + row.meetings_booked,
      meetingsHeld: totals.meetingsHeld + row.meetings_held,
      offersSent: totals.offersSent + row.offers_sent,
      wins: totals.wins + row.wins,
    }),
    { touches: 0, conversations: 0, meetingsBooked: 0, meetingsHeld: 0, offersSent: 0, wins: 0 },
  );
}

export function useLogDailyActivity(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<DailyLogInsert, "workspace_id" | "user_id"> & { userId: string },
    ) => {
      const { userId, ...rest } = input;
      const { data, error } = await supabase
        .from("daily_activity_log")
        .upsert(
          { ...rest, workspace_id: workspaceId, user_id: userId },
          { onConflict: "workspace_id,user_id,log_date" },
        )
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["daily-activity", workspaceId] });
    },
  });
}
