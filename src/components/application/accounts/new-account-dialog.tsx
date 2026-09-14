import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useIndustries } from "@/hooks/use-industries";
import { useCreateAccount } from "@/hooks/use-accounts";
import { useProfile } from "@/hooks/use-profile";
import { CLIENT_STAGES, type ClientStage } from "@/hooks/use-client-board";

const accountSchema = z.object({
  name: z.string().trim().min(1, "Enter a company name"),
  industryId: z.string().min(1, "Pick an industry"),
  website: z.string().optional(),
  country: z.string().optional(),
  stage: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

// clientStage() in use-client-board.ts classifies by matching these exact
// labels (case-insensitively) against relationship_status — picking one
// here guarantees the account lands on the stage its creator chose,
// instead of being guessed at from free text.
const STAGE_LABEL: Record<ClientStage, string> = {
  proposal: "Proposal",
  active: "In progress",
  attention: "Needs attention",
  delivered: "Delivered",
};

export function NewAccountDialog({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const { workspaceId } = useActiveWorkspace();
  const { data: industries } = useIndustries(workspaceId);
  const { data: profile } = useProfile();
  const createAccount = useCreateAccount(workspaceId);
  const showStagePicker = profile?.preferences.showStagePicker === true;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", industryId: "", website: "", country: "", stage: "proposal" },
  });

  async function onSubmit(values: AccountFormValues) {
    try {
      await createAccount.mutateAsync({
        name: values.name,
        industry_id: values.industryId,
        website: values.website || null,
        country: values.country || null,
        ...(showStagePicker && values.stage
          ? { relationship_status: STAGE_LABEL[values.stage as ClientStage] }
          : {}),
      });
      toast.success("Account added");
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error("Couldn't add the account", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" aria-hidden="true" />
            New account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New account</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick an industry" />
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
            {showStagePicker && (
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "proposal"}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pick a stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CLIENT_STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="South Africa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createAccount.isPending}>
                {createAccount.isPending ? "Adding…" : "Add account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
