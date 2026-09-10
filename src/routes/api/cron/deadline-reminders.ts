import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Daily trigger target for Lovable's scheduled function — configure a
 * schedule against this path in the Lovable project settings, once a day.
 * Bearer-token authenticated via LOVABLE_CRON_SECRET (see cron-auth.ts);
 * unreachable without it, so this can't be used to spam client inboxes on
 * demand by anyone who finds the URL.
 */
export const Route = createFileRoute("/api/cron/deadline-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await authenticateCronRequest(request);
        if (authError) return authError;

        try {
          const { sendDeadlineReminders } = await import("@/lib/deadline-reminders.server");
          const result = await sendDeadlineReminders();
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "Unknown error";
          console.error(`[deadline-reminders] failed: ${message}`);
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
