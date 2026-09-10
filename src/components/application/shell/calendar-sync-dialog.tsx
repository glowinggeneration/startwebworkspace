import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingIndicator } from "@/components/application/shell/loading-indicator";
import { getCalendarFeed, rotateCalendarFeed } from "@/lib/calendar-feed.functions";
import { useActiveWorkspace } from "@/hooks/use-active-workspace";

/**
 * Gives each person a private subscription link for the workspace calendar so
 * project dates, next steps and campaign actions appear in Outlook, Apple
 * Calendar or Google Calendar and keep refreshing on their own.
 */
export function CalendarSyncDialog() {
  const { workspaceId } = useActiveWorkspace();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const loadFeed = useServerFn(getCalendarFeed);
  const rotateFeed = useServerFn(rotateCalendarFeed);

  const feed = useQuery({
    queryKey: ["calendar-feed", workspaceId],
    enabled: open && workspaceId !== "",
    queryFn: () => loadFeed({ data: { workspaceId } }),
  });

  const rotate = useMutation({
    mutationFn: () => rotateFeed({ data: { workspaceId } }),
    onSuccess: (next) => {
      queryClient.setQueryData(["calendar-feed", workspaceId], next);
      toast.success("New link created", {
        description: "Add the new link in your calendar app. The old one has stopped working.",
      });
    },
    onError: (error) =>
      toast.error("Couldn't create a new link", {
        description: error instanceof Error ? error.message : undefined,
      }),
  });

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = feed.data ? `${origin}${feed.data.path}` : "";
  const webcal = url.replace(/^https?:/, "webcal:");

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy, select the link and copy it manually");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarPlus className="size-4" aria-hidden="true" />
          Sync to Outlook
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Open this calendar in Outlook</DialogTitle>
          <DialogDescription>
            Subscribe once and every project start, delivery date, next step and campaign action
            keeps updating in your calendar. The link is private to you, so treat it like a
            password.
          </DialogDescription>
        </DialogHeader>

        {feed.isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <LoadingIndicator size="sm" /> Preparing your link...
          </div>
        ) : feed.isError ? (
          <p className="py-4 text-sm text-destructive">
            Couldn&apos;t prepare your calendar link. Close this and try again.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="calendar-feed-url">
                Calendar link
              </label>
              <div className="flex gap-2">
                <Input id="calendar-feed-url" readOnly value={url} className="font-mono text-xs" />
                <Button variant="outline" onClick={() => void copy(url, "Link")}>
                  <Copy className="size-4" aria-hidden="true" />
                  Copy
                </Button>
              </div>
            </div>

            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>In Outlook, open Calendar, then Add calendar, then Subscribe from web.</li>
              <li>Paste the link above and give it a name such as Startweb deadlines.</li>
              <li>Outlook refreshes it on its own, so new dates appear without any export.</li>
            </ol>

            <p className="text-sm text-muted-foreground">
              On a Mac or iPhone you can{" "}
              <a className="font-medium text-primary underline" href={webcal}>
                open it directly in Calendar
              </a>
              .
            </p>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => rotate.mutate()}
            disabled={rotate.isPending || !feed.data}
          >
            {rotate.isPending ? (
              <LoadingIndicator size="sm" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Create a new link
          </Button>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
