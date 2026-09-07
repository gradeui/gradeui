// @brightlocal/facet-menu — ONE way to choose a filter value.
//
// WHY THIS EXISTS (Ali, 7 Sep: "we now HAVE 2 different ways to choose
// filters. WHY. Pretty sure we want the one with the checkboxes, its clearer",
// and "I thought you had made them all components???"). Fair. Review Manager
// and Review Tracker had each built their own facet list, so the same source
// filter drew checkboxes on one page and ticks on the other. Review Manager's
// is the one that was right, and it already carried the `select` prop that
// makes both behaviours one component; it just never left that screen.
//
//   select="multi"   a checkbox per row. Use it whenever more than one value
//                    can be on at once, which is nearly always.
//   select="single"  a tick on the chosen row, for a genuine one-of-many like
//                    a time period.
//
// There is deliberately NO disabled "No reviews yet" group. Ali asked for it
// to go from every page (7 Sep): a list of sites you cannot pick is noise.
// Only offer sources that have reviews.
//
// TWO THINGS THAT LOOK LIKE MISTAKES AND ARE NOT:
//   The checkbox is DRAWN, not a DS <Checkbox>. A focusable control nested
//   inside a listbox option is a keyboard trap, and CommandItem already
//   carries aria-selected. The box mirrors the DS Checkbox's own classes.
//   The row is a CommandItem, so hover, keyboard and cmdk's filtering all
//   come for free; an earlier hand-rolled version had to reimplement all
//   three and still got them wrong.
import * as React from "react";

import { Check, ChevronDown } from "@brightlocal/icons";
import { Button } from "@brightlocal/ui-components/button";
import { Popover, PopoverTrigger, PopoverContent } from "@brightlocal/ui-components/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@brightlocal/ui-components/command";

// Command's root is `rounded-lg border shadow-md bg-popover`; it assumes it
// is the surface. Inside a Popover (or a Drawer) the parent is the surface,
// so Command sheds its chrome. Exported because Review Manager's filter sheet
// builds on it.
export const FACET_COMMAND_CLASS =
  "rounded-[inherit] border-0 bg-transparent shadow-none [&_[data-slot=command-group]]:p-1 [&_[data-slot=command-item]]:py-1.5 [&_[data-slot=command-input]]:text-sm [&_[data-slot=command-input-wrapper]]:h-10";

// ─── FacetCheck — the selected affordance on a facet row ──────────────
// A DRAWN checkbox, not the DS's Checkbox component. Ali asked what best
// practice is here (19 Aug), and it splits by surface:
//
//   A dropdown/popover facet menu is a MENU. Menu convention is a check on
//   the selected row, no empty boxes for the rest.
//   A filter sheet or panel is a FORM. Every filter sheet you have used on a
//   phone (Amazon, Airbnb, Booking) shows checkboxes, because the box is what
//   says "you can pick several, and here is what you have not picked".
//
// Both are defensible, and the sheet wants boxes. What is NOT defensible is a
// real Checkbox inside the row: CommandItem is itself the interactive option
// (role="option", aria-selected), so nesting a focusable control inside it is
// a keyboard trap and, as a button inside a button, invalid markup that
// browsers repair by closing the outer element early.
//
// So the box is drawn and aria-hidden, which is exactly what shadcn's own
// faceted-filter recipe does. The row keeps one control, one focus stop and
// the aria state, and it LOOKS like the checkbox list people expect. Applies
// to the desktop menus too, since they mount the same list: a multi-select
// facet that showed only a check never advertised that you could pick several.
export function FacetCheck({ select, checked }) {
  if (select === "single") {
    return (
      <span aria-hidden="true" className="flex w-4 shrink-0 justify-center">
        {checked ? <Check className="size-4" /> : null}
      </span>
    );
  }
  // The box mirrors the DS Checkbox's OWN classes, lifted from its dist:
  // size-[18px], rounded-xs, border-ring on bg-background, and
  // bg-primary/border-primary/text-primary-foreground when checked. The tick
  // is a plain <Check /> at its natural size and stroke, laid out by a
  // centring flex box, exactly as the real component's indicator does it.
  //
  // The first version guessed at all of that — size-4, rounded-[4px],
  // border-input, and a size-3 tick at strokeWidth 3 — and read as a drawing
  // of a checkbox rather than the component (Ali, 19 Aug: "distinctly hand
  // drawn… fat tickmark gives it away"). If it has to be drawn, it should be
  // drawn from the source, not from memory.
  return (
    <span
      aria-hidden="true"
      className={`duration-fast flex size-[18px] shrink-0 items-center justify-center rounded-xs border transition-colors ease-out ${
        checked
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-background border-ring"
      }`}
    >
      {checked ? <Check /> : null}
    </span>
  );
}

