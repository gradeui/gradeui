---
"@gradeui/ui": minor
---

Brand colour utilities are now registered under the `gds-` prefix to match the rest of the system (the May 2026 rename had updated component class names to `gds-*` but missed the `@theme` colour registrations, which left e.g. a colourless Success badge). All ten families — green, yellow, orange, red, teal, navy, blue, gray, plus black/white — are now `--color-gds-*`, so `bg-gds-green-500`, `text-gds-gray-900`, `bg-gds-yellow-400` etc. resolve. The old `--color-rds-*` registrations are removed (no back-compat); switch any `*-rds-<family>` utility to `*-gds-<family>`.
