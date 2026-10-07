"use client";

// WebDsV2 (7 Oct 2026): the Glint Web DS, for the business portal v2 on
// staging. Ali, 7 Oct: "I want it identical to Figma as much as possible",
// and "if you need to make any components from scratch, obviously do so".
//
// TWIN: the Studio shared component "WebDsV2" (cmuyfaxb7ab7c2). Editing
// one does not touch the other. Keep the pair in sync.
//
// WHY A V2 MODULE AND NOT @gradeui/ui: the shipped Grade components are
// close to the Web DS but not the same (Button lg is 18px text with 6px
// corners where the Web DS has 14/20 Chivo Medium and 8px; Input lg is 44
// tall on a 30% tint of --input where the Web DS has 48 on
// input-background), and packages/ui is main's and the published
// library's, which staging must not change. So the parts the Web Portal
// file uses are drawn here, from the Web DS component sets, value for
// value. Worth folding into the DS proper once staging is approved.
//
// THE COLOUR. <WebDsV2 /> renders one style element with the Web DS
// colour, read from Figma on 7 Oct 2026: Glint · Primitives as
// --wds-<ramp>-<step>, Glint · Web · Colour (Dark and Light) as
// --wds-<token>, and the Grade theme tokens the shipped components read
// (--background, --card, --primary, ...) re-pointed at the same values,
// so a DS Select menu or DropdownMenu lands on the Web DS too. Pure token
// values: nothing is mixed or derived. Mount it once per page; the
// templates (AppChromeV2, LoginTemplateV2, ErrorPageV2) do.
//
//   <WebDsV2 />                                   the colour
//   <WebDsV2.Button variant size>                 Web DS Button
//   <WebDsV2.Input invalid>                       Web DS Input (lg, filled)
//   WebDsV2.SELECT_TRIGGER                        classes for a DS SelectTrigger
//   <WebDsV2.OtpGroup><WebDsV2.OtpSlot invalid>   Web DS OTPInput + OTPSlot
//   WebDsV2.v("input-background")                 "var(--wds-input-background)"
import * as React from "react";

const PRIMITIVES: Record<string, string> = {
  "neutral/50": "#f8fafe",
  "neutral/100": "#f2f4fb",
  "neutral/200": "#e3e7f4",
  "neutral/300": "#cdd3e8",
  "neutral/400": "#919ec9",
  "neutral/500": "#606fa9",
  "neutral/600": "#414f8b",
  "neutral/700": "#2e3a76",
  "neutral/800": "#1c244e",
  "neutral/900": "#10162e",
  "neutral/950": "#050611",
  "primary/200": "#dde8fd",
  "primary/300": "#c1d4fb",
  "primary/400": "#749df4",
  "primary/500": "#4073ea",
  "primary/600": "#2d58bf",
  "primary/700": "#1e43a0",
  "primary/800": "#0f2b6f",
  "primary/900": "#061948",
  "primary/950": "#030a23",
  "gold/100": "#fef3de",
  "gold/200": "#eaebba",
  "gold/300": "#ecd19c",
  "gold/400": "#bc9b55",
  "gold/500": "#8e6d25",
  "gold/600": "#6c4f04",
  "gold/700": "#533c00",
  "gold/900": "#211600",
  "silver/50": "#fafafa",
  "silver/100": "#f4f4f4",
  "silver/200": "#e7e7e7",
  "silver/300": "#d4d4d4",
  "silver/400": "#9f9f9f",
  "silver/500": "#737373",
  "silver/600": "#545454",
  "silver/700": "#404040",
  "silver/900": "#181818",
  "red/200": "#ffdfde",
  "red/300": "#ffc2c1",
  "red/400": "#ff646c",
  "red/500": "#d31639",
  "red/600": "#a00026",
  "red/700": "#7c001b",
  "green/300": "#9ce9ae",
  "green/400": "#3bbb68",
  "green/500": "#0e8943",
  "green/600": "#0a6530",
  "green/700": "#0c4d25",
  "amber/300": "#ffc985",
  "amber/500": "#9c6502",
  "amber/600": "#714b14",
  "base/white": "#ffffff",
  "base/black": "#000000",
};

