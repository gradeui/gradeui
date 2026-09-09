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
export const CAPTION_BAND = 220;
