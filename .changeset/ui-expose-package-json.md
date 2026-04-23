---
"@gradeui/ui": patch
---

Expose `./package.json` as a subpath export so consumers (notably the
docs app's Studio header) can import the raw manifest to read
`version` at build time without a deep `node_modules` path.
