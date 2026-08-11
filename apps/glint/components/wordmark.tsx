/**
 * Glint wordmark, ported from the Studio shared component "Wordmark":
 * the six paths lifted from glintpay.com/images/identity.svg (#logo,
 * viewBox 0 0 103 24).
 *
 * METALS ARE PINNED, NOT THEMED (10 Aug 2026): the mark originally
 * read --ramp-accent-*, but the theme's accent slot was re-hued to the
 * action blue (gold accent hovers were illegible), which turned the
 * logo blue. Brand metals are constants, so the gold ladder (the
 * original accent ramp: hue 87 at 0.78 chroma) and the silver ladder
 * (the indigo neutral ladder: hue 272) live here as literal OKLCH
 * stops, exposed as Wordmark.METALS for other metal surfaces (wallet
 * chips, tier badges). Keep in sync with the Studio Wordmark.
 *
 * cut picks the gradient band for the surface it sits on:
 *   "champagne": gold 100 -> 600 (site-faithful, for dark surfaces)
 *   "metal":     gold 300 -> 700 (deeper camel-bronze, holds on light)
 */

export const METALS = {
  gold: {
    50: "0.9850 0.0117 87",
    100: "0.9550 0.0312 87",
    200: "0.8950 0.0585 87",
    300: "0.8200 0.0858 87",
    400: "0.7200 0.1092 87",
    500: "0.6100 0.1326 87",
    600: "0.5100 0.1326 87",
    700: "0.4150 0.1170 87",
    800: "0.3250 0.0936 87",
    900: "0.2450 0.0624 87",
    950: "0.1700 0.0312 87",
  },
  silver: {
    50: "0.9850 0.0067 272",
    100: "0.9550 0.0180 272",
    200: "0.8950 0.0338 272",
    300: "0.8200 0.0495 272",
    400: "0.7200 0.0630 272",
    500: "0.6100 0.0765 272",
    600: "0.5100 0.0765 272",
    700: "0.4150 0.0675 272",
    800: "0.3250 0.0540 272",
    900: "0.2450 0.0360 272",
    950: "0.1700 0.0180 272",
  },
} as const;

type MetalStep = keyof typeof METALS.gold;

/**
 * The polished-metal button face, matching the iOS app's Buy Gold /
 * Confirm buttons (Ali, 11 Aug 2026). Glint's designers specified "a
 * 45 degree angle" without shipping the values, so this reconstructs
 * it from the pinned ladders: a pale champagne corner sweeping to rich
 * metal, four stops so the falloff reads like a polished surface
 * rather than a flat ramp, with near-black label — the app puts dark
 * type on the metal, not pale type on a dark fill.
 *
 * Single source of truth: every metal button (dashboard pills, wallet
 * actions, the trade Confirm) styles itself from here, so the brand
 * surface is changed in one place. Keep in sync with the Studio
 * Wordmark shared component.
 */
export function metalSurface(metal: "gold" | "silver"): React.CSSProperties {
  const m = METALS[metal];
  return {
    background: `linear-gradient(45deg, oklch(${m[100]}) 0%, oklch(${m[200]}) 30%, oklch(${m[300]}) 55%, oklch(${m[500]}) 100%)`,
    color: `oklch(${m[950]})`,
    borderColor: `oklch(${m[200]})`,
  };
}

/**
 * The single flat metal colour, for everything that is not a button
 * face: chart strokes, dots, icons, a metal-tinted number. Step 400
 * sits where each metal is most legible on the navy surfaces and
 * lands on Glint's own flat metals — gold 400 next to --c-camel
 * #d1b375, silver 400 next to --c-ceil #9aa2cb.
 */
export function metalSolid(metal: "gold" | "silver"): string {
  return `oklch(${METALS[metal][400]})`;
}

export const METAL_SOLID = {
  gold: metalSolid("gold"),
  silver: metalSolid("silver"),
} as const;

/**
 * The hover glint: a bright diagonal band that sweeps across the metal
 * face, parked off the leading edge at rest. Returned as a background
 * LAYER stacked over metalSurface's gradient, so the resting look is
 * untouched and the sweep is a background-position transition — no
 * pseudo-elements, so it works identically in Studio (where screens
 * cannot add stylesheet rules) and in the app. MetalButton owns the
 * hover state; call sites just use MetalButton.
 */
export function metalGlint(
  metal: "gold" | "silver",
  hovered: boolean,
): React.CSSProperties {
  const m = METALS[metal];
  const base = metalSurface(metal);
  const sheen = `linear-gradient(115deg, transparent 38%, oklch(${m[50]} / 0.75) 50%, transparent 62%)`;
  return {
    ...base,
    background: `${sheen}, ${base.background}`,
    backgroundSize: "260% 100%, 100% 100%",
    backgroundPosition: hovered ? "100% 0, 0 0" : "-60% 0, 0 0",
    backgroundRepeat: "no-repeat, no-repeat",
    /* Sweep on the way in, snap back on the way out — a band sliding
       backwards across the face reads as a glitch, not a glint. */
    transition: hovered ? "background-position 700ms ease-out" : "none",
  };
}

