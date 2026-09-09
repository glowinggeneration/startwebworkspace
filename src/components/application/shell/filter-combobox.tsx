import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Optional leading icon for this option. */
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  /** When set, the option shows an initials avatar instead of an icon. */
  avatarName?: string;
  /** Optional second line, for example an email address or a count. */
  description?: string;
};

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function OptionMark({ option }: { option: ComboboxOption }) {
  if (option.avatarName) {
    return (
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.625rem] font-semibold text-secondary-foreground"
      >
        {initialsOf(option.avatarName)}
      </span>
    );
  }
  if (option.icon) {
    const Leading = option.icon;
    return <Leading className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />;
  }
  return null;
}

/**
 * Searchable single-select filter: a quiet trigger showing the current choice,
 * opening a type-to-filter list. Replaces plain selects where a workspace can
 * grow past a handful of options.
 */
export function FilterCombobox({
  value,
  onValueChange,
  options,
  icon: Icon,
  ariaLabel,
  placeholder,
  searchPlaceholder = "Search...",
  emptyLabel = "Nothing found.",
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  ariaLabel: string;
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(
            "h-11 w-56 justify-between gap-2 bg-card font-normal tracking-[-0.006em]",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected && (selected.avatarName || selected.icon) ? (
              <OptionMark option={selected} />
            ) : Icon ? (
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden={true} />
            ) : null}
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected?.label ?? placeholder}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-10" />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <OptionMark option={option} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? (
                      <span className="type-meta block truncate text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  <Check
                    className={cn(
                      "size-4 shrink-0 text-primary",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
