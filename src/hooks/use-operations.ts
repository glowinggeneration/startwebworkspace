import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * The operations layer: what was actually worked on each day, stored once
 * against a company and a date, so days, weeks and months are sums of
 * stored rows rather than numbers typed onto a screen.
 */

export const ACTIVITY_TYPES = [
  { value: "outreach", label: "Outreach", counts: "Touches" },
  { value: "conversation", label: "Conversation", counts: "People who spoke" },
  { value: "research", label: "Research", counts: "Research hours" },
  { value: "meeting_booked", label: "Meeting booked", counts: "Meetings" },
  { value: "meeting_held", label: "Meeting held", counts: "Meetings" },
  { value: "offer", label: "Written offer", counts: "Offers" },
  { value: "content", label: "Content", counts: "Content units" },
  { value: "follow_up", label: "Account follow-up", counts: "Farming actions" },
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number]["value"];

export const OUTCOMES = [
  { value: "no_answer", label: "No answer" },
  { value: "left_note", label: "Left note" },
  { value: "spoke", label: "Spoke" },
  { value: "meeting", label: "Meeting" },
  { value: "research", label: "Research" },
  { value: "not_a_fit", label: "Not a fit" },
  { value: "later", label: "Later" },
] as const;

export type OutcomeValue = (typeof OUTCOMES)[number]["value"];

export interface ActivityEvent {
  id: string;
  user_id: string;
  account_id: string | null;
  event_date: string;
  event_type: string;
  outcome: string | null;
  notes: string | null;
  hours: number;
  units: number;
  contact_name: string | null;
  list_import_id: string | null;
}

export interface OpsAccount {
  id: string;
  name: string;
  world: string;
  next_step: string | null;
  next_date: string | null;
  ops_status: string | null;
  source: string | null;
  industry_id: string | null;
  list_import_id: string | null;
  contacts: { id: string; name: string; phone: string | null; role_title: string | null }[];
}

const EVENT_COLUMNS =
  "id, user_id, account_id, event_date, event_type, outcome, notes, hours, units, contact_name, list_import_id";

export function useActivityEvents(workspaceId: string, from: string, to: string) {
  return useQuery({
    queryKey: ["activity-events", workspaceId, from, to],
    queryFn: async (): Promise<ActivityEvent[]> => {
      const { data, error } = await supabase
        .from("activity_events")
        .select(EVENT_COLUMNS)
        .eq("workspace_id", workspaceId)
        .gte("event_date", from)
        .lte("event_date", to)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ActivityEvent[];
    },
  });
}

export function useLogActivity(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      accountId: string | null;
      eventDate: string;
      eventType: ActivityType;
      outcome?: OutcomeValue | null;
      notes?: string | null;
      hours?: number;
      units?: number;
      contactName?: string | null;
      listImportId?: string | null;
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Not signed in");
      const { error } = await supabase.from("activity_events").insert({
        workspace_id: workspaceId,
        user_id: userData.user.id,
        account_id: input.accountId,
        event_date: input.eventDate,
        event_type: input.eventType,
        outcome: input.outcome ?? null,
        notes: input.notes ?? null,
        hours: input.hours ?? 0,
        units: input.units ?? 1,
        contact_name: input.contactName ?? null,
        list_import_id: input.listImportId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["activity-events", workspaceId] });
    },
  });
}

export function useDeleteActivity(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("activity_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["activity-events", workspaceId] });
    },
  });
}

/** Every company the desk touches: targeted prospects and existing clients
 * share one record and are split by the `world` field. */
export function useOpsAccounts(workspaceId: string) {
  return useQuery({
    queryKey: ["ops-accounts", workspaceId],
    queryFn: async (): Promise<OpsAccount[]> => {
      const { data, error } = await supabase
        .from("accounts")
        .select(
          "id, name, world, next_step, next_date, ops_status, source, industry_id, list_import_id, contacts(id, name, phone, role_title)",
        )
        .eq("workspace_id", workspaceId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as OpsAccount[];
    },
  });
}

export function useUpdateAccountMotion(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      next_step?: string | null;
      next_date?: string | null;
      ops_status?: string | null;
      world?: string;
    }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("accounts").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ops-accounts", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["accounts", workspaceId] });
    },
  });
}

