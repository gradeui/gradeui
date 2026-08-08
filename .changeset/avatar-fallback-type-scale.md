---
"@gradeui/ui": patch
---

AvatarFallback type now scales with the Avatar `size` prop (~0.4 of the circle diameter: 9px at 2xs up to 30px at xl) instead of inheriting the 16px base at every size. `md` keeps the 16px base, so default-size avatars render exactly as before; a `className` on the fallback still overrides the scaled size.
