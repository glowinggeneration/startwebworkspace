import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

/**
 * Google is the only managed social sign in available to this workspace, so
 * the supplied social button row renders a single, real, working option.
 */
export function SocialAuthButtons() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      toast.error("Could not continue with Google", {
        description: result.error.message,
      });
      setPending(false);
      return;
    }

    if (result.redirected) return;

    window.location.assign("/dashboard");
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      disabled={pending}
      onClick={handleClick}
    >
      <FcGoogle className="size-5" />
      {pending ? "Opening Google" : "Continue with Google"}
    </Button>
  );
}
