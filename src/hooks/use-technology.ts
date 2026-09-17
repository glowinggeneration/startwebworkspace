import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectTech {
  id: string;
  project_id: string;
  builder_id: string | null;
  designer_id: string | null;
  domain: string | null;
  hosting: string | null;
  ssl_status: string | null;
  tech_stack: string | null;
  repo_url: string | null;
  staging_url: string | null;
  live_url: string | null;
  launch_date: string | null;
  maintenance_notes: string | null;
  notes: string | null;
}

export interface QaSubmission {
  id: string;
  project_id: string;
  submitted_by: string | null;
  submitted_at: string;
  notes: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

export interface ProjectBlocker {
  id: string;
  project_id: string;
  kind: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

/** Projects with their production stage, used by every technology screen. */
export function useProductionProjects(workspaceId: string) {
  return useQuery({
    queryKey: ["production-projects", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, name, status, account_id, owner_id, production_stage, due_date, created_at",
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProjectTech(workspaceId: string) {
  return useQuery({
    queryKey: ["project-tech", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tech")
        .select(
          "id, project_id, builder_id, designer_id, domain, hosting, ssl_status, tech_stack, repo_url, staging_url, live_url, launch_date, maintenance_notes, notes",
        )
        .eq("workspace_id", workspaceId);
      if (error) throw error;
      return data as ProjectTech[];
    },
  });
}

export function useQaSubmissions(workspaceId: string) {
  return useQuery({
    queryKey: ["qa-submissions", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_submissions")
        .select(
          "id, project_id, submitted_by, submitted_at, notes, status, reviewed_by, reviewed_at, review_notes",
        )
        .eq("workspace_id", workspaceId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as QaSubmission[];
    },
  });
}

export function useProjectBlockers(workspaceId: string) {
  return useQuery({
    queryKey: ["project-blockers", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_blockers")
        .select("id, project_id, kind, description, status, created_at, resolved_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectBlocker[];
    },
  });
}

export function useSetProductionStage(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase
        .from("projects")
        .update({ production_stage: stage })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["production-projects", workspaceId] });
    },
  });
}

export function useSaveProjectTech(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ProjectTech> & { project_id: string }) => {
      const { error } = await supabase
        .from("project_tech")
        .upsert({ ...values, workspace_id: workspaceId }, { onConflict: "project_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-tech", workspaceId] });
    },
  });
}

export function useSubmitForQa(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, notes }: { projectId: string; notes: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("qa_submissions").insert({
        workspace_id: workspaceId,
        project_id: projectId,
        submitted_by: auth.user?.id ?? null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["qa-submissions", workspaceId] });
    },
  });
}

/** Approve or send back. The policy refuses a reviewer who is the submitter. */
export function useReviewQa(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNotes,
    }: {
      id: string;
      status: "approved" | "changes_required";
      reviewNotes?: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("qa_submissions")
        .update({
          status,
          reviewed_by: auth.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["qa-submissions", workspaceId] });
    },
  });
}

export function useAddBlocker(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      kind,
      description,
    }: {
      projectId: string;
      kind: string;
      description: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("project_blockers").insert({
        workspace_id: workspaceId,
        project_id: projectId,
        kind,
        description,
        raised_by: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-blockers", workspaceId] });
    },
  });
}

export function useResolveBlocker(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_blockers")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-blockers", workspaceId] });
    },
  });
}
