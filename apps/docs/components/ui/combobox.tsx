"use client";

/**
 * Combobox — single-pick searchable picker. The single-select sibling of
 * MultiSelect, and the "selectable badge" pattern popularised by Linear's
 * status / priority pickers.
 *
 * Composes Popover + Command (cmdk) + Button into:
 *
 *   - Trigger: a button showing the selected option (its icon + label, or
 *     a fully custom node via `renderValue`). `triggerVariant="inline"`
 *     drops the form-control chrome so the trigger reads as an inline
 *     token — render a Badge through `renderValue` and the value becomes a
 *     clickable badge that opens the menu (the Linear move).
 *   - Open: a Popover with a searchable Command list; each row carries an
 *     optional leading icon and a check on the selected item.
 *   - Optional `clearable` adds a "Clear" row so the value can return to
 *     unset (null).
 *
 * Controlled and uncontrolled both supported (value / defaultValue mirror
 * Radix conventions). Selection is a single `string | null` — the caller
 * pulls the matching option object from their own `options` array.
 *
 * Read-only / permissions: pass `disabled` to lock the control to a
 * display of its current value (the trigger stops opening). A
 * permission check ("can this user edit?") drives that prop; the Combobox
 * itself stays unaware of access rules.
 *
 * Data-driven via `options` rather than compound children — picker lists
 * run dozens of items long and the per-option icon has no natural
 * children-API equivalent. Theming inherits from Popover / Command /
 * Button / Badge; no new `--gds-combobox-*` tokens needed yet.
 */

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
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

export interface ComboboxOption {
  /** Value stored in selection. Must be unique. */
  value: string;
  /** Display label for the dropdown row and the trigger. */
  label: string;
  /** Optional lucide-style icon (any component accepting className).
   *  Rendered in the dropdown row and, by default, on the trigger. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Extra search terms beyond the label (cmdk matches against these). */
  keywords?: string[];
  /** Disable the row — it can't be picked. */
  disabled?: boolean;
}

type ComboboxTriggerVariant = "default" | "inline";

export interface ComboboxProps {
  /** The full pool of selectable items. */
  options: ComboboxOption[];
  /** Controlled value. When provided, wire `onValueChange` or the
   *  control becomes a read-only display of `value`. */
  value?: string | null;
  /** Uncontrolled initial value. Ignored if `value` is provided. */
  defaultValue?: string | null;
  /** Fired with the next value (or null when cleared). */
  onValueChange?: (next: string | null) => void;
  /** Trigger text when nothing is selected. */
  placeholder?: string;
  /** Search-input placeholder. Default "Search…". */
  searchPlaceholder?: string;
  /** Message rendered when search returns no rows. */
  emptyMessage?: string;
  /** Hide the search input (short lists). Default true (shown). */
  searchable?: boolean;
  /** Add a "Clear" row so the value can return to unset. */
  clearable?: boolean;
  /** `default` (form-control surface, like Select) or `inline` (chrome-free
   *  token trigger — pair with `renderValue` to render a Badge). */
  triggerVariant?: ComboboxTriggerVariant;
  /** Render the selected value yourself (e.g. as a Badge). Falls back to
   *  the option's icon + label. Receives the resolved option. */
  renderValue?: (option: ComboboxOption) => React.ReactNode;
  /** Hide the trailing chevron (useful for the inline token look). */
  hideChevron?: boolean;
  /** Lock the control to a display of its current value. */
  disabled?: boolean;
  /** Popover `modal` — outside clicks don't dismiss until explicit close. */
  modalPopover?: boolean;
  /** PopoverContent alignment. Default "start". */
  align?: "start" | "center" | "end";
  /** Extra classes on the trigger. */
  className?: string;
  /** Forwarded to the trigger for tests / Studio selection. */
  id?: string;
  "aria-label"?: string;
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  function Combobox(
    {
      options,
      value: controlledValue,
      defaultValue = null,
      onValueChange,
      placeholder = "Select…",
      searchPlaceholder = "Search…",
      emptyMessage = "Nothing matches.",
      searchable = true,
      clearable = false,
      triggerVariant = "default",
      renderValue,
      hideChevron = false,
      disabled = false,
      modalPopover = false,
      align = "start",
      className,
      id,
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = React.useState<string | null>(
      defaultValue,
    );
    const value = isControlled ? controlledValue! : internalValue;
    const [open, setOpen] = React.useState(false);

    const selected = React.useMemo(
      () => options.find((o) => o.value === value) ?? null,
      [options, value],
    );

    const commit = React.useCallback(
      (next: string | null) => {
        if (!isControlled) setInternalValue(next);
        onValueChange?.(next);
      },
      [isControlled, onValueChange],
    );

    const pick = (v: string) => {
      // Re-selecting the current value when clearable toggles it off.
      commit(clearable && v === value ? null : v);
      setOpen(false);
    };

    const inline = triggerVariant === "inline";
    const SelectedIcon = selected?.icon;

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
            data-gds-part="combobox"
            data-variant={triggerVariant}
            className={cn(
              "ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              inline
                ? // Chrome-free token trigger — reads as the value itself.
                  "inline-flex max-w-full items-center gap-1 rounded-md px-1 py-0.5 text-sm hover:bg-muted data-[state=open]:bg-muted"
                : // Form-control surface — lines up with Input / Select siblings.
                  "flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm data-[state=open]:ring-1 data-[state=open]:ring-ring",
              className,
            )}
            {...rest}
          >
            <span
              className={cn(
                "flex min-w-0 items-center gap-1.5",
                !selected && "text-muted-foreground",
              )}
              data-gds-part="combobox-value"
            >
              {selected ? (
                renderValue ? (
                  renderValue(selected)
                ) : (
                  <>
                    {SelectedIcon ? (
                      <SelectedIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : null}
                    <span className="truncate">{selected.label}</span>
                  </>
                )
              ) : (
                placeholder
              )}
            </span>
            {!hideChevron && (
              <ChevronsUpDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground",
                  inline && "opacity-60",
                )}
                aria-hidden
              />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0"
          data-gds-part="combobox-content"
        >
          <Command
            filter={(itemValue, search, keywords) => {
              const haystack = `${itemValue} ${(keywords ?? []).join(" ")}`.toLowerCase();
              return haystack.includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            {searchable && <CommandInput placeholder={searchPlaceholder} />}
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = opt.value === value;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      keywords={opt.keywords}
                      onSelect={() => pick(opt.value)}
                      disabled={opt.disabled}
                      data-gds-part="combobox-item"
                      data-selected={isSelected || undefined}
                      // Icons muted at rest, but inherit the highlighted
                      // foreground so they invert with the row (not left
                      // stranded in muted grey on the accent fill).
                      className="[&_svg]:text-muted-foreground data-[selected=true]:[&_svg]:text-accent-foreground"
                    >
                      {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
                      <span className="truncate">{opt.label}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                        aria-hidden
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {clearable && value !== null && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        commit(null);
                        setOpen(false);
                      }}
                      data-gds-part="combobox-clear"
                      className="[&_svg]:text-muted-foreground data-[selected=true]:[&_svg]:text-accent-foreground"
                    >
                      <X className="mr-2 h-4 w-4" />
                      <span>Clear</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
Combobox.displayName = "Combobox";
