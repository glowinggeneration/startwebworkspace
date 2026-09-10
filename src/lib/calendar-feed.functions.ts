import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CalendarFeed {
  path: string;
  createdAt: string;
  lastAccessedAt: string | null;
}

async function membershipFor(
  supabase: { from: (table: string) => any },
  userId: string,
  workspaceId: string,
) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You are not a member of this workspace.");
}

function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function validate(input: { workspaceId: string }) {
  const workspaceId = String(input?.workspaceId ?? "");
  if (!workspaceId) throw new Error("A workspace is required.");
  return { workspaceId };
}

/** Returns this person's private calendar subscription link, creating it once. */
export const getCalendarFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<CalendarFeed> => {
    const { supabase, userId } = context;
    await membershipFor(supabase as never, userId, data.workspaceId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existing = await supabaseAdmin
      .from("calendar_feed_tokens")
      .select("token, created_at, last_accessed_at")
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);

    if (existing.data) {
      return {
        path: `/api/public/calendar/${existing.data.token}.ics`,
        createdAt: existing.data.created_at,
        lastAccessedAt: existing.data.last_accessed_at,
      };
    }

    const token = newToken();
    const inserted = await supabaseAdmin
      .from("calendar_feed_tokens")
      .insert({ workspace_id: data.workspaceId, user_id: userId, token })
      .select("token, created_at, last_accessed_at")
      .single();
    if (inserted.error) throw new Error(inserted.error.message);

    return {
      path: `/api/public/calendar/${inserted.data.token}.ics`,
      createdAt: inserted.data.created_at,
      lastAccessedAt: inserted.data.last_accessed_at,
    };
  });

/** Replaces the link, so any calendar app still holding the old one stops updating. */
export const rotateCalendarFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<CalendarFeed> => {
    const { supabase, userId } = context;
    await membershipFor(supabase as never, userId, data.workspaceId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = newToken();
    const upserted = await supabaseAdmin
      .from("calendar_feed_tokens")
      .upsert(
        {
          workspace_id: data.workspaceId,
          user_id: userId,
          token,
          created_at: new Date().toISOString(),
          last_accessed_at: null,
        },
        { onConflict: "workspace_id,user_id" },
      )
      .select("token, created_at, last_accessed_at")
      .single();
    if (upserted.error) throw new Error(upserted.error.message);

    return {
      path: `/api/public/calendar/${upserted.data.token}.ics`,
      createdAt: upserted.data.created_at,
      lastAccessedAt: upserted.data.last_accessed_at,
    };
  });
