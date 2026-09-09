import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Not signed in");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", userData.user.id)
        .single();

      if (error) throw error;
      return data;
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
