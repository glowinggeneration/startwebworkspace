import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when someone types the address of a page their role does not cover.
 * The database policies are the real boundary; this is the polite door.
 */
export function AccessRestricted({ landing = "/dashboard" }: { landing?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="card-surface max-w-md rounded-card p-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <ShieldAlert className="size-5" />
        </span>
        <h1 className="type-card mb-2">Access restricted</h1>
        <p className="type-body mb-6 text-muted-foreground">
          This page is not part of your role in the workspace. Ask Thabo if you need it opened up.
        </p>
        <Button asChild>
          <Link to="/dashboard" search={{}} params={{}} data-landing={landing}>
            Back to my dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
