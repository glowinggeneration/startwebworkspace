import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, LayoutGrid, List, Search, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts, useCreateAccount } from "@/hooks/use-accounts";
import { useIndustries } from "@/hooks/use-industries";
import { supabase } from "@/integrations/supabase/client";
import { AccountRow } from "@/components/application/accounts/account-row";
import {
  EmptyState,
  PageHeader,
  Panel,
  Toolbar,
  UnderlineTabs,
} from "@/components/application/shell/page-parts";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/sales/currency";
import { PanelHeader } from "@/components/application/shell/panel-parts";

export const Route = createFileRoute("/_authenticated/accounts")({
  component: AccountsPage,
  head: () => ({
    meta: [
      { title: "Accounts | Startweb" },
      {
        name: "description",
        content: "Client companies, their contacts and the deals tied to them.",
      },
      { property: "og:title", content: "Accounts | Startweb" },
      { property: "og:description", content: "Your client directory in Startweb." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const accountSchema = z.object({
  name: z.string().trim().min(1, "Enter a company name"),
  website: z.union([z.literal(""), z.string().trim().url("Enter a valid web address")]).optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional(),
  industryId: z.string().optional(),
});
type AccountFormValues = z.infer<typeof accountSchema>;

function AccountsPage() {
  const { workspaceId } = useActiveWorkspace();
  const { data: accounts, isLoading } = useAccounts(workspaceId);
  const { data: industries } = useIndustries(workspaceId);
  const createAccount = useCreateAccount(workspaceId);

  const [tab, setTab] = useState<"all" | "reference">("all");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [panelOpen, setPanelOpen] = useState(false);

  const industryName = (id: string | null) => industries?.find((i) => i.id === id)?.name ?? null;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", website: "", contactName: "", contactEmail: "", industryId: "" },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (accounts ?? []).filter((account) => {
      if (tab === "reference" && !account.is_reference_client) return false;
      if (industryFilter !== "all" && account.industry_id !== industryFilter) return false;
      if (!term) return true;
      return account.name.toLowerCase().includes(term);
    });
  }, [accounts, tab, industryFilter, search]);

  async function onSubmit(values: AccountFormValues) {
    try {
      const account = await createAccount.mutateAsync({
        name: values.name,
        website: values.website || null,
        industry_id: values.industryId || null,
      });
      if (values.contactName) {
        const { error } = await supabase.from("contacts").insert({
          workspace_id: workspaceId,
          account_id: account.id,
          name: values.contactName,
          email: values.contactEmail || null,
        });
        if (error) throw error;
      }
      form.reset();
      setPanelOpen(false);
      toast.success("Account created");
    } catch (error) {
      toast.error("Couldn't create the account", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Accounts"
        description="Client companies, their contacts and the deals tied to them."
        actions={
          <Button onClick={() => setPanelOpen(true)}>
            <span aria-hidden="true">+</span> New account
          </Button>
        }
      />

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <UnderlineTabs
            ariaLabel="Account filters"
            value={tab}
            onValueChange={setTab}
            options={[
              { value: "all", label: "All accounts", count: accounts?.length ?? 0 },
              {
                value: "reference",
                label: "Reference clients",
                count: accounts?.filter((a) => a.is_reference_client).length ?? 0,
              },
            ]}
          />

          <Toolbar>
            <div className="relative min-w-56 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search accounts..."
                aria-label="Search accounts"
                className="h-11 bg-card pl-9"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="h-11 w-56 bg-card" aria-label="Filter by industry">
                <Tag className="size-4 text-muted-foreground" aria-hidden="true" />
                <SelectValue placeholder="All industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {industries?.map((industry) => (
                  <SelectItem key={industry.id} value={industry.id}>
                    {industry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {[
                { value: "list" as const, label: "List view", icon: List },
                { value: "grid" as const, label: "Grid view", icon: LayoutGrid },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  aria-label={option.label}
                  aria-pressed={view === option.value}
                  className={cn(
                    "rounded-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    view === option.value
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <option.icon className="size-4" aria-hidden="true" />
                </button>
              ))}
            </div>
          </Toolbar>

          {isLoading ? (
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
          ) : filtered.length === 0 ? (
            <Panel>
              <EmptyState
                icon={Building2}
                title="Your client directory starts here"
                description="Add a company to keep its contacts, deals and invoices in one place."
                action={<Button onClick={() => setPanelOpen(true)}>Add account</Button>}
              />
            </Panel>
          ) : view === "list" ? (
            <Panel className="overflow-x-auto">
              <PanelHeader
                title="Client directory"
                description={`${filtered.length} ${filtered.length === 1 ? "company" : "companies"} in this workspace.`}
              />
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-5 py-3">
                      Company
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Primary contact
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Industry
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Open deals
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Website
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      industryName={industryName(account.industry_id)}
                    />
                  ))}
                </tbody>
              </table>
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((account) => {
                const wonValue = account.deals
                  .filter((deal) => deal.status === "won")
                  .reduce((sum, deal) => sum + deal.value, 0);
                return (
                  <Panel key={account.id} className="p-5">
                    <p className="text-base font-semibold text-foreground">{account.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {industryName(account.industry_id) ?? "No industry set"}
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Open deals</dt>
                        <dd className="font-medium">
                          {account.deals.filter((deal) => deal.status === "open").length}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Won value</dt>
                        <dd className="font-medium">{currency.format(wonValue)}</dd>
                      </div>
                    </dl>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>

        {panelOpen ? (
          <Panel className="w-full shrink-0 p-6 xl:w-96">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">New account</h2>
                <p className="text-sm text-muted-foreground">
                  Capture the company and its first contact.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close new account panel"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="account-name">Company name</Label>
                <Input id="account-name" {...form.register("name")} />
                {form.formState.errors.name ? (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-website">Website</Label>
                <Input id="account-website" placeholder="https://" {...form.register("website")} />
                {form.formState.errors.website ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.website.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-contact">Primary contact</Label>
                <Input id="account-contact" {...form.register("contactName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-email">Email</Label>
                <Input id="account-email" type="email" {...form.register("contactEmail")} />
                {form.formState.errors.contactEmail ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contactEmail.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-industry">Industry</Label>
                <Select
                  value={form.watch("industryId") || ""}
                  onValueChange={(value) => form.setValue("industryId", value)}
                >
                  <SelectTrigger id="account-industry">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries?.map((industry) => (
                      <SelectItem key={industry.id} value={industry.id}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={createAccount.isPending}>
                  {createAccount.isPending ? "Saving..." : "Create account"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPanelOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
