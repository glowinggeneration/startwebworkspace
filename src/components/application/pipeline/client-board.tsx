import { Link } from "@tanstack/react-router";
import { CalendarClock, FolderOpen, Users } from "lucide-react";
import { EmptyState, Panel } from "@/components/application/shell/page-parts";
import {
  CLIENT_STAGES,
  clientStage,
  openTasks,
  type ClientBoardAccount,
} from "@/hooks/use-client-board";

/**
 * Board of real clients with their contacts, projects and open next steps,
 * grouped by the relationship stage recorded on each account.
 */
export function ClientBoard({ accounts }: { accounts: ClientBoardAccount[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CLIENT_STAGES.map((stage) => {
        const columnAccounts = accounts.filter((account) => clientStage(account) === stage.value);
        return (
          <Panel key={stage.value} className="flex min-h-[32rem] flex-col">
            <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">{stage.label}</h2>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>
              <span className="text-sm text-muted-foreground">{columnAccounts.length}</span>
            </div>
            <div className="max-h-[34rem] flex-1 space-y-3 overflow-y-auto p-4">
              {columnAccounts.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="Nothing here yet"
                  description="Clients move into this column as their status changes."
                  className="py-14"
                />
              ) : (
                columnAccounts.map((account) => (
                  <ClientCard key={account.id} account={account} />
                ))
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function ClientCard({ account }: { account: ClientBoardAccount }) {
  const next = openTasks(account).slice(0, 3);
  const contact = account.contacts[0];

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{account.name}</h3>
        {account.review_priority ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            {account.review_priority}
          </span>
        ) : null}
      </div>
      {account.primary_service ? (
        <p className="mt-1 text-xs text-muted-foreground">{account.primary_service}</p>
      ) : null}
      {account.relationship_status ? (
        <p className="mt-2 text-xs text-foreground">{account.relationship_status}</p>
      ) : null}

      {account.projects.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {account.projects.slice(0, 3).map((project) => (
            <li key={project.id} className="text-xs text-muted-foreground">
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {project.name}
              </Link>
              {project.status_label ? ` · ${project.status_label}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      {next.length > 0 ? (
        <div className="mt-3 space-y-1 border-t border-border pt-3">
          {next.map((task) => (
            <p key={task.id} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                {task.title}
                {task.due_date ? ` · ${task.due_date}` : ""}
              </span>
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="size-3.5" aria-hidden="true" />
        {account.contacts.length === 0
          ? "No contact recorded"
          : `${contact?.name}${contact?.role_title ? `, ${contact.role_title}` : ""}${
              account.contacts.length > 1 ? ` +${account.contacts.length - 1}` : ""
            }`}
      </div>
    </article>
  );
}
