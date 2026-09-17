import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  normalizeName,
  normalizePhone,
  type OpsAccount,
  type OutcomeValue,
} from "@/hooks/use-operations";

/** One row read from an uploaded calling list, after the column mapping
 * has been applied. */
export interface ImportRow {
  company: string;
  phone: string;
  activityDate: string;
  outcome: string;
  contact: string;
  industry: string;
  notes: string;
  nextStep: string;
  nextDate: string;
}

export type MatchKind = "existing" | "new" | "ambiguous" | "invalid";

export interface MatchedRow {
  row: ImportRow;
  kind: MatchKind;
  accountId: string | null;
  candidates: { id: string; name: string }[];
  problem?: string;
}

const OUTCOME_LOOKUP: Record<string, OutcomeValue> = {
  "no answer": "no_answer",
  noanswer: "no_answer",
  "left note": "left_note",
  leftnote: "left_note",
  "left message": "left_note",
  spoke: "spoke",
  spoken: "spoke",
  meeting: "meeting",
  "not a fit": "not_a_fit",
  notafit: "not_a_fit",
  later: "later",
  research: "research",
};

export function readOutcome(value: string): OutcomeValue | null {
  return OUTCOME_LOOKUP[value.trim().toLowerCase()] ?? null;
}

/** Match each row against the companies already in the workspace, on a
 * normalised company name first and a phone number second. A row never
 * creates a second company for a name we already hold. */
export function matchRows(rows: ImportRow[], accounts: OpsAccount[]): MatchedRow[] {
  const byName = new Map<string, { id: string; name: string }[]>();
  const byPhone = new Map<string, { id: string; name: string }[]>();

  for (const account of accounts) {
    const nameKey = normalizeName(account.name);
    byName.set(nameKey, [...(byName.get(nameKey) ?? []), { id: account.id, name: account.name }]);
    for (const contact of account.contacts) {
      const phoneKey = normalizePhone(contact.phone);
      if (phoneKey.length < 7) continue;
      byPhone.set(phoneKey, [
        ...(byPhone.get(phoneKey) ?? []),
        { id: account.id, name: account.name },
      ]);
    }
  }

  return rows.map((row) => {
    if (!row.company.trim()) {
      return { row, kind: "invalid" as const, accountId: null, candidates: [], problem: "No company name" };
    }
    if (!row.activityDate.trim()) {
      return { row, kind: "invalid" as const, accountId: null, candidates: [], problem: "No activity date" };
    }
    if (!readOutcome(row.outcome)) {
      return {
        row,
        kind: "invalid" as const,
        accountId: null,
        candidates: [],
        problem: `Outcome "${row.outcome || "blank"}" is not one we recognise`,
      };
    }

    const nameHits = byName.get(normalizeName(row.company)) ?? [];
    const phoneKey = normalizePhone(row.phone);
    const phoneHits = phoneKey.length >= 7 ? (byPhone.get(phoneKey) ?? []) : [];
    const hits = [...nameHits];
    for (const hit of phoneHits) {
      if (!hits.some((existing) => existing.id === hit.id)) hits.push(hit);
    }

    if (hits.length === 1) {
      return { row, kind: "existing" as const, accountId: hits[0]!.id, candidates: hits };
    }
    if (hits.length > 1) {
      return { row, kind: "ambiguous" as const, accountId: null, candidates: hits };
    }
    return { row, kind: "new" as const, accountId: null, candidates: [] };
  });
}

/** Writes the approved rows: one import record, new companies for rows we
 * have never seen, and one activity per row against its company. */
export function useCommitCallingList(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      fileName: string;
      listName: string;
      mapping: Record<string, string>;
      matches: MatchedRow[];
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Not signed in");
      const userId = userData.user.id;

      const usable = input.matches.filter(
        (match) => match.kind === "existing" || match.kind === "new",
      );

      const importId = crypto.randomUUID();
      const { error: importError } = await supabase.from("calling_list_imports").insert({
        id: importId,
        workspace_id: workspaceId,
        user_id: userId,
        file_name: input.fileName,
        list_name: input.listName || input.fileName,
        column_mapping: input.mapping,
        row_count: input.matches.length,
      });
      if (importError) throw importError;

      // New companies first, so their activities can point at them.
      const created = new Map<string, string>();
      const newRows = usable.filter((match) => match.kind === "new");
      for (const match of newRows) {
        const key = normalizeName(match.row.company);
        if (created.has(key)) continue;
        const accountId = crypto.randomUUID();
        const { error } = await supabase.from("accounts").insert({
          id: accountId,
          workspace_id: workspaceId,
          name: match.row.company.trim(),
          world: "targeted",
          ops_status: "open",
          source: input.listName || input.fileName,
          list_import_id: importId,
          next_step: match.row.nextStep || null,
          next_date: match.row.nextDate || null,
        });
        if (error) throw error;
        created.set(key, accountId);

        if (match.row.contact.trim() || match.row.phone.trim()) {
          await supabase.from("contacts").insert({
            workspace_id: workspaceId,
            account_id: accountId,
            name: match.row.contact.trim() || match.row.company.trim(),
            phone: match.row.phone.trim() || null,
            import_source: input.listName || input.fileName,
          });
        }
      }

      const events = usable.map((match) => ({
        workspace_id: workspaceId,
        user_id: userId,
        account_id: match.accountId ?? created.get(normalizeName(match.row.company)) ?? null,
        event_date: match.row.activityDate,
        event_type: readOutcome(match.row.outcome) === "spoke" ? "conversation" : "outreach",
        outcome: readOutcome(match.row.outcome),
        notes: match.row.notes || null,
        contact_name: match.row.contact || null,
        list_import_id: importId,
        units: 1,
      }));

      if (events.length > 0) {
        const { error } = await supabase.from("activity_events").insert(events);
        if (error) throw error;
      }

      // Existing companies keep moving: a row carrying a next step updates
      // the company rather than creating a duplicate.
      for (const match of usable) {
        if (match.kind !== "existing" || !match.accountId) continue;
        if (!match.row.nextStep && !match.row.nextDate) continue;
        await supabase
          .from("accounts")
          .update({
            next_step: match.row.nextStep || null,
            next_date: match.row.nextDate || null,
          })
          .eq("id", match.accountId);
      }

      await supabase
        .from("calling_list_imports")
        .update({ companies_created: created.size, activities_created: events.length })
        .eq("id", importId);

      return { companies: created.size, activities: events.length };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["calling-list-imports", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["ops-accounts", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["activity-events", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["accounts", workspaceId] });
    },
  });
}