// The G glyph: the circular stroke + inner bar (paths 1 and 6 of the
// full lockup, both within the 0..24 box).
const G_RING = "M23.5886 12.9579H12.3089C12.2286 12.9579 12.1515 12.9898 12.0947 13.0466C12.0379 13.1034 12.006 13.1804 12.006 13.2607V15.453C12.006 15.5335 12.0379 15.6107 12.0946 15.6677C12.1514 15.7248 12.2284 15.7571 12.3089 15.7576H19.8551C19.11 17.3093 17.9209 18.6049 16.4385 19.4802C14.9561 20.3556 13.2472 20.7711 11.5284 20.6743C9.80955 20.5776 8.15814 19.9727 6.78345 18.9365C5.40877 17.9003 4.37269 16.4794 3.80652 14.8538C3.24036 13.2282 3.1696 11.4712 3.60321 9.80538C4.03682 8.13955 4.95529 6.63993 6.2422 5.49657C7.52911 4.35322 9.12654 3.61759 10.832 3.38293C12.5375 3.14827 14.2743 3.42513 15.8223 4.17844C15.8928 4.21358 15.9743 4.22001 16.0495 4.19636C16.1247 4.17272 16.1878 4.12085 16.2255 4.05166L17.4812 1.6904C17.5001 1.6546 17.5118 1.61541 17.5155 1.57508C17.5192 1.53475 17.5148 1.49408 17.5027 1.45544C17.4906 1.4168 17.4709 1.38094 17.4449 1.34994C17.4188 1.31894 17.3869 1.29342 17.3509 1.27485C15.6797 0.434106 13.8345 -0.00255657 11.9637 1.12599e-05C8.94152 0.0104511 6.03442 1.16024 3.82287 3.21981C1.61133 5.27939 0.258064 8.0972 0.0332741 11.1106C-0.191516 14.1241 0.728707 17.1115 2.61021 19.4763C4.49172 21.8411 7.19607 23.4093 10.1833 23.8679C10.7726 23.9566 11.3678 24.0007 11.9637 24C12.1522 24 12.3389 24 12.5255 23.9859H12.6065C15.4508 23.8328 18.1478 22.6732 20.2155 20.7145C22.2832 18.7558 23.5868 16.1256 23.8932 13.2942C23.8974 13.2518 23.8927 13.2089 23.8792 13.1684C23.8658 13.1279 23.844 13.0907 23.8153 13.0592C23.7866 13.0276 23.7516 13.0025 23.7125 12.9853C23.6734 12.9682 23.6312 12.9594 23.5886 12.9596V12.9579Z";
const G_BAR = "M12.3089 8.35681H23.6255C23.7062 8.35727 23.7834 8.38951 23.8404 8.44654C23.8975 8.50357 23.9297 8.58078 23.9302 8.66143V10.8536C23.9297 10.9341 23.8974 11.0112 23.8403 11.0679C23.7832 11.1247 23.706 11.1565 23.6255 11.1565H12.3089C12.2285 11.1565 12.1515 11.1246 12.0947 11.0678C12.0379 11.011 12.006 10.934 12.006 10.8536V8.66143C12.006 8.58094 12.0378 8.50373 12.0946 8.44665C12.1513 8.38957 12.2284 8.35727 12.3089 8.35681Z";

const CUTS: Record<string, Array<[string, MetalStep]>> = {
  champagne: [
    ["0%", 100],
    ["30%", 200],
    ["55%", 300],
    ["100%", 600],
  ],
  metal: [
    ["0%", 300],
    ["35%", 400],
    ["70%", 600],
    ["100%", 700],
  ],
};