/** Semantic token: [Dark, Light] primitive. */
const SEMANTIC: Record<string, [string, string]> = {
  "body-background": ["neutral/950", "neutral/200"],
  "background": ["neutral/900", "neutral/50"],
  "foreground": ["base/white", "neutral/950"],
  "card": ["neutral/800", "base/white"],
  "card-foreground": ["base/white", "neutral/950"],
  "popover": ["neutral/900", "base/white"],
  "popover-foreground": ["base/white", "neutral/950"],
  "primary": ["primary/400", "primary/600"],
  "primary-foreground": ["neutral/950", "base/white"],
  "secondary": ["neutral/700", "neutral/100"],
  "secondary-foreground": ["base/white", "neutral/950"],
  "muted": ["neutral/800", "neutral/100"],
  "muted-foreground": ["neutral/400", "neutral/600"],
  "accent": ["neutral/700", "neutral/100"],
  "accent-foreground": ["base/white", "neutral/950"],
  "destructive": ["red/400", "red/500"],
  "destructive-foreground": ["neutral/950", "base/white"],
  "border": ["neutral/700", "neutral/200"],
  "input": ["neutral/500", "neutral/500"],
  "ring": ["primary/400", "primary/600"],
  "success": ["green/400", "green/600"],
  "success-foreground": ["neutral/950", "base/white"],
  "warning": ["amber/300", "amber/500"],
  "warning-foreground": ["neutral/950", "base/white"],
  "gold": ["gold/300", "gold/500"],
  "silver": ["silver/300", "silver/500"],
  "sidebar": ["neutral/950", "neutral/200"],
  "sidebar-foreground": ["neutral/400", "neutral/700"],
  "sidebar-primary": ["primary/400", "primary/600"],
  "sidebar-accent": ["neutral/800", "neutral/300"],
  "sidebar-accent-foreground": ["base/white", "neutral/950"],
  "sidebar-border": ["neutral/800", "neutral/300"],
  "primary-hover": ["primary/500", "primary/700"],
  "secondary-hover": ["neutral/600", "neutral/200"],
  "destructive-hover": ["red/300", "red/600"],
  "popover-ring": ["neutral/900", "neutral/200"],
  "input-background": ["neutral/900", "base/white"],
  "button-primary": ["primary/600", "primary/600"],
  "button-primary-hover": ["primary/700", "primary/700"],
  "button-primary-foreground": ["base/white", "base/white"],
  "action-disc": ["primary/500", "primary/600"],
  "page-deep": ["primary/950", "neutral/50"],
  "wordmark": ["gold/300", "primary/500"],
  "gold-edge-1": ["gold/200", "gold/400"],
  "gold-edge-2": ["gold/400", "gold/600"],
  "gold-edge-3": ["gold/100", "gold/300"],
  "gold-edge-4": ["gold/500", "gold/700"],
  "silver-edge-1": ["silver/200", "silver/400"],
  "silver-edge-2": ["silver/400", "silver/600"],
  "silver-edge-3": ["silver/100", "silver/300"],
  "silver-edge-4": ["silver/500", "silver/700"],
  "gold-accent": ["gold/400", "gold/600"],
  "silver-accent": ["silver/400", "silver/600"],
  "chart-1": ["primary/400", "primary/500"],
  "chart-2": ["gold/300", "gold/500"],
  "chart-3": ["green/400", "green/500"],
  "chart-4": ["red/400", "red/500"],
  "chart-5": ["neutral/400", "neutral/500"],
  "switch-track-off": ["neutral/500", "neutral/400"],
  "switch-thumb-off": ["neutral/400", "base/white"],
};

/** The Grade theme tokens the shipped DS components read ("L C H" for
 *  oklch()), re-pointed at the Web DS values: [Dark, Light]. */
