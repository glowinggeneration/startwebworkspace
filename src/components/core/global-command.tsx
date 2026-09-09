import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { NavItem } from "@/components/application/shell/nav-items";

const OPEN_EVENT = "startweb:open-command-palette";

/** Lets the top bar search field open the same palette as Cmd/Ctrl+K. */
export function openCommandPalette() {
  document.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/** Cmd/Ctrl+K quick nav across the shell's own nav items. Search across
 * CRM/project/invoice records is wired in once those features exist. */
export function GlobalCommandPalette({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function handleOpen() {
      setOpen(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener(OPEN_EVENT, handleOpen);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener(OPEN_EVENT, handleOpen);
    };
  }, []);


  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to…" aria-label="Quick navigation" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Go to">
          {items.map((item) => (
            <CommandItem
              key={item.to}
              value={item.label}
              onSelect={() => {
                setOpen(false);
                void navigate({ to: item.to });
              }}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