// ─── FacetOptions — the option list, with no surface ──────────────────
// Lifted out of FacetedFilterMenu so the mobile sheet renders the SAME rows
// as the desktop menu (Ali, 19 Aug: "I'd expect this to use a component we
// already have? So maybe the command item was it?" — it was). One definition
// means one set of paddings, one hover treatment, one selected affordance,
// and cmdk's filtering wherever it is mounted.
//
// The check on the right, NOT a Checkbox in the row: a focusable control
// nested in a listbox option is a keyboard trap, and Command already carries
// aria-selected. This was already the rule here; the first cut of the sheet
// broke it and had to hand-roll rows, hover states and key handling to get
// back to what CommandItem does for free.
export function FacetOptions({
  // "multi" draws a checkbox on each row; "single" draws a check on the
  // selected one. See FacetCheck for why the box is drawn rather than being
  // a real Checkbox.
  select = "multi",
  options,
  isChecked,
  isAllSelected,
  onAll,
  onOption,
  allLabel,
  allCount,
  dataHook,
}) {
  const groups = [];
  options.forEach((o) => {
    if (o.group && !groups.includes(o.group)) groups.push(o.group);
  });

  const renderOption = (option) => (
    <CommandItem
      key={option.id}
      value={option.label}
      onSelect={() => onOption(option.id)}
      dataHook={`${dataHook}-${option.id}`}
      // cmdk owns aria-selected — it means "highlighted", not "chosen" — so
      // the CHOICE goes on aria-checked, which ARIA allows on role="option".
      // Without it the drawn box is the only signal that a filter is on, and
      // a screen reader hears a plain list. (Pinning Command's value to ""
      // to stop it auto-scrolling makes this the only carrier.)
      aria-checked={isChecked(option.id)}
    >
      <FacetCheck select={select} checked={isChecked(option.id)} />
      {option.leading || null}
      <span className="flex-1">{option.label}</span>
      {option.count !== undefined ? (
        <span className="text-muted-foreground tabular-nums">{option.count}</span>
      ) : null}
    </CommandItem>
  );

  return (
    <>
      <CommandGroup>
        {/* forceMount so "All …" survives a search — it is the reset, not
            a result. */}
        {allLabel ? (
          <CommandItem
            forceMount
            value={allLabel}
            onSelect={onAll}
            dataHook={`${dataHook}-all`}
            aria-checked={isAllSelected}
          >
            <FacetCheck select={select} checked={isAllSelected} />
            <span className="flex-1">{allLabel}</span>
            {allCount !== undefined ? (
              <span className="text-muted-foreground tabular-nums">{allCount}</span>
            ) : null}
          </CommandItem>
        ) : null}
        {options.filter((o) => !o.group).map(renderOption)}
      </CommandGroup>
      {groups.map((group) => (
        <CommandGroup key={group} heading={group}>
          {options.filter((o) => o.group === group).map(renderOption)}
        </CommandGroup>
      ))}
    </>
  );
}