const THEME: Record<string, [string, string]> = {
  "chart-1": ["0.7037 0.1359 264.09", "0.5859 0.1884 264.01"],
  "chart-2": ["0.8707 0.0750 83.93", "0.5541 0.0972 83.32"],
  "chart-3": ["0.7029 0.1636 151.11", "0.5528 0.1446 151.00"],
  "chart-4": ["0.7031 0.1888 20.35", "0.5547 0.2138 20.38"],
  "chart-5": ["0.7044 0.0648 271.57", "0.5545 0.0922 272.06"],
  "background": ["0.2088 0.0484 271.12", "0.9847 0.0057 264.53"],
  "foreground": ["1.0000 0.0000 0", "0.1280 0.0260 276.78"],
  "card": ["0.2783 0.0774 272.33", "1.0000 0.0000 0"],
  "card-foreground": ["1.0000 0.0000 0", "0.1280 0.0260 276.78"],
  "popover": ["0.2088 0.0484 271.12", "1.0000 0.0000 0"],
  "popover-foreground": ["1.0000 0.0000 0", "0.1280 0.0260 276.78"],
  "primary": ["0.7037 0.1359 264.09", "0.4913 0.1691 264.06"],
  "primary-foreground": ["0.1280 0.0260 276.78", "1.0000 0.0000 0"],
  "secondary": ["0.3719 0.1030 272.00", "0.9676 0.0096 273.36"],
  "secondary-foreground": ["1.0000 0.0000 0", "0.1280 0.0260 276.78"],
  "muted": ["0.2783 0.0774 272.33", "0.9676 0.0096 273.36"],
  "muted-foreground": ["0.7044 0.0648 271.57", "0.4457 0.0998 271.90"],
  "accent": ["0.3719 0.1030 272.00", "0.9676 0.0096 273.36"],
  "accent-foreground": ["1.0000 0.0000 0", "0.1280 0.0260 276.78"],
  "destructive": ["0.7031 0.1888 20.35", "0.5547 0.2138 20.38"],
  "destructive-foreground": ["0.1280 0.0260 276.78", "1.0000 0.0000 0"],
  "border": ["0.3719 0.1030 272.00", "0.9287 0.0181 272.30"],
  "input": ["0.5545 0.0922 272.06", "0.5545 0.0922 272.06"],
  "ring": ["0.7037 0.1359 264.09", "0.4913 0.1691 264.06"],
  "success": ["0.7029 0.1636 151.11", "0.4450 0.1155 150.93"],
  "warning": ["0.8692 0.1050 72.13", "0.5528 0.1178 72.02"],
};

const key = (n: string) => "--wds-" + n.replace("/", "-");

function buildCss() {
  const prim = Object.entries(PRIMITIVES).map(([n, h]) => `${key(n)}:${h};`).join("");
  const sem = (i: number) =>
    Object.entries(SEMANTIC).map(([n, pair]) => `--wds-${n}:var(${key(pair[i])});`).join("");
  const theme = (i: number) => Object.entries(THEME).map(([n, pair]) => `--${n}:${pair[i]};`).join("");
  return (
    `:root:root{${prim}${sem(1)}${theme(1)}}` +
    `:root:root.dark,:root:root .dark{${sem(0)}${theme(0)}}`
  );
}
const CSS = buildCss();

function WebDsV2Root() {
  return <style data-glint-web-ds="">{CSS}</style>;
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** The focus ring every Web DS control draws: ring, 2px, 4px outside the
 *  control (Figma's focus-ring frame is 8 wider and taller, r+4). */
const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--wds-ring)]";

/* Web DS Button (page Button, 7 Oct): Chivo Medium 14/20 on every size
   but xl (SemiBold 16/24), 8 corners (xl 10), 16 icons. */
