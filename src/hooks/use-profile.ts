import { useQuery } from "@tanstack/react-query";
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
