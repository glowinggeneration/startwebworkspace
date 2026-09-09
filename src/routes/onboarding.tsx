import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { OnboardingStepper, type OnboardingStep } from "@/components/core/onboarding-stepper";

const STEPS: OnboardingStep[] = [
  { id: "account", label: "Account", description: "Name your workspace" },
  { id: "profile", label: "Profile", description: "Confirm your details" },
  { id: "billing", label: "Billing", description: "Set up later" },
  { id: "complete", label: "Complete", description: "You're in" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { next: "/onboarding" } });
    }
    return { user: data.user };
  },
  component: OnboardingPage,
});

const accountSchema = z.object({
  workspaceName: z.string().trim().min(2, "Give your workspace a name"),
});
type AccountValues = z.infer<typeof accountSchema>;

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name"),
});
type ProfileValues = z.infer<typeof profileSchema>;

function OnboardingPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const accountForm = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { workspaceName: "" },
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: (user.user_metadata?.["full_name"] as string | undefined) ?? "" },
  });

  async function handleAccountSubmit(values: AccountValues) {
    const slug = `${slugify(values.workspaceName)}-${user.id.slice(0, 6)}`;
    const newWorkspaceId = crypto.randomUUID();

    // The creator is added as owner by a database trigger, so no RETURNING
    // read is needed here (the read policy requires membership that doesn't
    // exist yet at RETURNING time).
    const { error: workspaceError } = await supabase
      .from("workspaces")
      .insert({ id: newWorkspaceId, name: values.workspaceName, slug });

    if (workspaceError) {
      toast.error("Couldn't create your workspace", { description: workspaceError.message });
      return;
    }

    setWorkspaceId(newWorkspaceId);
    setStepIndex(1);
  }


  async function handleProfileSubmit(values: ProfileValues) {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: values.fullName, profile_completed: true })
      .eq("id", user.id);


    if (error) {
      toast.error("Couldn't save your profile", { description: error.message });
      return;
    }

    setStepIndex(2);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <OnboardingStepper steps={STEPS} currentIndex={stepIndex} className="mb-10" />

        {stepIndex === 0 && (
          <section className="card-surface p-6">
            <h1 className="type-title mb-1">Name your workspace</h1>
            <p className="type-body mb-6 text-muted-foreground">
              This is your team's shared home for pipeline, projects and invoicing.
            </p>
            <Form {...accountForm}>
              <form
                onSubmit={accountForm.handleSubmit(handleAccountSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={accountForm.control}
                  name="workspaceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace name</FormLabel>
                      <FormControl>
                        <Input placeholder="Startweb" autoFocus {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={accountForm.formState.isSubmitting}>
                  {accountForm.formState.isSubmitting ? "Creating…" : "Continue"}
                </Button>
              </form>
            </Form>
          </section>
        )}

        {stepIndex === 1 && (
          <section className="card-surface p-6">
            <h1 className="type-title mb-1">Confirm your details</h1>
            <p className="type-body mb-6 text-muted-foreground">
              This is how teammates will see you across{" "}
              {workspaceId ? "your workspace" : "Startweb Workspace"}.
            </p>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input autoFocus {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? "Saving…" : "Continue"}
                </Button>
              </form>
            </Form>
          </section>
        )}

        {stepIndex === 2 && (
          <section className="card-surface p-6">
            <h1 className="type-title mb-1">Billing</h1>
            <p className="type-body mb-6 text-muted-foreground">
              Quotes and invoicing aren't set up yet. You'll configure this when that part of
              Startweb Workspace ships. Nothing to do here for now.
            </p>
            <Button onClick={() => setStepIndex(3)}>Continue</Button>
          </section>
        )}

        {stepIndex === 3 && (
          <section className="card-surface flex flex-col items-center p-6 text-center">
            <CheckCircle2 className="mb-4 size-10 text-success" aria-hidden="true" />
            <h1 className="type-title mb-1">You're all set</h1>
            <p className="type-body mb-6 text-muted-foreground">
              Your workspace is ready. Let's get to work.
            </p>
            <Button onClick={() => void navigate({ to: "/dashboard" })}>Go to dashboard</Button>
          </section>
        )}
      </div>
    </div>
  );
}
