/**
 * Finds everything due today across every workspace and emails each
 * affected client's contacts a same-day summary. Triggered once a day by
 * Lovable's scheduled function calling the /api/cron/deadline-reminders
 * route (see src/integrations/supabase/cron-auth.ts for how that request
 * is authenticated).
 *
 * Idempotent: one row per (workspace, account, day) in `reminder_log`
 * guards against a duplicate send if the schedule fires twice, or the
 * request is retried.
 */
import * as React from "react";
import { render } from "@react-email/render";
import { sendLovableEmail } from "@lovable.dev/email-js";
import {
  DeadlineReminderEmail,
  type DeadlineReminderItem,
} from "@/lib/email-templates/deadline-reminder";

// Keep in sync with src/routes/lovable/email/auth/webhook.ts — same sender
// identity, just a different message.
const SITE_NAME = "Startweb Workspace";
const SENDER_DOMAIN = "notify.workspace.startweb.co.za";
const FROM_DOMAIN = "workspace.startweb.co.za";
const SITE_URL = `https://${FROM_DOMAIN}`;

const DONE_TASK_STATUSES = new Set(["done", "complete", "completed"]);

function todayInWorkspaceTimezone(): string {
  // No per-workspace timezone setting exists yet; the whole product already
  // assumes a single South African context elsewhere (en-ZA formatting), so
  // today() is computed in that zone rather than server UTC, which could
  // otherwise be a day off either side of midnight SAST.
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" });
  return formatter.format(new Date()); // en-CA gives YYYY-MM-DD
}

interface DueEvent {
  accountId: string;
  summary: string;
  category: string;
}

async function collectDueEventsForWorkspace(
  workspaceId: string,
  today: string,
): Promise<DueEvent[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const events: DueEvent[] = [];

  const { data: projects, error: projectsError } = await supabaseAdmin
    .from("projects")
    .select(
      "id, name, account_id, due_date, project_phases(name, status, due_date), tasks(title, status, due_date)",
    )
    .eq("workspace_id", workspaceId);
  if (projectsError) throw new Error(projectsError.message);

  for (const project of projects ?? []) {
    if (project.due_date === today) {
      events.push({
        accountId: project.account_id,
        category: "Project delivery",
        summary: `${project.name} is due today.`,
      });
    }
    for (const phase of project.project_phases ?? []) {
      if (phase.due_date === today && phase.status !== "done") {
        events.push({
          accountId: project.account_id,
          category: "Phase deadline",
          summary: `${project.name} — ${phase.name} is due today.`,
        });
      }
    }
    for (const task of project.tasks ?? []) {
      if (task.due_date === today && !DONE_TASK_STATUSES.has(task.status)) {
        events.push({
          accountId: project.account_id,
          category: "Next step",
          summary: `${project.name} — ${task.title} is due today.`,
        });
      }
    }
  }

  const { data: campaigns, error: campaignsError } = await supabaseAdmin
    .from("campaigns")
    .select("name, account_id, next_action, next_action_date")
    .eq("workspace_id", workspaceId);
  if (campaignsError) throw new Error(campaignsError.message);

  for (const campaign of campaigns ?? []) {
    if (campaign.next_action_date === today && campaign.next_action && campaign.account_id) {
      events.push({
        accountId: campaign.account_id,
        category: "Campaign action",
        summary: `${campaign.name}: ${campaign.next_action}`,
      });
    }
  }

  return events;
}

export interface SendDeadlineRemindersResult {
  workspacesChecked: number;
  emailsSent: number;
  emailsSkippedAlreadySent: number;
  accountsWithNoContactEmail: number;
}

export async function sendDeadlineReminders(): Promise<SendDeadlineRemindersResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = todayInWorkspaceTimezone();

  const { data: workspaces, error: workspacesError } = await supabaseAdmin
    .from("workspaces")
    .select("id");
  if (workspacesError) throw new Error(workspacesError.message);

  const result: SendDeadlineRemindersResult = {
    workspacesChecked: 0,
    emailsSent: 0,
    emailsSkippedAlreadySent: 0,
    accountsWithNoContactEmail: 0,
  };

  for (const workspace of workspaces ?? []) {
    result.workspacesChecked += 1;
    const events = await collectDueEventsForWorkspace(workspace.id, today);
    if (events.length === 0) continue;

    const eventsByAccount = new Map<string, DueEvent[]>();
    for (const event of events) {
      const list = eventsByAccount.get(event.accountId) ?? [];
      list.push(event);
      eventsByAccount.set(event.accountId, list);
    }

    for (const [accountId, accountEvents] of eventsByAccount) {
      const { data: contacts, error: contactsError } = await supabaseAdmin
        .from("contacts")
        .select("name, email")
        .eq("account_id", accountId)
        .not("email", "is", null);
      if (contactsError) throw new Error(contactsError.message);

      if (!contacts || contacts.length === 0) {
        result.accountsWithNoContactEmail += 1;
        continue;
      }

      const reminderKey = `deadline-reminder:${accountId}:${today}`;

      for (const contact of contacts) {
        const email = contact.email;
        if (!email) continue;

        const { data: existing, error: existingError } = await supabaseAdmin
          .from("reminder_log")
          .select("id")
          .eq("workspace_id", workspace.id)
          .eq("reminder_key", reminderKey)
          .eq("recipient_email", email)
          .maybeSingle();
        if (existingError) throw new Error(existingError.message);
        if (existing) {
          result.emailsSkippedAlreadySent += 1;
          continue;
        }

        const items: DeadlineReminderItem[] = accountEvents.map((event) => ({
          summary: event.summary,
          category: event.category,
        }));

        const html = await render(
          React.createElement(DeadlineReminderEmail, {
            siteName: SITE_NAME,
            siteUrl: SITE_URL,
            recipientName: contact.name ?? "",
            items,
          }),
        );
        const text = await render(
          React.createElement(DeadlineReminderEmail, {
            siteName: SITE_NAME,
            siteUrl: SITE_URL,
            recipientName: contact.name ?? "",
            items,
          }),
          { plainText: true },
        );

        await sendLovableEmail(
          {
            to: email,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject: `${items.length} item${items.length === 1 ? "" : "s"} due today`,
            html,
            text,
            purpose: "deadline_reminder",
            idempotency_key: `${reminderKey}:${email}`,
          },
          { apiKey },
        );

        const { error: logError } = await supabaseAdmin.from("reminder_log").insert({
          workspace_id: workspace.id,
          reminder_key: reminderKey,
          recipient_email: email,
        });
        if (logError) throw new Error(logError.message);

        result.emailsSent += 1;
      }
    }
  }

  return result;
}
