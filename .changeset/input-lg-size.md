---
"@gradeui/ui": minor
---

Input gains an `lg` size, and InputGroup gains a matching `size` prop.

`Input size="lg"` is `h-11` and stays at 16px text at every width: it is for the prominent single value on a surface (an amount in a dialog, a first field on a form), and 16px keeps iOS from zooming on focus. The scale now reads lg / default / sm / xs / 2xs.

`InputGroup` had a hardcoded height. It now takes `size` (`lg` | `default` | `sm`) and shares it with the control inside via context, so `<InputGroup size="lg">` sizes the whole field; an explicit `size` on `InputGroupInput` still wins.

Both are theme-relative: heights derive from `--spacing`, so a theme with tighter density renders them proportionally smaller.
