import { createFileRoute } from "@tanstack/react-router";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useIndustries } from "@/hooks/use-industries";
import { AccountRow } from "@/components/application/accounts/account-row";
import { NewAccountDialog } from "@/components/application/accounts/new-account-dialog";

export const Route = createFileRoute("/_authenticated/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: accounts, isLoading } = useAccounts(workspaceId);
  const { data: industries } = useIndustries(workspaceId);
  const industryName = (id: string | null) => industries?.find((i) => i.id === id)?.name ?? null;

  return (
    <div className="section-stack p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="type-display">Accounts</h1>
          <p className="type-body text-muted-foreground">
            Client companies, their contacts, and the deals tied to them.
          </p>
        </div>
        <NewAccountDialog />
      </div>

      <div className="space-y-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        {accounts && accounts.length === 0 && (
          <p className="type-body rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            No accounts yet. Add your first client company to start logging deals against it.
          </p>
        )}
        {accounts?.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            industryName={industryName(account.industry_id)}
          />
        ))}
      </div>
    </div>
  );
}
