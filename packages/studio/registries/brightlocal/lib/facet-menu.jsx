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
// TWO THINGS THAT LOOK LIKE MISTAKES AND ARE NOT:
//   The checkbox is DRAWN, not a DS <Checkbox>. A focusable control nested
//   inside a listbox option is a keyboard trap, and CommandItem already
//   carries aria-selected. The box mirrors the DS Checkbox's own classes.
//   The row is a CommandItem, so hover, keyboard and cmdk's filtering all
//   come for free; an earlier hand-rolled version had to reimplement all
//   three and still got them wrong.
import * as React from "react";
import { Check } from "@brightlocal/icons";
import { CommandGroup, CommandItem, CommandSeparator } from "@brightlocal/ui-components/command";

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
  emptyGroupLabel,
  emptyOptions = [],
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
      {emptyGroupLabel && emptyOptions.length > 0 ? (
        <CommandGroup heading={emptyGroupLabel}>
          {emptyOptions.map((option) => (
            <CommandItem
              key={option.id}
              value={option.label}
              disabled
              dataHook={`${dataHook}-${option.id}`}
            >
              <FacetCheck select={select} checked={false} />
              {option.leading || null}
              <span className="flex-1">{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}
    </>
  );
}