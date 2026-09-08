import { useRouteContext } from "@tanstack/react-router";

/**
 * The workspace the current screen operates in. Phase 1 assumes a single
 * active workspace per user (the first membership) — a workspace switcher
 * is Phase 4 scope once multi-workspace membership is actually exercised.
 */
export function useActiveWorkspace() {
  const { memberships } = useRouteContext({ from: "/_authenticated" });
  const membership = memberships[0];
  if (!membership) {
    throw new Error("useActiveWorkspace called without a workspace membership");
  }
  return membership;
}
