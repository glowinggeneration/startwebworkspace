import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type LogAuditEventArgs = Database["public"]["Functions"]["log_audit_event"]["Args"];

/**
 * Client-safe equivalent of src/lib/platform/audit-log.server.ts's
 * logAuditEventAsCaller — that file can't be imported here (TanStack
 * Start's import-protection plugin rejects any `*.server.*` import from
 * client-bundled code, see check-auth-rate-limit.ts for the same
 * boundary), but the underlying RPC is a SECURITY DEFINER function
 * designed to be called with the authenticated (publishable-key) client:
 * the actor id comes from auth.uid() inside the function, never from
 * this call's arguments.
 */
export async function logAuditEvent(input: {
  action: LogAuditEventArgs["_action"];
  resourceTable: LogAuditEventArgs["_resource_table"];
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.rpc("log_audit_event", {
    _action: input.action,
    _resource_table: input.resourceTable,
    _resource_id: input.resourceId,
    _metadata: (input.metadata ?? {}) as Database["public"]["Tables"] extends never
      ? never
      : LogAuditEventArgs["_metadata"],
  });
  if (error) {
    // Best-effort: a failed audit write shouldn't block the action it's
    // describing, but it should be visible somewhere.
    console.error("[audit] log_audit_event failed:", error.message);
  }
}
