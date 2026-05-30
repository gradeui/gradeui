/**
 * Studio Users — stable per-author Avatar tone.
 *
 * Picks an `AvatarTone` from the toned palette based on a hash of the
 * user id, so the same author always renders with the same colour
 * across surfaces (comment pin, thread card, future presence rows).
 *
 * The hashing is intentionally simple — a sum-of-charcodes mod the
 * palette length. The point is stability across reloads, not
 * cryptographic dispersion. If two authors collide on a tone that
 * doesn't matter visually (they're still distinguishable by avatar
 * image / initials / name); the eye reads the colour as identity, not
 * uniqueness.
 *
 * `muted` is excluded from the rotation — it's the unstable fallback
 * tone used when there's no author identity to anchor a colour to.
 * Including it would mean some users randomly drew the "no author"
 * colour, which reads as "system event" elsewhere in the chrome.
 */

import type { AvatarTone } from "@gradeui/ui";

const TONE_ROTATION: AvatarTone[] = [
  "violet",
  "amber",
  "emerald",
  "sky",
  "rose",
  "plum",
  "lime",
  "primary",
];

export function toneForUserId(id: string): AvatarTone {
  if (!id) return "muted";
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum = (sum + id.charCodeAt(i)) >>> 0;
  }
  return TONE_ROTATION[sum % TONE_ROTATION.length]!;
}
