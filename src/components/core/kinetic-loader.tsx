import { cn } from "@/lib/utils";

/**
 * Quiet kinetic word-mark loader: the first letter compresses and a dot travels
 * around it. Uses the app typeface and stops for reduced-motion users.
 */
export function KineticTextLoader({
  text = "Loading",
  className,
}: {
  text?: string;
  className?: string;
}) {
  const [first, ...rest] = text.split("");

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("relative flex items-center justify-center", className)}
    >
      <span className="sr-only">{text}</span>
      <div aria-hidden="true" className="relative">
        <span className="kinetic-dot absolute top-[1.4rem] left-[2.9rem] z-10 size-1.5 rounded-full bg-primary" />
        <p className="relative m-0 text-[2.25rem] leading-none font-light tracking-[-0.02em] whitespace-nowrap text-foreground">
          <span className="kinetic-letter inline-block origin-[100%_70%] tracking-[0.35rem]">
            {first}
          </span>
          {rest.map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="kinetic-stretch inline-block"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
