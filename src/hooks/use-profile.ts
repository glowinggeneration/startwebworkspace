import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Per-user flags that change how the workspace looks for one person
 * without touching the default experience everyone else gets — e.g. an
 * individual's request to simplify their own nav or add a control the
 * rest of the team hasn't asked for yet. */
export interface ProfilePreferences {
  hideCampaigns?: boolean;
  showStagePicker?: boolean;
  /** Shows the Operations screens: today's working list, the nightly
   * close, the week and the month pack. */
  showOperations?: boolean;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Not signed in");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, job_title, preferences")
        .eq("id", userData.user.id)
        .single();

      if (error) throw error;
      return { ...data, preferences: (data.preferences as ProfilePreferences | null) ?? {} };
    },
  });
}

/** Updates the signed-in user's own display name. RLS restricts the write
 * to their own profile row. */
export function useUpdateProfileName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fullName: string) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userData.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
    },
  });
}
