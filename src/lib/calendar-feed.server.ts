/**
 * Builds the workspace calendar feed (iCalendar / .ics) that Outlook, Apple
 * Calendar and Google Calendar can subscribe to. Every dated project start,
 * project delivery date, task deadline and campaign milestone becomes an
 * all-day event. Server-only: it reads with the admin client after the feed
 * token has been matched to a workspace.
 */

const DONE_TASK_STATUSES = new Set(["done", "complete", "completed"]);

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Folds long lines at 75 octets, as iCalendar requires. */
function fold(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    parts.push(rest.slice(0, 73));
    rest = rest.slice(73);
  }
  parts.push(rest);
  return parts.join("\r\n ");
}

function toIcsDate(value: string): string {
  return value.slice(0, 10).replace(/-/g, "");
}

function nextDay(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

interface FeedEvent {
  uid: string;
  date: string;
  summary: string;
  description: string;
  category: string;
}

function eventLines(event: FeedEvent, stamp: string, origin: string, url: string): string[] {
  return [
    "BEGIN:VEVENT",
    fold(`UID:${event.uid}@startweb-workspace`),
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(event.date)}`,
    `DTEND;VALUE=DATE:${nextDay(event.date)}`,
    fold(`SUMMARY:${escapeText(event.summary)}`),
    fold(`DESCRIPTION:${escapeText(event.description)}`),
    fold(`CATEGORIES:${escapeText(event.category)}`),
    fold(`URL:${origin}${url}`),
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];
}

function renderIcs(
  workspaceName: string,
  events: { event: FeedEvent; url: string }[],
  origin: string,
): string {
  const stamp = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Startweb//Workspace Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escapeText(`${workspaceName} deadlines`)}`),
    fold(`NAME:${escapeText(`${workspaceName} deadlines`)}`),
    "X-PUBLISHED-TTL:PT1H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    ...events.flatMap(({ event, url }) => eventLines(event, stamp, origin, url)),
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}

export async function buildWorkspaceCalendar(
  workspaceId: string,
  requestingUserId: string,
  workspaceName: string,
  origin: string,
): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // This reads with the service-role client, which bypasses RLS entirely —
  // so the account scoping RLS normally applies for a client-role member
  // (see can_view_account() in the pipeline RBAC migrations) has to be
  // reproduced here by hand. Skipping this would hand a client's calendar
  // link every other client's projects and campaigns in the workspace.
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("workspace_members")
    .select("role, client_account_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", requestingUserId)
    .maybeSingle();
  if (membershipError) throw new Error(membershipError.message);
  if (!membership) throw new Error("Not a member of this workspace.");

  const isClient = membership.role === "client";
  // A client member with no linked account sees nothing, not everything —
  // the fail-safe has to be "show no events", never "show all events".
  if (isClient && !membership.client_account_id) {
    return renderIcs(workspaceName, [], origin);
  }

  let projectsQuery = supabaseAdmin
    .from("projects")
    .select(
      "id, name, status, status_label, start_date, due_date, accounts(name), tasks(id, title, status, status_label, due_date)",
    )
    .eq("workspace_id", workspaceId);
  let campaignsQuery = supabaseAdmin
    .from("campaigns")
    .select("id, name, channel, status, start_date, end_date, next_action, next_action_date")
    .eq("workspace_id", workspaceId);

  if (isClient && membership.client_account_id) {
    projectsQuery = projectsQuery.eq("account_id", membership.client_account_id);
    campaignsQuery = campaignsQuery.eq("account_id", membership.client_account_id);
  }

  const [projectsResult, campaignsResult] = await Promise.all([projectsQuery, campaignsQuery]);

  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (campaignsResult.error) throw new Error(campaignsResult.error.message);

  const events: { event: FeedEvent; url: string }[] = [];

  for (const project of projectsResult.data ?? []) {
    const client =
      (project.accounts as { name: string } | null)?.name ??
      (Array.isArray(project.accounts)
        ? ((project.accounts[0] as { name: string } | undefined)?.name ?? "No client")
        : "No client");
    const status = project.status_label ?? project.status;
    const url = `/projects/${project.id}`;

    if (project.start_date) {
      events.push({
        url,
        event: {
          uid: `project-start-${project.id}`,
          date: project.start_date,
          summary: `Start: ${project.name}`,
          description: `Project start for ${client}. Status: ${status}.`,
          category: "Project start",
        },
      });
    }

    if (project.due_date) {
      events.push({
        url,
        event: {
          uid: `project-due-${project.id}`,
          date: project.due_date,
          summary: `Due: ${project.name}`,
          description: `Project delivery for ${client}. Status: ${status}.`,
          category: "Project delivery",
        },
      });
    }

    for (const task of (project.tasks ?? []) as {
      id: string;
      title: string;
      status: string;
      status_label: string | null;
      due_date: string | null;
    }[]) {
      if (!task.due_date || DONE_TASK_STATUSES.has(task.status)) continue;
      events.push({
        url,
        event: {
          uid: `task-${task.id}`,
          date: task.due_date,
          summary: `Next step: ${task.title}`,
          description: `${project.name} for ${client}. Status: ${task.status_label ?? task.status}.`,
          category: "Next step",
        },
      });
    }
  }

  for (const campaign of campaignsResult.data ?? []) {
    const url = `/campaigns?client=all`;
    const channel = campaign.channel ? ` (${campaign.channel})` : "";
    if (campaign.start_date) {
      events.push({
        url,
        event: {
          uid: `campaign-start-${campaign.id}`,
          date: campaign.start_date,
          summary: `Campaign starts: ${campaign.name}`,
          description: `Campaign${channel}. Status: ${campaign.status}.`,
          category: "Campaign start",
        },
      });
    }
    if (campaign.end_date) {
      events.push({
        url,
        event: {
          uid: `campaign-end-${campaign.id}`,
          date: campaign.end_date,
          summary: `Campaign ends: ${campaign.name}`,
          description: `Campaign${channel}. Status: ${campaign.status}.`,
          category: "Campaign end",
        },
      });
    }
    if (campaign.next_action_date && campaign.next_action) {
      events.push({
        url,
        event: {
          uid: `campaign-action-${campaign.id}`,
          date: campaign.next_action_date,
          summary: `Campaign action: ${campaign.next_action}`,
          description: `${campaign.name}${channel}. Status: ${campaign.status}.`,
          category: "Campaign action",
        },
      });
    }
  }

  return renderIcs(workspaceName, events, origin);
}
