import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye as EyeIcon, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Input variants — `size` lets dense surfaces (the Studio inspector,
 * settings sheets) reach for a compact `sm` input without hand-rolling
 * className overrides. Default keeps the existing h-9 padding /
 * text-base-md:text-sm so this is a no-op for every existing call
 * site.
 *
 * `pl-3 pr-3` is preserved verbatim from the original so the search-
 * input pattern (leading icon overrides `pl-*`) still wins via
 * twMerge. See packages/ui/components/ui/input.tsx for the full
 * rationale.
 */
const inputVariants = cva(
  "flex w-full rounded-md bg-transparent transition-colors file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        // Prominent single-value fields — an amount in a dialog, a
        // first field on a marketing form. Stays text-base at every
        // width: it is the thing being read, and 16px keeps iOS from
        // zooming on focus.
        lg: "h-11 pl-4 pr-4 py-2 text-base file:text-sm",
        default: "h-9 pl-3 pr-3 py-1 text-base file:text-sm md:text-sm",
        sm: "h-8 pl-2 pr-2 py-1 text-sm file:text-xs",
        // Figma-density — tool panels (the Studio inspector). shadow-none
        // so they sit flush with SelectTrigger (no drop shadow) — every
        // field in a dense panel should read identically.
        xs: "h-7 pl-2 pr-2 py-0 text-xs file:text-xs shadow-none",
        // 2xs: h-6 (24px) — densest tool-panel input. rounded-lg + the
        // tighter leading edge mirror SelectTrigger's 2xs so mixed
        // field rows read identically.
        "2xs": "h-6 rounded-lg pl-1.5 pr-2 py-0 text-2xs file:text-2xs shadow-none",
      },
      // `ghost` is the borderless inline-edit field — a value that reads as
      // plain text until focused (inspector readouts, the path bar). No
      // border, no shadow; the focus ring still confirms edit mode.
      variant: {
        default: "border border-input dark:bg-input/30",
        ghost: "border border-transparent bg-transparent shadow-none",
      },
    },
    defaultVariants: { size: "default", variant: "default" },
  }
);

type InputSize = NonNullable<VariantProps<typeof inputVariants>["size"]>;

type InputVariant = NonNullable<VariantProps<typeof inputVariants>["variant"]>;

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: InputSize;
  variant?: InputVariant;
  /** Adornment rendered inside the field on the leading edge — an icon,
   *  a unit, a prefix. Non-interactive by default (clicks pass through
   *  to focus the input); pass an element with its own pointer-events
   *  if you need it clickable. */
  startSlot?: React.ReactNode;
  /** Adornment rendered inside the field on the trailing edge — a unit
   *  ("px"), a clear button, a stepper. Same pointer rules as
   *  `startSlot`. */
  endSlot?: React.ReactNode;
  /**
   * Add the show/hide eye toggle to a `type="password"` field.
   *
   * Lives here rather than as a separate PasswordInput, or as an eye
   * button hand-composed at each call site, because every password field
   * in every product wants the same affordance and the same a11y
   * labelling. One prop means a form gets it by typing one word.
   *
   * Ignored unless `type="password"`: on any other type there is nothing
   * to reveal, and silently swapping a field's type would be worse than
   * doing nothing. Revealing swaps the rendered type to "text", which is
   * what every browser password manager expects.
   *
   * Composes with `endSlot`: the consumer's adornment renders first and
   * the toggle sits outermost, so a field can carry both a unit and a
   * reveal without the two fighting for the same corner.
   */
  revealable?: boolean;
};

// Reserved space + adornment inset per size, so the text never collides
// with a slot. Consumers can still override via `className` (twMerge
// lets a later pl-*/pr-* win) for extra-tight cases.
const SLOT_PADDING: Record<
  InputSize,
  { startPad: string; endPad: string; startInset: string; endInset: string }
> = {
  lg: { startPad: "pl-11", endPad: "pr-11", startInset: "pl-4", endInset: "pr-4" },
  default: { startPad: "pl-9", endPad: "pr-9", startInset: "pl-3", endInset: "pr-3" },
  sm: { startPad: "pl-7", endPad: "pr-6", startInset: "pl-2", endInset: "pr-2" },
  xs: { startPad: "pl-6", endPad: "pr-5", startInset: "pl-2", endInset: "pr-2" },
  "2xs": { startPad: "pl-6", endPad: "pr-5", startInset: "pl-1.5", endInset: "pr-2" },
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size = "default",
      variant = "default",
      startSlot,
      endSlot: endSlotProp,
      revealable = false,
      ...props
    },
    ref,
  ) => {
    const [revealed, setRevealed] = React.useState(false);
    /* Only a password field has anything to reveal. Gating on the type
       rather than on the prop alone means a stray `revealable` on a text
       field renders nothing instead of a toggle that does nothing. */
    const canReveal = revealable && type === "password";
    const Eye = revealed ? EyeOff : EyeIcon;
    const endSlot = canReveal ? (
      <>
        {endSlotProp}
        {/* pointer-events-auto because the slot wrapper is
            pointer-events-none by design (clicks pass through to focus
            the field). type="button" so it cannot submit the form it
            sits in, which is the classic bug with an in-field toggle. */}
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="pointer-events-auto -mr-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={revealed ? "Hide password" : "Show password"}
          aria-pressed={revealed}
        >
          <Eye aria-hidden="true" />
        </button>
      </>
    ) : (
      endSlotProp
    );
    /* Revealing swaps the RENDERED type, which is what password managers
       and screen readers key off; the caller's `type` prop is untouched,
       so canReveal stays true while revealed. */
    const renderedType = canReveal && revealed ? "text" : type;
    if (!startSlot && !endSlot) {
      return (
        <input
          type={renderedType}
          className={cn(inputVariants({ size, variant }), className)}
          ref={ref}
          {...props}
        />
      );
    }
    const pad = SLOT_PADDING[size];
    return (
      <div className="relative flex w-full items-center">
        {startSlot ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 flex items-center text-muted-foreground [&_svg]:size-3.5",
              pad.startInset,
            )}
          >
            {startSlot}
          </span>
        ) : null}
        <input
          type={renderedType}
          ref={ref}
          className={cn(
            inputVariants({ size, variant }),
            startSlot && pad.startPad,
            endSlot && pad.endPad,
            className,
          )}
          {...props}
        />
        {endSlot ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 flex items-center text-muted-foreground [&_svg]:size-3.5",
              pad.endInset,
            )}
          >
            {endSlot}
          </span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
