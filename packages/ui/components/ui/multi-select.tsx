"use client";

/**
 * MultiSelect — multi-pick combobox.
 *
 * Composes Popover + Command (cmdk) + Badge + Checkbox into the
 * pattern popularised by sersavan/shadcn-multi-select-component:
 *
 *   - Trigger: a button that shows the currently-selected items as
 *     removable Badges. Past `maxCount` selected items it collapses
 *     into a "+N more" badge so the trigger doesn't grow forever.
 *   - Open: a Popover containing a searchable Command list. Each
 *     row is a checkable item; a leading icon is optional per
 *     option.
 *   - Footer actions: Select all · Clear · Close.
 *
 * Controlled and uncontrolled both supported (value / defaultValue
 * mirroring Radix conventions). Selection is `string[]` — the
 * caller pulls the matching option objects from their own `options`
 * array when needed.
 *
 * Data-driven via `options` rather than compound children. Multi-
 * select lists are typically dozens of items long; declaring each
 * one in JSX is noisy and the per-item icon prop doesn't have a
 * natural children-API equivalent. A compound API (`MultiSelect.Item`)
 * could land later for the few cases that need fully custom rendering.
 *
 * Theming: visual surfaces (popover bg, badge fill, focus rings)
 * inherit from the theme tokens the underlying Popover / Badge /
 * Checkbox already read from. No new `--rds-multi-select-*` vars
 * needed yet; if/when callers want to retune density (e.g. a
 * compact variant), add them then.
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
  /** Value stored in selection. Must be unique. */
  value: string;
  /** Display label for the dropdown row and selected badge. */
  label: string;
  /** Optional lucide-style icon component (or any React component
   *  accepting a className). Rendered both in the dropdown row and
   *  on the badge. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Disables the row in the dropdown — selection is locked in
   *  whichever state it's currently in. */
  disabled?: boolean;
}

export interface MultiSelectProps {
  /** The full pool of selectable items. */
  options: MultiSelectOption[];
  /** Controlled value. When provided, `onValueChange` MUST be wired
   *  or the component becomes a read-only display of `value`. */
  value?: string[];
  /** Uncontrolled initial value. Ignored if `value` is provided. */
  defaultValue?: string[];
  /** Fired whenever the selection changes. The full next selection
   *  is passed — caller doesn't need to reconcile add/remove. */
  onValueChange?: (next: string[]) => void;
  /** Placeholder text on the trigger when nothing is selected. */
  placeholder?: string;
  /** Search-input placeholder. Default "Search…". */
  searchPlaceholder?: string;
  /** Message rendered when search returns no rows. */
  emptyMessage?: string;
  /** Max badges to show on the trigger before collapsing to
   *  `+N more`. Default 3. Pass `Infinity` to never collapse. */
  maxCount?: number;
  /** Hide the Search input. Useful for short option lists. */
  searchable?: boolean;
  /** Hide the per-badge × button. Selected items can still be
   *  toggled off through the dropdown. */
  badgeDismissible?: boolean;
  /** Disable the whole control. */
  disabled?: boolean;
  /** Drives Popover's `modal` prop — when true, clicks outside the
   *  dropdown don't dismiss it until an explicit close. Default false. */
  modalPopover?: boolean;
  /** Extra classes on the trigger. */
  className?: string;
  /** Forwarded to the trigger button for tests / Studio selection. */
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
    ...rest
  },
  ref,
) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState<string[]>(
    defaultValue ?? [],
  );
  const value = isControlled ? controlledValue! : internalValue;
  const [open, setOpen] = React.useState(false);

  // Build a quick lookup so we can render selected badges in selection
  // order without re-scanning `options` on every render.
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
            // Match Input's surface — same min-height, padding, border,
            // focus ring — so MultiSelect lines up with form siblings.
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
