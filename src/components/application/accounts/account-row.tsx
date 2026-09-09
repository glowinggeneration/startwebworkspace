import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Globe, Star, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useContacts, useCreateContact } from "@/hooks/use-contacts";
import { currency } from "@/lib/sales/currency";
import { invoiceBalance } from "@/lib/finance/balance";

interface AccountRowProps {
  account: {
    id: string;
    name: string;
    website: string | null;
    country: string | null;
    is_reference_client: boolean;
    deals: { id: string; status: string; value: number }[];
    projects: { id: string; name: string; status: string }[];
    invoices: {
      id: string;
      invoice_number: string;
      status: string;
      invoice_line_items: { quantity: number; unit_price: number }[];
      payments: { amount: number }[];
    }[];
  };
  industryName: string | null;
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional(),
  roleTitle: z.string().optional(),
});
type ContactFormValues = z.infer<typeof contactSchema>;

export function AccountRow({ account, industryName }: AccountRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { workspaceId } = useActiveWorkspace();
  const { data: contacts } = useContacts(workspaceId, account.id);
  const createContact = useCreateContact(workspaceId, account.id);
  const outstanding = account.invoices.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", roleTitle: "" },
  });

  async function onSubmit(values: ContactFormValues) {
    try {
      await createContact.mutateAsync({
        name: values.name,
        email: values.email || null,
        role_title: values.roleTitle || null,
      });
      form.reset();
      toast.success("Contact added");
    } catch (error) {
      toast.error("Couldn't add the contact", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="card-surface overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <div className="flex min-w-0 items-center gap-2">
          {account.is_reference_client && (
            <Star className="size-4 shrink-0 text-warning" aria-label="Reference client" />
          )}
          <p className="type-card truncate">{account.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {industryName && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {industryName}
            </span>
          )}
          {account.website && (
            <a
              href={account.website}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Open ${account.name}'s website`}
            >
              <Globe className="size-4" />
            </a>
          )}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-4">
          <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <dt className="type-meta text-muted-foreground">Open deals</dt>
              <dd className="type-body font-medium">
                {account.deals.filter((deal) => deal.status === "open").length}
              </dd>
            </div>
            <div>
              <dt className="type-meta text-muted-foreground">Won value</dt>
              <dd className="type-body font-medium">
                {currency.format(
                  account.deals
                    .filter((deal) => deal.status === "won")
                    .reduce((sum, deal) => sum + deal.value, 0),
                )}
              </dd>
            </div>
            <div>
              <dt className="type-meta text-muted-foreground">Active projects</dt>
              <dd className="type-body font-medium">
                {account.projects.filter((project) => project.status !== "completed").length}
              </dd>
            </div>
            <div>
              <dt className="type-meta text-muted-foreground">Outstanding</dt>
              <dd className="type-body font-medium">{currency.format(outstanding)}</dd>
            </div>
          </dl>
          <p className="type-meta mb-2 text-muted-foreground">Contacts</p>
          <ul className="mb-3 space-y-1">
            {contacts && contacts.length === 0 && (
              <li className="type-body text-muted-foreground">No contacts yet.</li>
            )}
            {contacts?.map((contact) => (
              <li key={contact.id} className="type-body flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{contact.name}</span>
                {contact.role_title && (
                  <span className="text-muted-foreground">{contact.role_title}</span>
                )}
                {contact.email && <span className="text-muted-foreground">{contact.email}</span>}
              </li>
            ))}
          </ul>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-2">
            <Input placeholder="Name" className="w-36" {...form.register("name")} />
            <Input placeholder="Role" className="w-32" {...form.register("roleTitle")} />
            <Input placeholder="Email" className="w-44" {...form.register("email")} />
            <Button type="submit" size="sm" variant="outline" disabled={createContact.isPending}>
              <UserPlus className="size-4" aria-hidden="true" />
              Add
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
