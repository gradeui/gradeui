// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// WebDsV2 (7 Oct 2026): the Glint Web DS, for the business portal v2 on
// staging. Ali, 7 Oct: "I want it identical to Figma as much as possible",
// and "if you need to make any components from scratch, obviously do so".
//
// TWIN: the Studio shared component "WebDsV2" (cmuyfaxb7ab7c2). Editing one does
// not touch the other. Keep the pair in sync.
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
//   <WebDsV2.MetalButton metal>                   Web DS Button gold / silver
//   <WebDsV2.Badge variant>                       Web DS Badge
//   <WebDsV2.Segmented value options onValueChange>  Web DS ToggleGroup, segmented sm
//   <WebDsV2.TxIcon type>                         Web DS TransactionIcon
//   <WebDsV2.ListItem leading title subtitle value subValue onClick>  Web DS ListItem
//   <WebDsV2.DescriptionItem label value copy emphasis>  Web DS DescriptionItem
//   <WebDsV2.Divider />                           the 1px border rule
//   <WebDsV2.Switch checked /> <WebDsV2.Radio checked />  Web DS Switch, Radio (visual)
//   <WebDsV2.OptionRow trailing selected disabled title description logo onSelect>  Web DS OptionRow
//   <WebDsV2.Alert tone title>body</WebDsV2.Alert>   Web DS Alert
//   <WebDsV2.Progress value />, <WebDsV2.Summary>, <WebDsV2.Field label helper error>
//   WebDsV2.v("input-background")                 "var(--wds-input-background)"
import * as React from "react";
import {
  Plus,
  Minus,
  CreditCard,
  ArrowDown,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Repeat,
  Clock,
  Check,
  CircleAlert,
  X,
  Copy,
  Info,
  ChevronRight,
} from "lucide-react";

const PRIMITIVES = {
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
const SEMANTIC = {
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
  /* ASSUMPTION (Ali, 7 Oct: the card hover was "a bit mega"): a pressable
     card's hover and pressed surfaces. The Web DS draws no card hover, and
     the neutral ramp has nothing between card (800) and accent (700) in
     Dark, where accent also swallowed the secondary Sell button. So the
     card sinks one step to the page (background: 900 Dark, 50 Light) and
     pressed goes one step further (950, 100). Surface only: no glow,
     scale or shadow. */
  "card-hover": ["neutral/900", "neutral/50"],
  "card-pressed": ["neutral/950", "neutral/100"],
};

/** The Grade theme tokens the shipped DS components read ("L C H" for
 *  oklch()), re-pointed at the Web DS values: [Dark, Light]. */
const THEME = {
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

/** Web · Colour tokens Figma sets as raw values rather than primitives
 *  (alpha included, as Figma holds them): [Dark, Light]. */
const RAW = {
  "metal-foreground": ["#141b3d", "#141b3d"],
  "metal-muted-foreground": ["rgb(20 27 61 / 0.66)", "rgb(20 27 61 / 0.66)"],
  "metal-border": ["rgb(255 255 255 / 0.45)", "rgb(255 255 255 / 0.45)"],
  "metal-chip": ["rgb(255 255 255 / 0.4)", "rgb(255 255 255 / 0.4)"],
  shadow: ["rgb(0 0 0 / 0.8)", "rgb(0 0 0 / 0.1)"],
  overlay: ["rgb(5 6 17 / 0.7)", "rgb(2 2 36 / 0.5)"],
};

const key = (n) => "--wds-" + n.replace("/", "-");

/* The Web DS display face, Raleway Bold, for titles and figures set in it
   (card titles, the sidebar labels, drawer titles, OTP digits). A class of
   its own because Tailwind's font-display utility resolved to the body
   face on staging (Ali, 7 Oct: "the card titles look like the incorrect
   font"). next/font's Raleway in the app, Google Fonts' in Studio. Lining
   tabular figures, as everywhere on web. */
const DISPLAY_CSS =
  ".wds-display{font-family:var(--font-raleway, Raleway), Raleway, system-ui, sans-serif;font-weight:700;" +
  "font-variant-numeric:lining-nums tabular-nums;font-variant-ligatures:none}";

function buildCss() {
  const prim = Object.entries(PRIMITIVES).map(([n, h]) => `${key(n)}:${h};`).join("");
  const sem = (i) =>
    Object.entries(SEMANTIC).map(([n, pair]) => `--wds-${n}:var(${key(pair[i])});`).join("");
  const raw = (i) => Object.entries(RAW).map(([n, pair]) => `--wds-${n}:${pair[i]};`).join("");
  const theme = (i) => Object.entries(THEME).map(([n, pair]) => `--${n}:${pair[i]};`).join("");
  return (
    `:root:root{${prim}${sem(1)}${raw(1)}${theme(1)}}` +
    `:root:root.dark,:root:root .dark{${sem(0)}${raw(0)}${theme(0)}}` +
    DISPLAY_CSS
  );
}
const CSS = buildCss();

function WebDsV2() {
  return <style data-glint-web-ds="">{CSS}</style>;
}

/** "var(--wds-<token>)" for a Web DS token or primitive ("gold/300"). */
WebDsV2.v = (n) => `var(${key(n)})`;
WebDsV2.CSS = CSS;

const cx = (...c) => c.filter(Boolean).join(" ");

/** The focus ring every Web DS control draws: ring, 2px, 4px outside the
 *  control (Figma's focus-ring frame is 8 wider and taller, r+4). */
const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--wds-ring)]";

