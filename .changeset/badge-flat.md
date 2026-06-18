---
"@gradeui/ui": patch
---

Badge: the solid variants are now flat — dropped the `shadow` utility from `default`, `destructive`, `highlight`, `success`, `warning`, and `info`. On a solid fill the theme's bevel-highlight shadow read as embossed (the same issue fixed on `Button`); flat is the intended resting look. The soft and outline variants were already shadowless and are unchanged.
