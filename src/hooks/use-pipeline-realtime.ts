import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps the pipeline views current. When anyone on the team adds or changes a
 * client, contact, deal, project, phase, task or campaign, the change arrives
 * over the live connection and the affected views refetch, so nobody has to
 * reload the page. Row access still follows the workspace rules, so only
 * changes this person is allowed to see arrive here.
 */
const WATCHED_TABLES = [
  "accounts",
  "contacts",
  "deals",
  "projects",
  "project_phases",
  "tasks",
  "campaigns",
  "quotes",
  "invoices",
  "payments",
] as const;

const AFFECTED_KEYS = [
  "client-board",
  "project-board",
  "schedule",
  "campaigns",
  "workspace-tasks",
  "projects",
  "deals",
  "accounts",
  "team",
  "billing-flow",
  "quotes",
  "invoices",
];

export function usePipelineRealtime(workspaceId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    // A single change often touches several rows at once, so batch the
    // refetch briefly instead of refetching on every row.
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        for (const key of AFFECTED_KEYS) {
          void queryClient.invalidateQueries({ queryKey: [key, workspaceId] });
        }
      }, 250);
    };

    let channel = supabase.channel(`pipeline-${workspaceId}`);
    for (const table of WATCHED_TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `workspace_id=eq.${workspaceId}`,
        },
        scheduleRefresh,
      );
    }
    channel.subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [queryClient, workspaceId]);
}
