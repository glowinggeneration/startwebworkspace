import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface EntityOutcome {
  entity: string;
  create: number;
  update: number;
  unchanged: number;
  skipped: number;
  conflicts: string[];
}

export interface ImportOutcome {
  dryRun: boolean;
  namespace: string;
  asOf: string;
  workspaceId: string;
  entities: EntityOutcome[];
}

function outcome(entity: string): EntityOutcome {
  return { entity, create: 0, update: 0, unchanged: 0, skipped: 0, conflicts: [] };
}

/**
 * Imports the reviewed conversation pack. Idempotent: rows carry an
 * import key, so re-running updates nothing and creates nothing. Values that
 * already exist in the live database are never overwritten; the difference is
 * recorded as a conflict for the review list instead.
 */
export const runConversationImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { dryRun: boolean }) => ({ dryRun: input.dryRun === true }))
  .handler(async ({ data, context }): Promise<ImportOutcome> => {
    const { supabase, userId } = context;
    const { dryRun } = data;

    const {
      conversationPack,
      INTERNAL_CONTACT_EMAILS,
      IMPORT_PHASE_NAME,
      mapProjectStatus,
      mapTaskPriority,
      mapTaskStatus,
      normalizeName,
    } = await import("@/lib/conversation-import.server");

    const { data: memberships, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", userId)
      .in("role", ["owner", "admin"]);
    if (membershipError) throw new Error(membershipError.message);
    const membershipWorkspaceId = memberships?.[0]?.workspace_id;
    if (!membershipWorkspaceId)
      throw new Error("Only workspace owners and admins can run this import.");
    const workspaceId: string = membershipWorkspaceId;

    const source = conversationPack.namespace;

    // Existing rows -------------------------------------------------------
    const [existingAccounts, existingContacts, existingProjects, existingTasks, existingNotes, existingReview, profiles] =
      await Promise.all([
        supabase.from("accounts").select("id, name, import_key").eq("workspace_id", workspaceId),
        supabase.from("contacts").select("id, import_key").eq("workspace_id", workspaceId),
        supabase.from("projects").select("id, name, import_key").eq("workspace_id", workspaceId),
        supabase.from("tasks").select("id, import_key").eq("workspace_id", workspaceId),
        supabase.from("account_notes").select("id, import_key").eq("workspace_id", workspaceId),
        supabase.from("import_review_items").select("id, import_key").eq("workspace_id", workspaceId),
        supabase.from("profiles").select("id, email"),
      ]);

    for (const result of [
      existingAccounts,
      existingContacts,
      existingProjects,
      existingTasks,
      existingNotes,
      existingReview,
      profiles,
    ]) {
      if (result.error) throw new Error(result.error.message);
    }

    const accountByKey = new Map<string, string>();
    const accountByName = new Map<string, string>();
    for (const row of existingAccounts.data ?? []) {
      if (row.import_key) accountByKey.set(row.import_key, row.id);
      accountByName.set(normalizeName(row.name), row.id);
    }
    const projectByKey = new Map<string, string>();
    const projectByName = new Map<string, string>();
    for (const row of existingProjects.data ?? []) {
      if (row.import_key) projectByKey.set(row.import_key, row.id);
      projectByName.set(normalizeName(row.name), row.id);
    }
    const contactKeys = new Set((existingContacts.data ?? []).map((r) => r.import_key));
    const taskKeys = new Set((existingTasks.data ?? []).map((r) => r.import_key));
    const noteKeys = new Set((existingNotes.data ?? []).map((r) => r.import_key));
    const reviewKeys = new Set((existingReview.data ?? []).map((r) => r.import_key));

    const profileByEmail = new Map<string, string>();
    for (const row of profiles.data ?? []) {
      if (row.email) profileByEmail.set(row.email.toLowerCase(), row.id);
    }
    function ownerIdFor(contactKey: string | null): string | null {
      if (!contactKey) return null;
      const email = INTERNAL_CONTACT_EMAILS[contactKey];
      if (!email) return null;
      return profileByEmail.get(email) ?? null;
    }

    // Accounts ------------------------------------------------------------
    const accountsOut = outcome("Clients");
    for (const account of conversationPack.accounts) {
      if (accountByKey.has(account.account_key)) {
        accountsOut.unchanged += 1;
        continue;
      }
      const nameMatch = accountByName.get(normalizeName(account.account_name));
      if (nameMatch) {
        accountsOut.skipped += 1;
        accountsOut.conflicts.push(`${account.account_name} already exists, left untouched`);
        accountByKey.set(account.account_key, nameMatch);
        continue;
      }
      accountsOut.create += 1;
      if (!dryRun) {
        const { data: inserted, error } = await supabase
          .from("accounts")
          .insert({
            workspace_id: workspaceId,
            name: account.account_name,
            account_type: account.account_type,
            relationship_status: account.relationship_status,
            primary_service: account.primary_service,
            review_priority: account.review_priority,
            summary: account.summary,
            source_refs: account.source_refs,
            import_key: account.account_key,
            import_source: source,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Client ${account.account_name}: ${error.message}`);
        accountByKey.set(account.account_key, inserted.id);
      }
    }

    // Contacts ------------------------------------------------------------
    const contactsOut = outcome("Contacts");
    for (const contact of conversationPack.contacts) {
      if (INTERNAL_CONTACT_EMAILS[contact.contact_key]) {
        contactsOut.skipped += 1;
        continue;
      }
      if (contactKeys.has(contact.contact_key)) {
        contactsOut.unchanged += 1;
        continue;
      }
      const accountKey = contact.account_keys?.split(";")[0]?.trim();
      const accountId = accountKey ? accountByKey.get(accountKey) : undefined;
      if (!accountId) {
        if (dryRun) {
          contactsOut.create += 1;
        } else {
          contactsOut.skipped += 1;
          contactsOut.conflicts.push(`${contact.full_name} has no matching client`);
        }
        continue;
      }
      contactsOut.create += 1;
      if (!dryRun) {
        const { error } = await supabase.from("contacts").insert({
          workspace_id: workspaceId,
          account_id: accountId,
          name: contact.full_name,
          role_title: contact.role,
          email: contact.business_email,
          notes: contact.notes,
          source_refs: contact.source_refs,
          import_key: contact.contact_key,
          import_source: source,
        });
        if (error) throw new Error(`Contact ${contact.full_name}: ${error.message}`);
      }
    }

    // Projects ------------------------------------------------------------
    const projectsOut = outcome("Projects");
    for (const project of conversationPack.projects) {
      if (projectByKey.has(project.project_key)) {
        projectsOut.unchanged += 1;
        continue;
      }
      const nameMatch = projectByName.get(normalizeName(project.project_name));
      if (nameMatch) {
        projectsOut.skipped += 1;
        projectsOut.conflicts.push(`${project.project_name} already exists, left untouched`);
        projectByKey.set(project.project_key, nameMatch);
        continue;
      }
      const accountId = accountByKey.get(project.account_key);
      if (!accountId) {
        if (dryRun) {
          projectsOut.create += 1;
        } else {
          projectsOut.skipped += 1;
          projectsOut.conflicts.push(`${project.project_name} has no matching client`);
        }
        continue;
      }
      projectsOut.create += 1;
      if (!dryRun) {
        const { data: inserted, error } = await supabase
          .from("projects")
          .insert({
            workspace_id: workspaceId,
            account_id: accountId,
            name: project.project_name,
            status: mapProjectStatus(project.status),
            status_label: project.status,
            service_type: project.service_type,
            start_date: project.start_date,
            due_date: project.due_date,
            summary: project.summary,
            source_refs: project.source_refs,
            owner_id: ownerIdFor(project.owner_contact_key),
            import_key: project.project_key,
            import_source: source,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Project ${project.project_name}: ${error.message}`);
        projectByKey.set(project.project_key, inserted.id);
      }
    }

    // Actions as tasks ----------------------------------------------------
    const tasksOut = outcome("Next steps");
    const phaseByProject = new Map<string, string>();
    async function phaseFor(projectId: string): Promise<string> {
      const cached = phaseByProject.get(projectId);
      if (cached) return cached;
      const { data: existing, error } = await supabase
        .from("project_phases")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("project_id", projectId)
        .eq("name", IMPORT_PHASE_NAME)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (existing?.id) {
        phaseByProject.set(projectId, existing.id);
        return existing.id;
      }
      const { data: created, error: createError } = await supabase
        .from("project_phases")
        .insert({
          workspace_id: workspaceId,
          project_id: projectId,
          name: IMPORT_PHASE_NAME,
          sort_order: 0,
        })
        .select("id")
        .single();
      if (createError) throw new Error(createError.message);
      phaseByProject.set(projectId, created.id);
      return created.id;
    }

    for (const action of conversationPack.actions) {
      if (taskKeys.has(action.action_key)) {
        tasksOut.unchanged += 1;
        continue;
      }
      const projectId = action.project_key ? projectByKey.get(action.project_key) : undefined;
      if (!projectId) {
        if (dryRun) {
          tasksOut.create += 1;
        } else {
          tasksOut.skipped += 1;
          tasksOut.conflicts.push(`${action.action} has no matching project`);
        }
        continue;
      }
      tasksOut.create += 1;
      if (!dryRun) {
        const phaseId = await phaseFor(projectId);
        const { data: task, error } = await supabase
          .from("tasks")
          .insert({
            workspace_id: workspaceId,
            project_id: projectId,
            phase_id: phaseId,
            title: action.action,
            description: action.notes,
            status: mapTaskStatus(action.status),
            status_label: action.status,
            priority: mapTaskPriority(action.priority),
            due_date: action.due_date,
            source_refs: action.source_refs,
            import_key: action.action_key,
            import_source: source,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Next step ${action.action}: ${error.message}`);
        const assignee = ownerIdFor(action.owner_contact_key);
        if (assignee) {
          await supabase
            .from("task_assignees")
            .insert({ task_id: task.id, user_id: assignee, workspace_id: workspaceId });
        }
      }
    }

    // Historical notes ----------------------------------------------------
    const notesOut = outcome("Account notes");
    for (const note of conversationPack.notes) {
      if (noteKeys.has(note.note_key)) {
        notesOut.unchanged += 1;
        continue;
      }
      const accountId = accountByKey.get(note.account_key);
      if (!accountId) {
        if (dryRun) {
          notesOut.create += 1;
        } else {
          notesOut.skipped += 1;
          notesOut.conflicts.push(`Note ${note.note_key} has no matching client`);
        }
        continue;
      }
      notesOut.create += 1;
      if (!dryRun) {
        const { error } = await supabase.from("account_notes").insert({
          workspace_id: workspaceId,
          account_id: accountId,
          note_date: note.note_date,
          category: note.category,
          note: note.note,
          source_refs: note.source_refs,
          import_key: note.note_key,
          import_source: source,
        });
        if (error) throw new Error(`Note ${note.note_key}: ${error.message}`);
      }
    }

    // Review queue --------------------------------------------------------
    const reviewOut = outcome("Needs a decision");
    for (const item of conversationPack.review_items) {
      if (reviewKeys.has(item.review_key)) {
        reviewOut.unchanged += 1;
        continue;
      }
      reviewOut.create += 1;
      if (!dryRun) {
        const { error } = await supabase.from("import_review_items").insert({
          workspace_id: workspaceId,
          record_type: item.record_type,
          record_key: item.record_key,
          issue: item.issue,
          evidence: item.evidence,
          required_decision: item.required_decision,
          source_refs: item.source_refs,
          import_key: item.review_key,
          import_source: source,
        });
        if (error) throw new Error(`Review item ${item.review_key}: ${error.message}`);
      }
    }

    return {
      dryRun,
      namespace: source,
      asOf: conversationPack.as_of,
      workspaceId,
      entities: [accountsOut, contactsOut, projectsOut, tasksOut, notesOut, reviewOut],
    };
  });