/* Web DS Button (page Button, 7 Oct): Chivo Medium 14/20 on every size
   but xl (SemiBold 16/24), 8 corners (xl 10), 16 icons. The default
   variant's Disabled state (secondary, muted-foreground) also shows for
   aria-disabled, for a button that must look disabled but still answer a
   press (Auto-buy's Save without a vault). */
const BUTTON_SIZE = {
  sm: "h-8 gap-1.5 rounded-[8px] px-3 text-sm leading-5 font-medium",
  default: "h-9 gap-2 rounded-[8px] px-4 text-sm leading-5 font-medium",
  lg: "h-10 gap-2 rounded-[8px] px-5 text-sm leading-5 font-medium",
  xl: "h-12 gap-2 rounded-[10px] px-6 text-base leading-6 font-semibold",
  icon: "size-9 rounded-[8px]",
  "icon-lg": "size-10 rounded-[8px]",
};
const BUTTON_VARIANT = {
  default:
    "bg-[var(--wds-button-primary)] text-[color:var(--wds-button-primary-foreground)] hover:bg-[var(--wds-button-primary-hover)] disabled:bg-[var(--wds-secondary)] disabled:text-[color:var(--wds-muted-foreground)] aria-disabled:cursor-not-allowed aria-disabled:bg-[var(--wds-secondary)] aria-disabled:text-[color:var(--wds-muted-foreground)]",
  secondary:
    "bg-[var(--wds-secondary)] text-[color:var(--wds-secondary-foreground)] hover:bg-[var(--wds-secondary-hover)] disabled:opacity-50",
  outline:
    "border border-[color:var(--wds-border)] bg-transparent text-[color:var(--wds-foreground)] hover:bg-[var(--wds-accent)] hover:text-[color:var(--wds-accent-foreground)] disabled:opacity-50",
  ghost: "bg-transparent text-[color:var(--wds-primary)] hover:bg-[var(--wds-accent)] disabled:opacity-50",
  link: "bg-transparent text-[color:var(--wds-primary)] hover:underline disabled:opacity-50",
  destructive:
    "bg-[var(--wds-destructive)] text-[color:var(--wds-destructive-foreground)] hover:bg-[var(--wds-destructive-hover)] disabled:opacity-50",
};

