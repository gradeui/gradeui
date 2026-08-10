---
"@gradeui/ui": patch
---

Field controls read as one family. Input, SelectTrigger and Textarea adopt InputGroup's focus treatment (border-ring plus a 3px half-opacity ring halo) in place of three divergent styles, gain its `dark:bg-input/30` tinted surface for dark-mode parity, and SelectTrigger's default height drops from h-10 to h-9 so selects sit flush beside inputs in mixed field rows.
