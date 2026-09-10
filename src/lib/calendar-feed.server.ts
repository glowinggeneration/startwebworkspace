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

export async function buildWorkspaceCalendar(
  workspaceId: string,
  workspaceName: string,
  origin: string,
): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [projectsResult, campaignsResult] = await Promise.all([
    supabaseAdmin
      .from("projects")
      .select(
        "id, name, status, status_label, start_date, due_date, accounts(name), tasks(id, title, status, status_label, due_date)",
      )
      .eq("workspace_id", workspaceId),
    supabaseAdmin
      .from("campaigns")
      .select("id, name, channel, status, start_date, end_date, next_action, next_action_date")
      .eq("workspace_id", workspaceId),
  ]);

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