WebDsV2.Button = React.forwardRef(function WebDsV2Button(
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

/* Web DS Input, Surface=filled. lg: 48 tall, 10 corners, 16 sides, Chivo
   16/24. default (the FormField's): 36 tall, 8 corners, 12 sides, Chivo
   14/20. input-background with a 1px input border; invalid swaps the
   border for destructive; disabled is 50%. A prefix ("$") or suffix
   ("USD", "g") sits inside the edge in muted-foreground, 8 from the text. */
const INPUT_SIZE = {
  lg: "h-12 rounded-[10px] px-4 text-base leading-6",
  default: "h-9 rounded-[8px] px-3 text-sm leading-5",
};

WebDsV2.Input = React.forwardRef(function WebDsV2Input(
  { invalid, size = "lg", prefix, suffix, className, ...props },
  ref,
) {
  const edge = invalid ? "border-[color:var(--wds-destructive)]" : "border-[color:var(--wds-input)]";
  const box = "w-full min-w-0 border bg-[var(--wds-input-background)] text-[color:var(--wds-foreground)]";
  if (suffix == null && prefix == null) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(
          box,
          INPUT_SIZE[size],
          "placeholder:text-[color:var(--wds-muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50",
          FOCUS,
          edge,
          className,
        )}
        {...props}
      />
    );
  }
  return (
    <div
      className={cx(
        "flex items-center gap-2 has-[input:disabled]:opacity-50 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[color:var(--wds-ring)]",
        box,
        INPUT_SIZE[size],
        edge,
        className,
      )}
    >
      {prefix != null ? <span className="shrink-0 text-[color:var(--wds-muted-foreground)]">{prefix}</span> : null}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-[color:var(--wds-muted-foreground)]"
        {...props}
      />
      {suffix != null ? <span className="shrink-0 text-[color:var(--wds-muted-foreground)]">{suffix}</span> : null}
    </div>
  );
});

/* Web DS Select (Size=lg) for a shipped DS SelectTrigger: 48 tall, 10
   corners, 16 sides, Chivo 16/24 in foreground, input-background. The
   dark: twins replace the trigger's own dark tint, so the closed control
   is the Web DS one in both modes. */
WebDsV2.SELECT_TRIGGER =
  "h-12 gap-3 rounded-[10px] border-[color:var(--wds-input)] bg-[var(--wds-input-background)] dark:bg-[var(--wds-input-background)] px-4 py-1.5 text-base leading-6 text-[color:var(--wds-foreground)]";

/* Web DS OTPInput: OTPSlots 48 x 56, 8 apart, 8 corners, the digit in
   Raleway Bold 24/32. Focus draws the ring 4px outside; invalid turns the
   slot's border destructive. The screen owns the digits and the keys. */
WebDsV2.OtpGroup = function WebDsV2OtpGroup({ className, ...props }) {
  return <div className={cx("flex gap-2", className)} {...props} />;
};
WebDsV2.OtpSlot = React.forwardRef(function WebDsV2OtpSlot({ invalid, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      inputMode="numeric"
      aria-invalid={invalid || undefined}
      className={cx(
        "h-14 w-12 rounded-[8px] border bg-[var(--wds-input-background)] p-0 text-center wds-display text-2xl font-bold leading-8 text-[color:var(--wds-foreground)] caret-[var(--wds-foreground)]",
        FOCUS,
        invalid ? "border-[color:var(--wds-destructive)]" : "border-[color:var(--wds-input)]",
        className,
      )}
      {...props}
    />
  );
});

/* Web DS Button, Variant=gold / silver (lg): a 999 pill (shape="square"
   gives the 8 corners of every other Web DS Button, as the wallet cards
   use it since 7 Oct, so Buy and Sell match; 10 at xl, the drawer size,
   48 tall with SemiBold 16/24), 40 tall, 20
   sides, Chivo Medium 14/20, a 1px gold/300 (silver/300) edge and the
   face gradient: gold/200 to 60%, gold/400 at 85%, gold/600 at 100%
   (silver/50, silver/400, silver/600). Hover moves the stops (gold/200 to
   70%, gold/300 at 90%, gold/500) and sweeps the sheen, a 60 wide band of
   gold/200, from off the left edge (x -60) to x 89, where the Hover
   variant draws it. The label is
   metal-foreground (#141b3d) on gold and silver/900 on silver, as the Web
   Portal slides set them. */
