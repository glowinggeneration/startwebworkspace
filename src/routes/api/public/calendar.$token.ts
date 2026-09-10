import { createFileRoute } from "@tanstack/react-router";

/**
 * Public, unguessable calendar feed. The long random token in the URL is the
 * only credential, so it is matched against a single workspace and nothing
 * else is exposed. Calendar apps poll this endpoint on their own schedule.
 */
export const Route = createFileRoute("/api/public/calendar/$token")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const token = String(params.token ?? "").replace(/\.ics$/i, "");
        if (!/^[a-f0-9]{32,64}$/.test(token)) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("calendar_feed_tokens")
          .select("workspace_id, workspaces(name)")
          .eq("token", token)
          .maybeSingle();

        if (error) {
          console.error(`[calendar-feed] lookup failed: ${error.message}`);
          return new Response("Calendar unavailable", { status: 500 });
        }
        if (!data) return new Response("Not found", { status: 404 });

        const workspaceName =
          (data.workspaces as { name: string } | null)?.name ?? "Startweb workspace";

        try {
          const { buildWorkspaceCalendar } = await import("@/lib/calendar-feed.server");
          const origin = new URL(request.url).origin;
          const body = await buildWorkspaceCalendar(data.workspace_id, workspaceName, origin);

          void supabaseAdmin
            .from("calendar_feed_tokens")
            .update({ last_accessed_at: new Date().toISOString() })
            .eq("token", token)
            .then(() => undefined);

          return new Response(body, {
            status: 200,
            headers: {
              "Content-Type": "text/calendar; charset=utf-8",
              "Content-Disposition": 'inline; filename="startweb-deadlines.ics"',
              "Cache-Control": "no-cache, max-age=0",
            },
          });
        } catch (cause) {
          console.error(
            `[calendar-feed] build failed: ${cause instanceof Error ? cause.message : "unknown"}`,
          );
          return new Response("Calendar unavailable", { status: 500 });
        }
      },
    },
  },
});
