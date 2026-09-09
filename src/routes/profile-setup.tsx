import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/application/shell/loading-indicator";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const Route = createFileRoute("/profile-setup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set up your profile | Startweb Workspace" },
      {
        name: "description",
        content: "Confirm your name and role so your team knows who you are in Startweb Workspace.",
      },
      { property: "og:title", content: "Set up your profile | Startweb Workspace" },
      {
        property: "og:description",
        content: "Confirm your name and role so your team knows who you are in Startweb Workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { next: "/profile-setup" } });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, profile_completed")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.profile_completed) {
      throw redirect({ to: "/dashboard" });
    }
    return { user: data.user, fullName: profile?.full_name ?? "" };
  },
  component: ProfileSetupPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
});
type Values = z.infer<typeof schema>;

function ProfileSetupPage() {
  const { user, fullName } = Route.useRouteContext();
  const navigate = useNavigate();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName:
        (user.user_metadata?.["full_name"] as string | undefined) ??
        (fullName.includes("@") ? "" : fullName),
    },
  });

  async function onSubmit(values: Values) {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: values.fullName, profile_completed: true })
      .eq("id", user.id);

    if (error) {
      toast.error("Couldn't save your profile", { description: error.message });
      return;
    }
    await navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <section className="card-surface p-6">
          <h1 className="type-title mb-1">Set up your profile</h1>
          <p className="type-body mb-6 text-muted-foreground">
            Welcome to the Startweb workspace. Tell your team how your name should appear.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input autoFocus placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="type-meta text-muted-foreground">Signed in as {user.email}</p>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <LoadingIndicator size="sm" label="Saving" />
                ) : (
                  "Continue to workspace"
                )}
              </Button>
            </form>
          </Form>
        </section>
      </div>
    </div>
  );
}