const METAL_BTN = {
  gold: {
    rest: "linear-gradient(115deg, var(--wds-gold-200) 0%, var(--wds-gold-200) 60%, var(--wds-gold-400) 85%, var(--wds-gold-600) 100%)",
    hover: "linear-gradient(115deg, var(--wds-gold-200) 0%, var(--wds-gold-200) 70%, var(--wds-gold-300) 90%, var(--wds-gold-500) 100%)",
    edge: "var(--wds-gold-300)",
    sheen: "var(--wds-gold-200)",
    ink: "var(--wds-metal-foreground)",
  },
  silver: {
    rest: "linear-gradient(115deg, var(--wds-silver-50) 0%, var(--wds-silver-50) 60%, var(--wds-silver-400) 85%, var(--wds-silver-600) 100%)",
    hover: "linear-gradient(115deg, var(--wds-silver-50) 0%, var(--wds-silver-50) 70%, var(--wds-silver-300) 90%, var(--wds-silver-500) 100%)",
    edge: "var(--wds-silver-300)",
    sheen: "var(--wds-silver-50)",
    ink: "var(--wds-silver-900)",
  },
};

WebDsV2.MetalButton = React.forwardRef(function WebDsV2MetalButton(
  { metal = "gold", shape = "pill", size = "lg", className, children, type = "button", style, ...props },
  ref,
) {
  const m = METAL_BTN[metal] ?? METAL_BTN.gold;
  const [hover, setHover] = React.useState(false);
  return (
    <button
      ref={ref}
      type={type}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className={cx(
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap border disabled:cursor-not-allowed disabled:opacity-50",
        size === "xl" ? "h-12 px-6 text-base font-semibold leading-6" : "h-10 px-5 text-sm font-medium leading-5",
        shape !== "square" ? "rounded-full" : size === "xl" ? "rounded-[10px]" : "rounded-[8px]",
        FOCUS,
        className,
      )}
      style={{ background: hover ? m.hover : m.rest, borderColor: m.edge, color: m.ink, ...style }}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[60px] transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ background: m.sheen, transform: hover ? "translateX(89px)" : "translateX(-60px)" }}
      />
      <span className="relative">{children}</span>
    </button>
  );
});

/* Web DS Badge: 20 tall, 8 sides, a full pill, Chivo Medium 12/16. */
const BADGE = {
  default: "bg-[var(--wds-primary)] text-[color:var(--wds-primary-foreground)]",
  secondary: "bg-[var(--wds-secondary)] text-[color:var(--wds-secondary-foreground)]",
  destructive: "bg-[var(--wds-destructive)] text-[color:var(--wds-destructive-foreground)]",
  outline: "border border-[color:var(--wds-border)] text-[color:var(--wds-foreground)]",
  success: "bg-[var(--wds-success)] text-[color:var(--wds-success-foreground)]",
  warning: "bg-[var(--wds-warning)] text-[color:var(--wds-warning-foreground)]",
};
WebDsV2.Badge = function WebDsV2Badge({ variant = "default", className, ...props }) {
  return (
    <span
      className={cx(
        "inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-medium leading-4",
        BADGE[variant],
        className,
      )}
      {...props}
    />
  );
};

/* Web DS ToggleGroup, Variant=segmented, Size=sm: a 36 pill on secondary
   with a 1px border and 4 inside it; items 28 tall, 16 sides, Chivo
   Medium 14/20; the one that is on sits on card in foreground, the rest
   are muted-foreground. stretch fills the width, items sharing it equally
   with 8 sides so two fit a 160 column (Settings · Display, Withdraw's
   Account type). */