export function Wordmark({
  cut = "metal",
  lockup = "full",
  className = "h-6",
}: {
  cut?: "champagne" | "metal";
  /** "full" is the GLINT logotype; "mark" is the G glyph alone for
   *  icon rails, collapsed sidebars, and other tight chrome. */
  lockup?: "full" | "mark";
  className?: string;
}) {
  const stops = CUTS[cut] ?? CUTS.metal;
  const gradId = `glint-wm-${lockup}-${cut}`;
  const stopEls = stops.map(([offset, step]) => (
    <stop
      key={offset}
      offset={offset}
      style={{ stopColor: `oklch(${METALS.gold[step]})` }}
    />
  ));

  if (lockup === "mark") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label="Glint"
        className={`w-auto ${className}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            {stopEls}
          </linearGradient>
        </defs>
        <path d={G_RING} fill={`url(#${gradId})`} />
        <path d={G_BAR} fill={`url(#${gradId})`} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 103 24"
      fill="none"
      role="img"
      aria-label="Glint"
      className={`w-auto ${className}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="103" y2="24" gradientUnits="userSpaceOnUse">
          {stopEls}
        </linearGradient>
      </defs>
      <path d={G_RING} fill={`url(#${gradId})`} />
      <path d="M80.2332 0.241217H77.8012C77.7611 0.240283 77.7211 0.247297 77.6837 0.261857C77.6462 0.276417 77.6121 0.298235 77.5831 0.326056C77.5541 0.353877 77.5309 0.38715 77.5149 0.423963C77.4988 0.460776 77.4902 0.5004 77.4895 0.540557L77.5511 16.7207L61.5659 0.0827435C61.5523 0.0671265 61.5343 0.0560859 61.5142 0.0511328C61.4941 0.0461797 61.473 0.0475563 61.4537 0.0550742C61.4344 0.062592 61.4179 0.0758836 61.4065 0.0931296C61.395 0.110376 61.3892 0.130733 61.3898 0.151415V23.3661C61.3898 23.4469 61.4219 23.5243 61.479 23.5815C61.5362 23.6386 61.6137 23.6707 61.6945 23.6707H64.16C64.2 23.6707 64.2396 23.6628 64.2766 23.6475C64.3135 23.6322 64.3471 23.6098 64.3754 23.5815C64.4037 23.5532 64.4261 23.5196 64.4414 23.4826C64.4568 23.4457 64.4646 23.4061 64.4646 23.3661L64.403 7.46938L80.3636 23.9295C80.3776 23.9443 80.3958 23.9545 80.4158 23.9589C80.4357 23.9632 80.4565 23.9615 80.4755 23.9539C80.4944 23.9463 80.5107 23.9333 80.5221 23.9164C80.5336 23.8995 80.5397 23.8795 80.5397 23.8591V0.540557C80.5392 0.459909 80.507 0.382695 80.4499 0.325667C80.3929 0.268639 80.3157 0.236397 80.235 0.235935L80.2332 0.241217Z" fill={`url(#${gradId})`} />
      <path d="M32.8554 20.6455H43.8075C43.9219 20.6455 44.0317 20.691 44.1126 20.7719C44.1935 20.8528 44.239 20.9625 44.239 21.0769V23.2551C44.239 23.3695 44.1935 23.4792 44.1126 23.5601C44.0317 23.641 43.9219 23.6865 43.8075 23.6865H30.1539C30.0395 23.6865 29.9297 23.641 29.8488 23.5601C29.7679 23.4792 29.7225 23.3695 29.7225 23.2551V0.661989C29.7225 0.547574 29.7679 0.437845 29.8488 0.356942C29.9297 0.276039 30.0395 0.230588 30.1539 0.230588H32.4257C32.5398 0.231053 32.6491 0.27671 32.7297 0.357563C32.8102 0.438416 32.8554 0.547878 32.8554 0.661989V20.6455Z" fill={`url(#${gradId})`} />
      <path d="M50.7212 0.230588H52.9909C53.1053 0.230588 53.2151 0.276039 53.296 0.356942C53.3769 0.437845 53.4223 0.547574 53.4223 0.661989V23.2551C53.4223 23.3695 53.3769 23.4792 53.296 23.5601C53.2151 23.641 53.1053 23.6865 52.9909 23.6865H50.7212C50.6068 23.6865 50.4971 23.641 50.4162 23.5601C50.3353 23.4792 50.2898 23.3695 50.2898 23.2551V0.661989C50.2898 0.547574 50.3353 0.437845 50.4162 0.356942C50.4971 0.276039 50.6068 0.230588 50.7212 0.230588Z" fill={`url(#${gradId})`} />
      <path d="M102.85 0.280298C102.892 0.303753 102.927 0.337613 102.951 0.378571L102.964 0.371528C102.987 0.413076 103 0.460118 103 0.507992C103 0.555865 102.987 0.602907 102.964 0.644455L101.731 3.00571C101.696 3.07712 101.641 3.13732 101.574 3.17961C101.506 3.22189 101.428 3.2446 101.349 3.24518H96.2803V23.2551C96.2799 23.3692 96.2342 23.4785 96.1533 23.559C96.0725 23.6396 95.963 23.6848 95.8489 23.6848H93.5771C93.4631 23.6848 93.3538 23.6395 93.2732 23.5589C93.1927 23.4784 93.1474 23.3691 93.1474 23.2551V3.24518H87.1245C87.0104 3.24472 86.9011 3.19906 86.8206 3.11821C86.74 3.03736 86.6948 2.92789 86.6948 2.81378V0.67615C86.6948 0.56204 86.74 0.452577 86.8206 0.371724C86.9011 0.290871 87.0104 0.245215 87.1245 0.244749H102.714C102.761 0.244595 102.808 0.256843 102.85 0.280298Z" fill={`url(#${gradId})`} />
      <path d={G_BAR} fill={`url(#${gradId})`} />
    </svg>
  );
}

/** Metal ladders as a static for consumers that receive Wordmark via a
 *  barrel (mirrors the Studio statics pattern). */
Wordmark.METALS = METALS;
Wordmark.metalSurface = metalSurface;
