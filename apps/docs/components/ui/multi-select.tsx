"use client";

/**
 * MultiSelect — apps/docs parallel copy of @gradeui/ui's MultiSelect.
 * See packages/ui/components/ui/multi-select.tsx for the canonical
 * version (and the sidecar at packages/ui/components/ui/multi-select.md
 * for the API + anti-patterns).
 *
 * These must stay in sync until the docs site migrates to importing
 * from `@gradeui/ui` directly (gradeui/CLAUDE.md "Docs-site work").
 */

import * as React from "react";
import { Check, ChevronDown, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export interface MultiSelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxCount?: number;
  searchable?: boolean;
  badgeDismissible?: boolean;
  disabled?: boolean;
  modalPopover?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

const DEFAULT_MAX_COUNT = 3;

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(function MultiSelect(
  {
    options,
    value: controlledValue,
    defaultValue,
    onValueChange,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyMessage = "Nothing matches.",
    maxCount = DEFAULT_MAX_COUNT,
    searchable = true,
    badgeDismissible = true,
    disabled = false,
    modalPopover = false,
    className,
    id,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState<string[]>(
    defaultValue ?? [],
  );
  const value = isControlled ? controlledValue! : internalValue;
  const [open, setOpen] = React.useState(false);

  const optionByValue = React.useMemo(() => {
    const map = new Map<string, MultiSelectOption>();
    for (const opt of options) map.set(opt.value, opt);
    return map;
  }, [options]);

  const commit = React.useCallback(
    (next: string[]) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const toggle = (v: string) => {
    if (value.includes(v)) {
      commit(value.filter((x) => x !== v));
    } else {
      commit([...value, v]);
    }
  };

  const removeOne = (e: React.MouseEvent | React.KeyboardEvent, v: string) => {
    e.preventDefault();
    e.stopPropagation();
    commit(value.filter((x) => x !== v));
  };

  const clearAll = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    commit([]);
  };

  const selectAll = () => {
    const enabled = options.filter((o) => !o.disabled).map((o) => o.value);
    commit(enabled);
  };

  const allSelected =
    options.length > 0 &&
    options
      .filter((o) => !o.disabled)
      .every((o) => value.includes(o.value));

  const visibleBadgeValues = value.slice(0, maxCount);
  const overflowCount = Math.max(0, value.length - maxCount);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modalPopover}>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          disabled={disabled}
          data-gds-part="multi-select"
          className={cn(
            "flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent pl-2 pr-2 text-sm shadow-sm",
            "ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&[data-state=open]]:ring-1 [&[data-state=open]]:ring-ring",
            className,
          )}
        >
          {value.length === 0 ? (
            <span className="text-muted-foreground px-1">{placeholder}</span>
          ) : (
            <div
              className="flex flex-1 flex-wrap items-center gap-1 py-1"
              data-gds-part="multi-select-badges"
            >
              {visibleBadgeValues.map((v) => {
                const opt = optionByValue.get(v);
                if (!opt) return null;
                const Icon = opt.icon;
                return (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="gap-1 pr-1"
                    data-gds-part="multi-select-badge"
                  >
                    {Icon ? <Icon className="h-3 w-3" /> : null}
                    <span className="truncate max-w-[12rem]">{opt.label}</span>
                    {badgeDismissible && !disabled && (
                      <span
                        role="button"
                        aria-label={`Remove ${opt.label}`}
                        tabIndex={0}
                        onClick={(e) => removeOne(e, v)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            removeOne(e, v);
                          }
                        }}
                        className="ml-0.5 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </span>
                    )}
                  </Badge>
                );
              })}
              {overflowCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-muted-foreground"
                  data-gds-part="multi-select-overflow"
                  title={value
                    .slice(maxCount)
                    .map((v) => optionByValue.get(v)?.label ?? v)
                    .join(", ")}
                >
                  +{overflowCount} more
                </Badge>
              )}
            </div>
          )}
          <div className="flex shrink-0 items-center gap-1">
            {value.length > 0 && !disabled && (
              <span
                role="button"
                aria-label="Clear all"
                tabIndex={0}
                onClick={(e) => clearAll(e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") clearAll(e);
                }}
                className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <XCircle className="h-3.5 w-3.5" aria-hidden />
              </span>
            )}
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        data-gds-part="multi-select-content"
      >
        <Command>
          {searchable && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const Icon = opt.icon;
                const selected = value.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => toggle(opt.value)}
                    disabled={opt.disabled}
                    data-gds-part="multi-select-item"
                    data-selected={selected || undefined}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                      aria-hidden
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    {Icon ? (
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    ) : null}
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <div className="flex items-center justify-between gap-1 p-1">
                <CommandItem
                  onSelect={selectAll}
                  className="flex-1 justify-center text-xs"
                  disabled={allSelected}
                >
                  Select all
                </CommandItem>
                <Separator orientation="vertical" className="h-5" />
                <CommandItem
                  onSelect={() => clearAll()}
                  className="flex-1 justify-center text-xs"
                  disabled={value.length === 0}
                >
                  Clear
                </CommandItem>
                <Separator orientation="vertical" className="h-5" />
                <CommandItem
                  onSelect={() => setOpen(false)}
                  className="flex-1 justify-center text-xs"
                >
                  Close
                </CommandItem>
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
MultiSelect.displayName = "MultiSelect";