WebDsV2.Segmented = function WebDsV2Segmented({
  value,
  onValueChange,
  options = [],
  stretch = false,
  className,
  ...props
}) {
  return (
    <div
      role="radiogroup"
      className={cx(
        "inline-flex h-9 items-center rounded-full border border-[color:var(--wds-border)] bg-[var(--wds-secondary)] p-[3px]",
        stretch ? "w-full" : "w-fit",
        className,
      )}
      {...props}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onValueChange?.(o.value)}
            className={cx(
              "h-7 cursor-pointer rounded-full text-sm font-medium leading-5 transition-colors",
              stretch ? "min-w-0 flex-1 px-2" : "px-4",
              FOCUS,
              on
                ? "bg-[var(--wds-card)] text-[color:var(--wds-foreground)]"
                : "text-[color:var(--wds-muted-foreground)] hover:text-[color:var(--wds-foreground)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
};

/* Web DS TransactionIcon: a 36 circle on accent with a 16 glyph at 1.5
   in foreground; Complete is on success and Failed on destructive (glyph
   neutral/950), Skipped draws its glyph in warning. Keys are the Web DS
   Type values, kebab-cased. */
const TX_ICON = {
  "exchange-to-metal": { Icon: Plus },
  "exchange-to-money": { Icon: Minus },
  "card-spend": { Icon: CreditCard },
  "top-up": { Icon: ArrowDown },
  "transfer-in": { Icon: ArrowDownLeft },
  "transfer-out": { Icon: ArrowUpRight },
  withdraw: { Icon: Landmark },
  "auto-buy": { Icon: Repeat },
  pending: { Icon: Clock },
  complete: { Icon: Check, bg: "bg-[var(--wds-success)]", ink: "text-[color:var(--wds-neutral-950)]" },
  skipped: { Icon: CircleAlert, ink: "text-[color:var(--wds-warning)]" },
  failed: { Icon: X, bg: "bg-[var(--wds-destructive)]", ink: "text-[color:var(--wds-neutral-950)]" },
};
WebDsV2.TxIcon = function WebDsV2TxIcon({ type = "exchange-to-metal", className }) {
  const t = TX_ICON[type] ?? TX_ICON["exchange-to-metal"];
  const Icon = t.Icon;
  return (
    <span
      aria-hidden
      className={cx(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        t.bg ?? "bg-[var(--wds-accent)]",
        t.ink ?? "text-[color:var(--wds-foreground)]",
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={1.5} />
    </span>
  );
};

/* Web DS ListItem, Variant=default: 12 top, right and bottom, 16 left, 12
   between; the title Chivo SemiBold 16/24 in foreground over a Chivo
   14/20 muted-foreground line; the values on the right, Chivo Medium
   16/24 over 14/20 muted-foreground. ASSUMPTION: the set draws no hover,
   so a pressable row takes accent behind it on hover, with 12 corners,
   the radius the Web DS uses for a focus ring around 8 corners. */
WebDsV2.ListItem = function WebDsV2ListItem({
  leading,
  title,
  subtitle,
  value,
  subValue,
  onClick,
  className,
  ...props
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-3 py-3 pl-4 pr-3 text-left",
        onClick && cx("cursor-pointer rounded-[12px] transition-colors hover:bg-[var(--wds-accent)]", FOCUS),
        className,
      )}
      {...props}
    >
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base font-semibold leading-6 text-[color:var(--wds-foreground)]">
          {title}
        </span>
        {subtitle ? (
          <span className="truncate text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
            {subtitle}
          </span>
        ) : null}
      </span>
      {value != null ? (
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <span className="whitespace-nowrap text-base font-medium leading-6 text-[color:var(--wds-foreground)]">
            {value}
          </span>
          {subValue ? (
            <span className="whitespace-nowrap text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
              {subValue}
            </span>
          ) : null}
        </span>
      ) : null}
    </Tag>
  );
};

/* Web DS DescriptionItem. inline: 8 above and below, label Chivo 16/24
   muted-foreground on the left, value Chivo Medium 16/24 foreground on
   the right; Emphasis=total sets both SemiBold, the value 18/28. stacked:
   12 above and below, label 14/20 over value 16/24. copy adds the 16
   copy icon in primary, which turns into a success check once pressed. */
WebDsV2.DescriptionItem = function WebDsV2DescriptionItem({
  label,
  value,
  copy,
  emphasis = "default",
  layout = "inline",
  className,
}) {
  const [copied, setCopied] = React.useState(false);
  const doCopy = () => {
    try {
      navigator.clipboard?.writeText(typeof copy === "string" ? copy : String(value));
    } catch {
      /* a sandbox without clipboard access: the tick still shows */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const total = emphasis === "total";
  const button = copy ? (
    <button
      type="button"
      aria-label={copied ? "Copied" : `Copy ${label}`}
      onClick={doCopy}
      className={cx(
        "flex shrink-0 cursor-pointer items-center justify-center rounded-[8px]",
        layout === "stacked" ? "size-9 hover:bg-[var(--wds-accent)]" : "size-4",
        copied ? "text-[color:var(--wds-success)]" : "text-[color:var(--wds-primary)]",
        FOCUS,
      )}
    >
      {copied ? <Check className="size-4" strokeWidth={1.5} /> : <Copy className="size-4" strokeWidth={1.5} />}
    </button>
  ) : null;
  if (layout === "stacked") {
    return (
      <div className={cx("flex items-center gap-4 py-3", className)}>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{label}</span>
          <span className="text-base font-medium leading-6 text-[color:var(--wds-foreground)]">{value}</span>
        </div>
        {button}
      </div>
    );
  }
  return (
    <div className={cx("flex items-center gap-4 py-2", className)}>
      <span
        className={cx(
          "min-w-0 flex-1 text-base leading-6",
          total ? "font-semibold text-[color:var(--wds-foreground)]" : "text-[color:var(--wds-muted-foreground)]",
        )}
      >
        {label}
      </span>
      <span
        className={cx(
          "text-right text-[color:var(--wds-foreground)]",
          total ? "text-lg font-semibold leading-7" : "text-base font-medium leading-6",
        )}
      >
        {value}
      </span>
      {button}
    </div>
  );
};

/** The 1px rule the Web DS cards draw between their parts (border). */
WebDsV2.Divider = function WebDsV2Divider({ className }) {
  return <div role="separator" className={cx("h-px w-full shrink-0 bg-[var(--wds-border)]", className)} />;
};

/* Web DS Switch (visual): 36 x 20, a full pill; on is primary with a 16
   primary-foreground thumb, off is switch-track-off with a
   switch-thumb-off thumb. The row around it owns the role and the keys. */
WebDsV2.Switch = function WebDsV2Switch({ checked = false, className }) {
  return (
    <span
      aria-hidden
      className={cx(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[var(--wds-primary)]" : "bg-[var(--wds-switch-track-off)]",
        className,
      )}
    >
      <span
        className={cx(
          "absolute size-4 rounded-full transition-transform",
          checked ? "translate-x-[18px] bg-[var(--wds-primary-foreground)]" : "translate-x-0.5 bg-[var(--wds-switch-thumb-off)]",
        )}
      />
    </span>
  );
};

/* Web DS Radio (visual): 20, a 2px ring, primary with a 10 primary dot
   when on, muted-foreground when off. */
WebDsV2.Radio = function WebDsV2Radio({ checked = false, className }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
        checked ? "border-[color:var(--wds-primary)]" : "border-[color:var(--wds-muted-foreground)]",
        className,
      )}
    >
      {checked ? <span className="size-2.5 rounded-full bg-[var(--wds-primary)]" /> : null}
    </span>
  );
};

/* Web DS OptionRow: 12 all round and between, 14 corners, card; selected
   is a 2px primary edge, otherwise a 1px border (the padding gives way by
   the difference so nothing moves); disabled is 50%. The title is Chivo
   SemiBold 16/24 over a 14/20 muted-foreground description; a logo sits in
   a 32 wide tile; the trailing control sits in 12 of padding (a radio in
   44, a switch in 60, a 16 chevron-right in 40 for a row that opens
   something). The whole row is the control: role radio or switch, by its
   trailing; a chevron row is a plain button. A logo tile is 32 wide in a
   drawer and 48 square (tile="lg") on Settings. badge puts a Web DS Badge
   8 after the title ("Latest" on the Buy and Sell vault rows). */
WebDsV2.OptionRow = function WebDsV2OptionRow({
  trailing = "radio",
  selected = false,
  disabled = false,
  title,
  description,
  logo,
  tile = "sm",
  badge,
  onSelect,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      role={trailing === "switch" ? "switch" : trailing === "chevron" ? undefined : "radio"}
      aria-checked={trailing === "chevron" ? undefined : selected}
      disabled={disabled}
      onClick={onSelect}
      className={cx(
        "flex w-full cursor-pointer items-center gap-3 rounded-[14px] bg-[var(--wds-card)] text-left disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-2 border-[color:var(--wds-primary)] p-[10px]" : "border border-[color:var(--wds-border)] p-[11px]",
        FOCUS,
        className,
      )}
      {...props}
    >
      {logo ? (
        <span className={cx("flex shrink-0 items-center justify-center", tile === "lg" ? "size-12 p-3" : "w-8 px-1 py-3")}>
          {logo}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold leading-6 text-[color:var(--wds-foreground)]">{title}</span>
          {badge ? <WebDsV2.Badge>{badge}</WebDsV2.Badge> : null}
        </span>
        {description ? (
          <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{description}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center p-3">
        {trailing === "switch" ? (
          <WebDsV2.Switch checked={selected} />
        ) : trailing === "chevron" ? (
          <ChevronRight className="size-4 text-[color:var(--wds-foreground)]" />
        ) : (
          <WebDsV2.Radio checked={selected} />
        )}
      </span>
    </button>
  );
};

/* Web DS Alert: 12 above and below, 16 sides, 12 between, 14 corners,
   card with a 1px edge in the tone (border for info); the 16 info icon in
   a 24 tall slot, in the tone (muted-foreground for info); the title
   Chivo SemiBold 16/24 over the body in 14/20 muted-foreground. */
const ALERT_TONE = {
  info: { edge: "border-[color:var(--wds-border)]", ink: "text-[color:var(--wds-muted-foreground)]" },
  success: { edge: "border-[color:var(--wds-success)]", ink: "text-[color:var(--wds-success)]" },
  warning: { edge: "border-[color:var(--wds-warning)]", ink: "text-[color:var(--wds-warning)]" },
  destructive: { edge: "border-[color:var(--wds-destructive)]", ink: "text-[color:var(--wds-destructive)]" },
};
WebDsV2.Alert = function WebDsV2Alert({ tone = "info", title, children, className }) {
  const t = ALERT_TONE[tone] ?? ALERT_TONE.info;
  return (
    <div
      role={tone === "info" ? "status" : "alert"}
      className={cx("flex gap-3 rounded-[14px] border bg-[var(--wds-card)] px-4 py-3", t.edge, className)}
    >
      <span className={cx("flex h-6 shrink-0 items-center", t.ink)}>
        <Info className="size-4" strokeWidth={1.5} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        {title ? <span className="text-base font-semibold leading-6 text-[color:var(--wds-foreground)]">{title}</span> : null}
        {children ? <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{children}</span> : null}
      </span>
    </div>
  );
};

/* Web DS Progress: a 4 tall full pill on accent, the value in primary. */
WebDsV2.Progress = function WebDsV2Progress({ value = 0, className, ...props }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cx("h-1 w-full overflow-hidden rounded-full bg-[var(--wds-accent)]", className)}
      {...props}
    >
      <div className="h-full rounded-full bg-[var(--wds-primary)]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
};

/* The muted summary panel the drawers list an order in: 12 corners, 8
   above and below, 16 sides, Web DS DescriptionItems inside. */
WebDsV2.Summary = function WebDsV2Summary({ className, children }) {
  return <div className={cx("flex flex-col rounded-[12px] bg-[var(--wds-muted)] px-4 py-2", className)}>{children}</div>;
};

/* Web DS FormField: the label (Chivo Medium 14/20), the control, a helper
   (12/16 muted-foreground) and an error (12/16 destructive), 4 apart. A
   control may sit beside the label (the Sell amount's USD / g). */
WebDsV2.Field = function WebDsV2Field({ label, htmlFor, aside, helper, error, gap = 1, className, children }) {
  return (
    <div className={cx("flex flex-col", gap === 2 ? "gap-2" : "gap-1", className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {helper ? <span className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">{helper}</span> : null}
      {error ? <span className="text-xs leading-4 text-[color:var(--wds-destructive)]">{error}</span> : null}
    </div>
  );
};

/* Exported untyped: the body is plain JSX (see the header). */
const __WebDsV2: any = WebDsV2;
export { __WebDsV2 as WebDsV2 };
