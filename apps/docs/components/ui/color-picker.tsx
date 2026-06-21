"use client";

/**
 * ColorPicker — a token-led, grouped, searchable colour picker. The
 * single-select sibling of FillPicker's solid tab: where FillPicker is the
 * full Figma paint popover (solid / gradient / image / …), ColorPicker is
 * the focused "pick one colour token" control.
 *
 * Two exports:
 *   - <ColorPickerPanel> — the popover BODY (header + search + grouped
 *     list). Reusable: the inspector's colour fields host it inside their
 *     own TokenField-chrome popover so every colour control shares ONE
 *     panel. Matches the Figma "Color Picker" frame: a "Color" title with
 *     a ghost close button, a search input, then DropdownMenuItem-style
 *     rows (Swatch + token name + check) grouped by family.
 *   - <ColorPicker> — panel + a self-contained trigger (swatch + name or,
 *     with `triggerVariant="inline"`, just the swatch).
 *
 * Grade is token-led, so the value is a token NAME ("action/primary"), the
 * literal "transparent", or null. The Swatch resolves the live CSS variable,
 * so every chip re-voices when the theme changes.
 */

import * as React from "react";
import { Check, X } from "lucide-react";

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
export function colorTokenShortName(value: string): string {
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

export interface ColorPickerPanelProps {
  /** Current value (token name, "transparent", or null). */
  value?: string | null;
  /** Fired with the next value. */
  onValueChange?: (value: string | null) => void;
  /** Token families offered in the list. */
  tokens?: ColorTokenGroup[];
  /** Show the search input. Default true. */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Include a "Transparent" option at the top. Default true. */
  allowTransparent?: boolean;
  /** Header title. Pass null to drop the header entirely. Default "Color". */
  title?: string | null;
  /** When provided, renders the header's ghost close button. */
  onClose?: () => void;
}

/**
 * ColorPickerPanel — the popover body. Header (title + close), search, then
 * the grouped token rows. Hosted by <ColorPicker> and by the inspector's
 * colour fields alike, so there's a single source of truth for the list.
 */
export function ColorPickerPanel({
  value = null,
  onValueChange,
  tokens = DEFAULT_COLOR_TOKEN_GROUPS,
  searchable = true,
  searchPlaceholder = "Search…",
  emptyMessage = "No colours match.",
  allowTransparent = true,
  title = "Color",
  onClose,
}: ColorPickerPanelProps) {
  const pick = (next: string) => onValueChange?.(next);

  return (
    <div className="flex flex-col gap-2">
      {title != null ? (
        <div className="flex items-center justify-between gap-1 pl-1">
          <span className="text-[13px] leading-none text-foreground">
            {title}
          </span>
          {onClose ? (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_svg]:size-3.5"
            >
              <X />
            </button>
          ) : null}
        </div>
      ) : null}
      <Command
        filter={(itemValue, search, keywords) => {
          const haystack =
            `${itemValue} ${(keywords ?? []).join(" ")}`.toLowerCase();
          return haystack.includes(search.toLowerCase()) ? 1 : 0;
        }}
      >
        {searchable && (
          <CommandInput placeholder={searchPlaceholder} className="h-8 text-xs" />
        )}
        {/* FIXED height (not max-h): the popover size stays constant while
            you type, so filtering the list never resizes the content and
            Radix never repositions the popover mid-search. Long sets scroll
            within it; short sets leave quiet space below. */}
        <CommandList className="h-56 overflow-y-auto overflow-x-hidden">
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
    </div>
  );
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
  /** Popover header title. Default "Color"; pass null to drop the header. */
  title?: string | null;
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
      searchPlaceholder = "Search…",
      emptyMessage = "No colours match.",
      allowTransparent = true,
      title = "Color",
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
                  <span className="truncate">{colorTokenShortName(value!)}</span>
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
          className="w-64 rounded-xl p-2"
          data-gds-part="color-picker-content"
        >
          <ColorPickerPanel
            value={value}
            onValueChange={(v) => {
              onValueChange?.(v);
              setOpen(false);
            }}
            tokens={tokens}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            allowTransparent={allowTransparent}
            title={title}
            onClose={() => setOpen(false)}
          />
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
      keywords={[colorTokenShortName(value)]}
      onSelect={() => onSelect(value)}
      data-gds-part="color-picker-item"
      data-selected={selected || undefined}
      className="gap-2 px-2 py-1 text-xs [&_svg]:size-3.5"
    >
      <TokenSwatch value={value} />
      <span className="truncate">{colorTokenShortName(value)}</span>
      <Check
        className={cn("ml-auto h-3.5 w-3.5", selected ? "opacity-100" : "opacity-0")}
        aria-hidden
      />
    </CommandItem>
  );
}
