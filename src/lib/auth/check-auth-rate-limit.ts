import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  checkRateLimit,
  createSupabaseRateLimitStore,
  RATE_LIMIT_PRESETS,
} from "@/lib/platform/rate-limit.server";

const inputSchema = z.object({
  email: z.string(),
  kind: z.enum(["login", "signup"]),
});

/**
 * Server-side gate in front of the client's own supabase.auth calls in
 * routes/auth.tsx and routes/register.tsx. Master Rules §6.5 requires
 * rate limiting to exist on the server, not just the client — this
 * doesn't replace the Supabase auth call itself (that stays client-side,
 * unchanged, to avoid re-plumbing session/cookie handling), it just
 * throws before the UI attempts it if the caller is over the limit.
 *
 * Keyed by email only, not IP — this deployment has no fixed hosting
 * target yet, and reliably extracting a real client IP is host-specific
 * (see docs/build-standards/EXCEPTION_REGISTER.md). Revisit once a host
 * is chosen.
 */
export const checkAuthRateLimit = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const store = createSupabaseRateLimitStore(supabaseAdmin);
    const preset = data.kind === "login" ? RATE_LIMIT_PRESETS.login : RATE_LIMIT_PRESETS.signup;

    const result = await checkRateLimit(store, {
      bucketKey: `${data.kind}:email:${data.email.trim().toLowerCase()}`,
      ...preset,
    });

    if (!result.allowed) {
      const retryMinutes = Math.ceil((result.retryAfterMs ?? preset.windowMs) / 60000);
      throw new Error(`Too many attempts. Try again in about ${retryMinutes} minute(s).`);
    }

    return { allowed: true as const };
  });
