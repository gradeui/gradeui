"use client";

/**
 * Auto-buy toggle (Ali, 11 Aug 2026: "I'd extract the toggle group as a
 * shared component on its own"). What a USD deposit does the moment it
 * lands: convert to gold, convert to silver, or sit in the cash wallet.
 *
 * TWIN: mirrors the Studio shared component "AutoInvestToggle"
 * (id cmsp0yqoh78om0). Editing one does not touch the other, so a change
 * here needs the same change there. Keep the pair in sync.
 *
 * EXTRACTED because it now has two homes, the dashboard (beside the total)
 * and the Glint USD wallet card. It lived inside the dashboard screen, so
 * the second use would have been a paste, and this control is exactly the
 * kind that drifts: three option labels, a metal tint, a preference key.
 *
 * IT IS THE WHOLE CONTROL, not a wrapper: it reads and writes the
 * autoInvest preference itself, so both surfaces show the same value and
 * either can change it. That is deliberate. A demo where the dashboard
 * says Gold and the wallet says Off is worse than no toggle at all.
 *
 * CALLED "Auto-buy" (Glint's CEO, 12 Aug 2026, relayed by Ali: "last
 * request from CEO - can we change Auto-invest to Auto-buy"). It was
 * "Auto-invest" before that, which was Ali's own pick over the "Direct
 * Invest" I proposed, and "Direct Gold" before that. THREE NAMES DO NOT
 * MOVE WITH IT, and each for a reason:
 *   - the `autoInvest` preference key, because it is stored state and a
 *     rename would silently orphan every demo session already holding it;
 *   - this module's own name, AutoInvestToggle, because the twin guard,
 *     the mirror script's allow-list and every importing screen key off
 *     it, and a rename is a separate mechanical pass, not a copy change;
 *   - Persona's TX_METHOD_LABEL mapping "direct-gold" to "Direct Gold",
 *     which names the METHOD on an activity row (the thing that converted
 *     a deposit) rather than this setting, and keeps its product name.
 * If Auto-buy sticks, the identifiers can follow in one deliberate sweep.
 */

import * as React from "react";
import { Row, ToggleGroup, ToggleGroupItem } from "@gradeui/ui";
import { usePreference, type AutoInvest } from "@/lib/persona";
import { Wordmark } from "@/components/wordmark";

/* Values ARE the autoInvest preference values, so nothing maps between a
   label and a key. "none" leaves the cash where it landed. */
const OPTIONS: { value: AutoInvest; label: string }[] = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "none", label: "Off" },
];

export function AutoInvestToggle({
  label = "Auto-buy",
  className,
}: {
  /** Leading label. Pass null where the surrounding copy already says it. */
  label?: React.ReactNode;
  className?: string;
}) {
  const [mode, setMode] = usePreference("autoInvest");
  return (
    /* Label to the LEFT of the control, no explainer line above it: the
       segment names the metal, so a sentence saying the same thing was
       just noise. The metal tint stays on the LABEL and never touches the
       track, which has its own surface. */
    <Row gap="sm" align="center" className={className}>
      {label ? (
        <span className="text-sm font-medium text-foreground">{label}</span>
      ) : null}
      <ToggleGroup
        type="single"
        variant="segmented"
        size="sm"
        value={mode}
        onValueChange={(v) => v && setMode(v as AutoInvest)}
      >
        {OPTIONS.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            /* Equal width so the control does not jitter as the value
               changes: "Off" is half the width of "Silver", and a
               segmented control whose segments resize reads as broken. */
            className="min-w-16"
            /* The selected metal tints its LABEL with the flat brand
               colour rather than wearing the polished gradient face. The
               45deg sweep is built for a 100px button; compressed into a
               50px segment it loses its travel and reads as flat washed
               beige on the dark track. */
            style={
              mode === o.value && o.value !== "none"
                ? { color: Wordmark.metalSolid(o.value) }
                : undefined
            }
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Row>
  );
}

/* The option list and its label map, exposed so a SCREEN can name the
   current setting without keeping its own copy of the labels. The
   dashboard's USD card reads "Auto-buy to Gold" off labelFor, so the
   card and the control can never disagree about what "gold" is called. */
AutoInvestToggle.OPTIONS = OPTIONS;
AutoInvestToggle.labelFor = function labelFor(
  value: AutoInvest,
): string | undefined {
  return OPTIONS.find((o) => o.value === value)?.label;
};
