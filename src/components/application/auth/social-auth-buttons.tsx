import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaXTwitter, FaGithub, FaFacebook } from "react-icons/fa6";
import type { Provider } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SocialProvider {
  provider: Provider;
  label: string;
  icon: React.ReactNode;
}

const PROVIDERS: SocialProvider[] = [
  { provider: "google", label: "Google", icon: <FcGoogle className="size-5" /> },
  {
    provider: "twitter",
    label: "X",
    icon: <FaXTwitter className="size-5 text-black dark:text-white" />,
  },
  {
    provider: "facebook",
    label: "Facebook",
    icon: <FaFacebook className="size-5 text-[#1877F2]" />,
  },
  {
    provider: "github",
    label: "GitHub",
    icon: <FaGithub className="size-5 text-black dark:text-white" />,
  },
];

/**
 * Adapted from the supplied Social Authentication Buttons component
 * (docs/ui-components/COMPONENT_MAP.md) — same icon-button row, wired to
 * real Supabase OAuth instead of the original static demo markup.
 */
export function SocialAuthButtons() {
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);

  async function handleClick(provider: Provider) {
    setPendingProvider(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) {
      toast.error(`Couldn't continue with ${provider}`, { description: error.message });
      setPendingProvider(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {PROVIDERS.map(({ provider, label, icon }) => (
        <Button
          key={provider}
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Continue with ${label}`}
          disabled={pendingProvider !== null}
          onClick={() => handleClick(provider)}
        >
          {icon}
        </Button>
      ))}
    </div>
  );
}
