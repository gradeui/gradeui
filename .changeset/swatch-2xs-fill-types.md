---
"@gradeui/ui": minor
---

Swatch:

- New `2xs` size (16px) for dense colour lists / inspector rows (full ramp 16 → 56px).
- New `type` ("solid" | "gradient" | "image") plus `gradient?: string` and `image?: string`. The chip now renders a gradient or image fill **in place**, not just a solid colour/token. `type` is inferred from `image`/`gradient` when omitted, so existing solid usage is unchanged. The transparency checkerboard continues to sit behind the fill so translucent values read honestly.
- Chip border now uses the `border` token at `ring-[0.5px]` (was `ring-1 ring-foreground/40`) — a themed hairline that reads as an edge at small sizes instead of a heavy box.
