import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
import { SplitAuthLayout, AuthFooterLink } from "@/components/application/auth/split-auth-layout";
import { SocialAuthButtons } from "@/components/application/auth/social-auth-buttons";
import { checkAuthRateLimit } from "@/lib/auth/check-auth-rate-limit";

const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Minimum length is 8 characters"),
});

type RegisterValues = z.infer<typeof registerSchema>;

const searchSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute("/register")({
  ssr: false,
  validateSearch: searchSchema,
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    try {
      await checkAuthRateLimit({ data: { email: values.email, kind: "signup" } });
    } catch (error) {
      toast.error("Couldn't create your account", {
        description: error instanceof Error ? error.message : undefined,
      });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName } },
    });

    if (error) {
      toast.error("Couldn't create your account", { description: error.message });
      return;
    }

    toast.success("Account created");
    // An invited user skips onboarding's "create a workspace" step
    // entirely — they're joining an existing one via the invite link.
    void navigate({ to: next ?? "/onboarding" });
  }

  return (
    <SplitAuthLayout
      headline="Create your"
      subhead="Pipeline, delivery and invoicing in one source of truth, from first call to final invoice."
    >
      <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
        Create your account
      </p>

      <div className="mb-6">
        <SocialAuthButtons />
      </div>

      <div className="relative mb-6 flex items-center">
        <div className="grow border-t border-border" />
        <span className="px-4 text-sm text-muted-foreground">Or</span>
        <div className="grow border-t border-border" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" placeholder="Jordan Ndlovu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="mt-2" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <LoadingIndicator size="sm" label="Creating account" />
            ) : (
              "Sign up"
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        By creating an account, you agree to our Terms of Service.
      </p>
      <AuthFooterLink prompt="Already have an account?" linkLabel="Sign in" to="/auth" />
      <p className="mt-4 text-center">
        <Link to="/" className="text-xs text-muted-foreground hover:underline">
          Back to home
        </Link>
      </p>
    </SplitAuthLayout>
  );
}