export type WebDsButtonSize = "sm" | "default" | "lg" | "xl" | "icon" | "icon-lg";
export type WebDsButtonVariant = "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
const BUTTON_SIZE: Record<WebDsButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-[8px] px-3 text-sm leading-5 font-medium",
  default: "h-9 gap-2 rounded-[8px] px-4 text-sm leading-5 font-medium",
  lg: "h-10 gap-2 rounded-[8px] px-5 text-sm leading-5 font-medium",
  xl: "h-12 gap-2 rounded-[10px] px-6 text-base leading-6 font-semibold",
  icon: "size-9 rounded-[8px]",
  "icon-lg": "size-10 rounded-[8px]",
};
const BUTTON_VARIANT: Record<WebDsButtonVariant, string> = {
  default:
    "bg-[var(--wds-button-primary)] text-[color:var(--wds-button-primary-foreground)] hover:bg-[var(--wds-button-primary-hover)] disabled:bg-[var(--wds-secondary)] disabled:text-[color:var(--wds-muted-foreground)]",
  secondary:
    "bg-[var(--wds-secondary)] text-[color:var(--wds-secondary-foreground)] hover:bg-[var(--wds-secondary-hover)] disabled:opacity-50",
  outline:
    "border border-[color:var(--wds-border)] bg-transparent text-[color:var(--wds-foreground)] hover:bg-[var(--wds-accent)] hover:text-[color:var(--wds-accent-foreground)] disabled:opacity-50",
  ghost: "bg-transparent text-[color:var(--wds-primary)] hover:bg-[var(--wds-accent)] disabled:opacity-50",
  link: "bg-transparent text-[color:var(--wds-primary)] hover:underline disabled:opacity-50",
  destructive:
    "bg-[var(--wds-destructive)] text-[color:var(--wds-destructive-foreground)] hover:bg-[var(--wds-destructive-hover)] disabled:opacity-50",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: WebDsButtonVariant;
  size?: WebDsButtonSize;
};
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function WebDsV2Button(
  { variant = "default", size = "default", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap transition-colors disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0",
        FOCUS,
        BUTTON_SIZE[size],
        BUTTON_VARIANT[variant],
        className,
      )}
      {...props}
    />
  );
});

/* Web DS Input (Surface=filled, Size=lg): 48 tall, 10 corners, 16 sides,
   Chivo 16/24, input-background with a 1px input border; invalid swaps
   the border for destructive; disabled is 50%. */
const INPUT =
  "h-12 w-full min-w-0 rounded-[10px] border bg-[var(--wds-input-background)] px-4 text-base leading-6 text-[color:var(--wds-foreground)] placeholder:text-[color:var(--wds-muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
const Input = React.forwardRef<HTMLInputElement, InputProps>(function WebDsV2Input(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(
        INPUT,
        FOCUS,
        invalid ? "border-[color:var(--wds-destructive)]" : "border-[color:var(--wds-input)]",
        className,
      )}
      {...props}
    />
  );
});

/* Web DS Select (Size=lg) for a shipped DS SelectTrigger: 48 tall, 10
   corners, 16 sides, Chivo 16/24 in foreground, input-background. The
   dark: twins replace the trigger's own dark tint, so the closed control
   is the Web DS one in both modes. */
const SELECT_TRIGGER =
  "h-12 gap-3 rounded-[10px] border-[color:var(--wds-input)] bg-[var(--wds-input-background)] dark:bg-[var(--wds-input-background)] px-4 py-1.5 text-base leading-6 text-[color:var(--wds-foreground)]";

/* Web DS OTPInput: OTPSlots 48 x 56, 8 apart, 8 corners, the digit in
   Raleway Bold 24/32. Focus draws the ring 4px outside; invalid turns the
   slot's border destructive. The screen owns the digits and the keys. */
function OtpGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("flex gap-2", className)} {...props} />;
}
const OtpSlot = React.forwardRef<HTMLInputElement, InputProps>(function WebDsV2OtpSlot(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      inputMode="numeric"
      aria-invalid={invalid || undefined}
      className={cx(
        "h-14 w-12 rounded-[8px] border bg-[var(--wds-input-background)] p-0 text-center font-display text-2xl font-bold leading-8 text-[color:var(--wds-foreground)] caret-[var(--wds-foreground)]",
        FOCUS,
        invalid ? "border-[color:var(--wds-destructive)]" : "border-[color:var(--wds-input)]",
        className,
      )}
      {...props}
    />
  );
});

/** The module's namespace, as the Studio copy builds it with statics. */
export const WebDsV2 = Object.assign(WebDsV2Root, {
  /** "var(--wds-<token>)" for a Web DS token or primitive ("gold/300"). */
  v: (n: string) => `var(${key(n)})`,
  CSS,
  Button,
  Input,
  SELECT_TRIGGER,
  OtpGroup,
  OtpSlot,
});