export interface DayRow {
  id: string;
  log_date: string;
  theme: string | null;
  calling_block_kept: boolean | null;
  touches: number;
  conversations: number;
  meetings_booked: number;
  meetings_held: number;
  offers_sent: number;
  wins: number;
  hours_calling: number;
  research_hours: number;
  content_units: number;
  follow_ups: number;
  list_file_name: string | null;
  notes_for_tomorrow: string | null;
  closed_at: string | null;
}

const DAY_COLUMNS =
  "id, log_date, theme, calling_block_kept, touches, conversations, meetings_booked, meetings_held, offers_sent, wins, hours_calling, research_hours, content_units, follow_ups, list_file_name, notes_for_tomorrow, closed_at";

export function useDayRows(workspaceId: string, from: string, to: string) {
  return useQuery({
    queryKey: ["ops-days", workspaceId, from, to],
    queryFn: async (): Promise<DayRow[]> => {
      const { data, error } = await supabase
        .from("daily_activity_log")
        .select(DAY_COLUMNS)
        .eq("workspace_id", workspaceId)
        .gte("log_date", from)
        .lte("log_date", to)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data as DayRow[];
    },
  });
}

export function useCloseDay(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      logDate: string;
      theme: string | null;
      callingBlockKept: boolean;
      totals: ActivityTotals;
      listFileName: string | null;
      notesForTomorrow: string | null;
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Not signed in");
      const { error } = await supabase.from("daily_activity_log").upsert(
        {
          workspace_id: workspaceId,
          user_id: userData.user.id,
          log_date: input.logDate,
          theme: input.theme,
          calling_block_kept: input.callingBlockKept,
          touches: input.totals.outreach,
          conversations: input.totals.conversations,
          meetings_booked: input.totals.meetingsBooked,
          meetings_held: input.totals.meetingsHeld,
          offers_sent: input.totals.offers,
          hours_calling: input.totals.outreachHours,
          research_hours: input.totals.researchHours,
          content_units: input.totals.content,
          follow_ups: input.totals.followUps,
          list_file_name: input.listFileName,
          notes_for_tomorrow: input.notesForTomorrow,
          closed_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,user_id,log_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ops-days", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["daily-activity", workspaceId] });
    },
  });
}

export interface ActivityTotals {
  outreach: number;
  conversations: number;
  meetingsBooked: number;
  meetingsHeld: number;
  offers: number;
  content: number;
  followUps: number;
  researchHours: number;
  outreachHours: number;
}

export function emptyTotals(): ActivityTotals {
  return {
    outreach: 0,
    conversations: 0,
    meetingsBooked: 0,
    meetingsHeld: 0,
    offers: 0,
    content: 0,
    followUps: 0,
    researchHours: 0,
    outreachHours: 0,
  };
}

export function totalsFromEvents(events: ActivityEvent[]): ActivityTotals {
  return events.reduce((totals, event) => {
    const units = event.units || 1;
    switch (event.event_type) {
      case "outreach":
        totals.outreach += units;
        totals.outreachHours += Number(event.hours) || 0;
        break;
      case "conversation":
        totals.conversations += units;
        totals.outreachHours += Number(event.hours) || 0;
        break;
      case "research":
        totals.researchHours += Number(event.hours) || 0;
        break;
      case "meeting_booked":
        totals.meetingsBooked += units;
        break;
      case "meeting_held":
        totals.meetingsHeld += units;
        break;
      case "offer":
        totals.offers += units;
        break;
      case "content":
        totals.content += units;
        break;
      case "follow_up":
        totals.followUps += units;
        break;
      default:
        break;
    }
    return totals;
  }, emptyTotals());
}

export interface CallingListImport {
  id: string;
  file_name: string;
  list_name: string | null;
  row_count: number;
  companies_created: number;
  activities_created: number;
  imported_at: string;
}

export function useCallingListImports(workspaceId: string) {
  return useQuery({
    queryKey: ["calling-list-imports", workspaceId],
    queryFn: async (): Promise<CallingListImport[]> => {
      const { data, error } = await supabase
        .from("calling_list_imports")
        .select("id, file_name, list_name, row_count, companies_created, activities_created, imported_at")
        .eq("workspace_id", workspaceId)
        .order("imported_at", { ascending: false });
      if (error) throw error;
      return data as CallingListImport[];
    },
  });
}

export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/[^0-9]/g, "").slice(-9);
}
