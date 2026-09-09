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
  ownerName?: string | null;
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional(),
  roleTitle: z.string().optional(),
});
type ContactFormValues = z.infer<typeof contactSchema>;

export function AccountRow({ account, industryName, ownerName }: AccountRowProps) {
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

  const openDeals = account.deals.filter((deal) => deal.status === "open").length;
  const primaryContact = contacts?.[0];

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/40">
        <td className="px-5 py-4">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                isExpanded && "rotate-180",
              )}
              aria-hidden="true"
            />
            {account.is_reference_client && (
              <Star className="size-4 shrink-0 text-warning" aria-label="Reference client" />
            )}
            <span className="font-medium text-foreground">{account.name}</span>
          </button>
        </td>
        <td className="px-5 py-4 text-muted-foreground">{primaryContact?.name ?? "Not set"}</td>
        <td className="px-5 py-4 text-muted-foreground">{industryName ?? "Not set"}</td>
        <td className="px-5 py-4 text-muted-foreground">{openDeals}</td>
        <td className="px-5 py-4 text-muted-foreground">
          {account.website ? (
            <a
              href={account.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Globe className="size-4" aria-hidden="true" />
              Website
            </a>
          ) : (
            ownerName ?? "Unassigned"
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border bg-muted/30">
          <td colSpan={5} className="p-5">
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
          </td>
        </tr>
      )}
    </>
  );
}
