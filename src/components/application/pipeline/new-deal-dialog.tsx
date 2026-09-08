import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";
import { useAccounts } from "@/hooks/use-accounts";
import { useIndustries } from "@/hooks/use-industries";
import { usePackages } from "@/hooks/use-packages";
import { useCreateDeal } from "@/hooks/use-deals";

const dealSchema = z.object({
  accountId: z.string().min(1, "Pick an account"),
  industryId: z.string().min(1, "Pick an industry"),
  packageId: z.string().min(1, "Pick a package"),
  value: z.coerce.number().min(0, "Enter a value"),
  nextStep: z.string().trim().min(1, "A deal needs a next step"),
  nextDate: z.string().min(1, "A deal needs a next date"),
  notes: z.string().optional(),
});

// z.coerce.number() makes the schema's input type (what the form holds
// before validation) differ from its output type (what handleSubmit
// hands to onSubmit) — useForm's third generic carries that through.
type DealFormInput = z.input<typeof dealSchema>;
type DealFormOutput = z.output<typeof dealSchema>;

export function NewDealDialog() {
  const [open, setOpen] = useState(false);
  const { workspaceId } = useActiveWorkspace();
  const { data: accounts } = useAccounts(workspaceId);
  const { data: industries } = useIndustries(workspaceId);
  const { data: packages } = usePackages(workspaceId);
  const createDeal = useCreateDeal(workspaceId);

  const form = useForm<DealFormInput, unknown, DealFormOutput>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      accountId: "",
      industryId: "",
      packageId: "",
      value: 0,
      nextStep: "",
      nextDate: "",
      notes: "",
    },
  });

  async function onSubmit(values: DealFormOutput) {
    try {
      await createDeal.mutateAsync({
        account_id: values.accountId,
        industry_id: values.industryId,
        package_id: values.packageId,
        value: values.value,
        next_step: values.nextStep,
        next_date: values.nextDate,
        notes: values.notes || null,
      });
      toast.success("Deal added");
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error("Couldn't add the deal", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  if (accounts && accounts.length === 0) {
    return (
      <Button disabled title="Add an account first">
        <Plus className="size-4" aria-hidden="true" />
        New deal
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden="true" />
          New deal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries?.map((industry) => (
                          <SelectItem key={industry.id} value={industry.id}>
                            {industry.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="packageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package</FormLabel>
                    <Select
                      onValueChange={(packageId) => {
                        field.onChange(packageId);
                        const selected = packages?.find((p) => p.id === packageId);
                        if (selected) form.setValue("value", selected.price);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Package" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packages?.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value (ZAR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={
                        typeof field.value === "number" ? field.value : String(field.value ?? "")
                      }
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextStep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next step</FormLabel>
                  <FormControl>
                    <Input placeholder="Twenty-minute site review" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending ? "Adding…" : "Add deal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
