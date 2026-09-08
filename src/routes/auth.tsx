import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { SplitAuthLayout, AuthFooterLink } from "@/components/application/auth/split-auth-layout";
import { SocialAuthButtons } from "@/components/application/auth/social-auth-buttons";
import { checkAuthRateLimit } from "@/lib/auth/check-auth-rate-limit";

const searchSchema = z.object({
  next: z.string().optional(),
});

const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type SignInValues = z.infer<typeof signInSchema>;

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: search.next ?? "/dashboard" });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    try {
      await checkAuthRateLimit({ data: { email: values.email, kind: "login" } });
    } catch (error) {
      toast.error("Couldn't sign you in", {
        description: error instanceof Error ? error.message : undefined,
      });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      // Deliberately generic — don't reveal whether the account exists.
      toast.error("Couldn't sign you in", {
        description: "Check your email and password and try again.",
      });
      return;
    }

    void navigate({ to: next ?? "/dashboard" });
  }

  return (
    <SplitAuthLayout
      headline="Welcome back."
      subhead="Pick up your pipeline, projects and invoices right where you left off."
    >
      <p className="mb-6 text-center text-sm font-medium text-muted-foreground">Sign in</p>

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
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="mt-2" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      <AuthFooterLink prompt="Don't have an account?" linkLabel="Sign up" to="/register" />
    </SplitAuthLayout>
  );
}
