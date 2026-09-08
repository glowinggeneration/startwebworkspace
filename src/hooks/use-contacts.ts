import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];

export function useContacts(workspaceId: string, accountId: string) {
  return useQuery({
    queryKey: ["contacts", workspaceId, accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email, phone, role_title")
        .eq("workspace_id", workspaceId)
        .eq("account_id", accountId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateContact(workspaceId: string, accountId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<ContactInsert, "workspace_id" | "account_id">) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ ...input, workspace_id: workspaceId, account_id: accountId })
        .select("id, name, email, phone, role_title")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contacts", workspaceId, accountId] });
    },
  });
}