export function FacetPopover({
  label,
  open,
  onOpenChange,
  align = "start",
  panelWidth = "w-64",
  dataHook,
  search = false,
  searchPlaceholder = "Find…",
  children,
}) {
  const commandRef = React.useRef(null);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {/* text-sm font-normal: a filter trigger is a FIELD, not an action.
            Button's base is font-semibold and size="sm" is text-xs, which put
            these at 12px/600 beside a 14px/400 search input. The DS's own
            SelectTrigger is `text-sm font-normal` for exactly this reason —
            Button is simply the wrong default for a field-shaped control. */}
        <Button
          variant="outline"
          size="sm"
          dataHook={dataHook}
          // rounded-sm is what the DS's own SelectTrigger uses
          // (`h-9 px-3 py-2 border border-border rounded-sm`). A facet
          // trigger IS a select, so it should read as one — Button's
          // rounded-full pill is the wrong default for a field, and the
          // product's real selects are not fully rounded either.
          className="rounded-sm text-sm font-normal"
        >
          {label}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={4}
        className={`${panelWidth} p-0`}
        // Radix focuses the CONTENT WRAPPER on open, but cmdk's key handler
        // lives on the Command element below it — and keydowns bubble UP, so
        // arrows never reach it. Menus with a CommandInput only work by
        // accident, because focus happens to land inside Command. Without one
        // (the period menu) the arrows are dead. So: let Radix do its thing
        // when there IS an input to focus, otherwise put focus on Command
        // itself, which is what makes every menu arrow-navigable.
        onOpenAutoFocus={(event) => {
          const el = commandRef.current;
          if (!el || el.querySelector('[data-slot="command-input"]')) return;
          event.preventDefault();
          el.focus();
        }}
      >
        {/* Command's root is `rounded-lg border shadow-md bg-popover` — it
            assumes it is the surface. PopoverContent is ALSO `rounded-md
            border shadow-md`, so nesting them stacks two borders, two
            shadows and two mismatched radii. The Popover is the surface
            here, so Command sheds its chrome and inherits the radius. */}
        <Command
          ref={commandRef}
          tabIndex={-1}
          dataHook={`${dataHook}-command`}
          // CommandGroup ships `px-2 py-1` — 8px at the sides but 4px top
          // and bottom, so an item's highlight sits unevenly in the panel.
          // p-1 makes the gutter uniform on all four edges (which is what
          // the upstream shadcn Command does).
          className={FACET_COMMAND_CLASS}
        >
          {search ? (
            <CommandInput
              dataHook={`${dataHook}-search`}
              placeholder={searchPlaceholder}
            />
          ) : null}
          <CommandList>
            <CommandEmpty>No matches</CommandEmpty>
            {children}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function FacetedFilterMenu({
  label,
  open,
  onOpenChange,
  options,
  isAllSelected,
  isChecked,
  onAll,
  onOption,
  allLabel,
  allCount,
  search = false,
  searchPlaceholder = "Find…",
  panelWidth = "w-64",
  // "left" | "right": which edge of the trigger the panel hangs from.
  // Right-aligned for menus pinned to a card's right edge.
  align = "left",
  dataHook,
}) {
  // The list itself is FacetOptions, shared with the mobile sheet. No local
  // query state and no manual filtering: cmdk filters on each item's
  // `value`, so `value={option.label}` reproduces a substring match for free.
  return (
    <FacetPopover
      label={label}
      open={open}
      onOpenChange={onOpenChange}
      align={align === "right" ? "end" : "start"}
      panelWidth={panelWidth}
      dataHook={dataHook}
      search={search}
      searchPlaceholder={searchPlaceholder}
    >
      <FacetOptions
        options={options}
        isChecked={isChecked}
        isAllSelected={isAllSelected}
        onAll={onAll}
        onOption={onOption}
        allLabel={allLabel}
        allCount={allCount}
        dataHook={dataHook}
      />
    </FacetPopover>
  );
}

export function SingleSelectMenu({ label, open, onOpenChange, options, value, onSelect, dataHook, panelWidth = "w-44" }) {
  return (
    <FacetPopover
      label={label}
      open={open}
      onOpenChange={onOpenChange}
      panelWidth={panelWidth}
      dataHook={dataHook}
    >
      <CommandGroup>
        {options.map((option) => (
          <CommandItem
            key={option.id}
            value={option.label}
            selected={value === option.id}
            onSelect={() => onSelect(option.id)}
            dataHook={`${dataHook}-${option.id}`}
          >
            {option.label}
          </CommandItem>
        ))}
      </CommandGroup>
    </FacetPopover>
  );
}
