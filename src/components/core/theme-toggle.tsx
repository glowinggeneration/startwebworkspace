import { useTheme } from "next-themes";
import { AnimatedThemeToggler } from "@/components/vendor/magicui/theme-toggler";
import { cn } from "@/lib/utils";

/**
 * Real dark/light switch for the app shell — wraps the supplied Animated
 * Theme Toggler (magicui) in controlled mode so next-themes owns
 * persistence; see docs/ui-components/COMPONENT_MAP.md.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <AnimatedThemeToggler
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={setTheme}
      variant="circle"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    />
  );
}
