"use client";

/**
 * ColorPicker — a token-led, grouped, searchable colour picker. The
 * single-select sibling of FillPicker's solid tab: where FillPicker is the
 * full Figma paint popover (solid / gradient / image / …), ColorPicker is
 * the focused "pick one colour token" control.
 *
 * Composes Popover + Command (cmdk) the same way Combobox does internally:
 *
 *   - Trigger: a button showing the selected token as a small <Swatch> + its
 *     short name. `triggerVariant="inline"` drops the form chrome down to
 *     just a clickable swatch — the inspector / fill-row affordance.
 *   - Open: a Popover with a searchable Command list, grouped by token family
 *     (surface · action · status), each row a Swatch + the token's last path
 *     segment, with a check on the selected row. A "Transparent" option sits
 *     at the top.
 *
 * Grade is token-led, so the value is a token NAME ("action/primary"), the
 * literal "transparent", or null. The Swatch resolves the live CSS variable,
 * so every chip re-voices when the theme changes.
 */

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Swatch } from "@/components/ui/swatch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** A named family of colour tokens, rendered as one group in the list. */
export interface ColorTokenGroup {
  /** Group heading (e.g. "action"). */
  group: string;
  /** Token NAMES in this group (e.g. "action/primary"). */
  tokens: string[];
}

/** Default token groups — the Grade semantic colour families. */
export const DEFAULT_COLOR_TOKEN_GROUPS: ColorTokenGroup[] = [
  {
    group: "surface",
    tokens: ["surface/background", "surface/card", "surface/popover"],
  },
  {
    group: "action",
    tokens: [
      "action/primary",
      "action/secondary",
      "action/accent",
      "action/muted",
      "action/destructive",
    ],
  },
  {
    group: "status",
    tokens: [
      "status/success",
      "status/warning",
      "status/info",
      "status/highlight",
    ],
  },
];

/** The literal value for "no fill". */
export const TRANSPARENT = "transparent";

type ColorPickerTriggerVariant = "default" | "inline";

/** Short label = the last path segment of a token name. */
function shortName(value: string): string {
  if (value === TRANSPARENT) return "Transparent";
  const seg = value.split("/").pop() ?? value;
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

/** A small Swatch for a token name or the transparent literal. */
function TokenSwatch({ value }: { value: string }) {
  if (value === TRANSPARENT) {
    return <Swatch size="2xs" shape="rounded" type="solid" color="transparent" />;
  }
  return <Swatch size="2xs" shape="rounded" token={value} />;
}

export interface ColorPickerProps {
  /** A Grade colour token NAME ("action/primary"), the literal "transparent",
   *  or null when nothing is picked. */
  value?: string | null;
  /** Fired with the next value (token name, "transparent", or null). */
  onValueChange?: (value: string | null) => void;
  /** Token families offered in the list. Defaults to the Grade semantic set. */
  tokens?: ColorTokenGroup[];
  /** Show the search input. Default true. */
  searchable?: boolean;
  /** `default` (form-control surface, swatch + name) or `inline` (just a
   *  clickable swatch — the inspector / fill-row affordance). */
  triggerVariant?: ColorPickerTriggerVariant;
  /** Trigger text when nothing is selected. */
  placeholder?: string;
  /** Search-input placeholder. */
  searchPlaceholder?: string;
  /** Message rendered when search returns no rows. */
  emptyMessage?: string;
  /** Include a "Transparent" option at the top. Default true. */
  allowTransparent?: boolean;
  /** PopoverContent alignment. Default "start". */
  align?: "start" | "center" | "end";
  /** Lock the control to a display of its current value. */
  disabled?: boolean;
  /** Extra classes on the trigger. */
  className?: string;
  /** Forwarded to the trigger for tests / Studio selection. */
  id?: string;
  "aria-label"?: string;
}

export const ColorPicker = React.forwardRef<HTMLButtonElement, ColorPickerProps>(
  function ColorPicker(
    {
      value = null,
      onValueChange,
      tokens = DEFAULT_COLOR_TOKEN_GROUPS,
      searchable = true,
      triggerVariant = "default",
      placeholder = "Pick a colour",
      searchPlaceholder = "Search colours…",
      emptyMessage = "No colours match.",
      allowTransparent = true,
      align = "start",
      disabled = false,
      className,
      id,
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) {
    const [open, setOpen] = React.useState(false);

    const pick = (next: string) => {
      onValueChange?.(next);
      setOpen(false);
    };

    const inline = triggerVariant === "inline";
    const hasValue = value != null;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={ariaLabel ?? placeholder}
            disabled={disabled}
            data-gds-part="color-picker"
            data-variant={triggerVariant}
            className={cn(
              "ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              inline
                ? // Chrome-free — just the swatch as a hit target.
                  "inline-flex items-center rounded-md p-0.5 hover:bg-muted data-[state=open]:bg-muted"
                : // Form-control surface — lines up with Input / Select siblings.
                  "flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-sm data-[state=open]:ring-1 data-[state=open]:ring-ring",
              className,
            )}
            {...rest}
          >
            {hasValue ? (
              <>
                <TokenSwatch value={value!} />
                {!inline && (
                  <span className="truncate">{shortName(value!)}</span>
                )}
              </>
            ) : inline ? (
              <span className="size-4 rounded-[2px] border border-dashed border-input" />
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          className="w-56 p-0"
          data-gds-part="color-picker-content"
        >
          <Command
            filter={(itemValue, search, keywords) => {
              const haystack =
                `${itemValue} ${(keywords ?? []).join(" ")}`.toLowerCase();
              return haystack.includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            {searchable && <CommandInput placeholder={searchPlaceholder} />}
            <CommandList className="max-h-56 overflow-y-auto">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {allowTransparent && (
                <CommandGroup>
                  <ColorRow
                    value={TRANSPARENT}
                    selected={value === TRANSPARENT}
                    onSelect={pick}
                  />
                </CommandGroup>
              )}
              {tokens.map(({ group, tokens: list }) => (
                <CommandGroup key={group} heading={group}>
                  {list.map((tok) => (
                    <ColorRow
                      key={tok}
                      value={tok}
                      selected={value === tok}
                      onSelect={pick}
                    />
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
ColorPicker.displayName = "ColorPicker";

function ColorRow({
  value,
  selected,
  onSelect,
}: {
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <CommandItem
      value={value}
      keywords={[shortName(value)]}
      onSelect={() => onSelect(value)}
      data-gds-part="color-picker-item"
      data-selected={selected || undefined}
    >
      <TokenSwatch value={value} />
      <span className="truncate">{shortName(value)}</span>
      <Check
        className={cn("ml-auto h-4 w-4", selected ? "opacity-100" : "opacity-0")}
        aria-hidden
      />
    </CommandItem>
  );
}
