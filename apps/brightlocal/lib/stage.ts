/** The capture stage palette, shared by the server shell and the client frame. */
export const STAGES: Record<string, { bg: string; ink: string }> = {
  neutral: { bg: "var(--ds-tailwind-colors-neutral-100)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  green: { bg: "var(--ds-tailwind-colors-green-500)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  sky: { bg: "var(--ds-tailwind-colors-sky-400)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  violet: { bg: "var(--ds-tailwind-colors-violet-400)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  yellow: { bg: "var(--ds-tailwind-colors-yellow-400)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  black: { bg: "var(--ds-tailwind-colors-neutral-950)", ink: "var(--ds-tailwind-colors-base-white)" },
  white: { bg: "var(--ds-tailwind-colors-base-white)", ink: "var(--ds-tailwind-colors-neutral-950)" },
};

/** Two lines of the stage caption plus its leading, reserved so a one-line
 *  and a two-line caption sit the same distance from the bottom edge. */
// 260, not 220 (video audits, 10 Sep). A two-line caption put its second
// baseline at about y=1005 of 1080, level with the logo and roughly 75px
// clear of the edge, against 125px for a one-liner. The band is centred, so
// the extra 40px is 20px of clearance top and bottom.
export const CAPTION_BAND = 260;
