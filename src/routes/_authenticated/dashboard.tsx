import { createFileRoute } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { CommandBoard } from "@/components/application/dashboard/command-board";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: profile } = useProfile();
  const { memberships } = Route.useRouteContext();
  const workspaceName = memberships[0]?.workspaceName;

  return (
    <div className="section-stack p-8">
      <div>
        <h1 className="type-title">
          {profile?.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}` : "Welcome back"}
        </h1>
        <p className="type-body text-muted-foreground">
          {workspaceName ? `${workspaceName}. ` : ""}Your command board for Monday and Friday.
        </p>
      </div>

      <CommandBoard />
    </div>
  );
}
