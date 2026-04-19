# Changesets

This folder is where [changesets](https://github.com/changesets/changesets) stores pending version records. Each file represents a packet of changes to one or more packages, plus a short human-readable changelog entry.

## How to add a changeset

```bash
pnpm changeset
```

Walks you through: which packages changed, semver bump level (patch/minor/major), and a summary. The CLI writes a new markdown file into this folder — commit it alongside your code change.

On the next push to `main`, the publish workflow will either:
- Open a "Release PR" that bumps package versions and updates changelogs (if changesets are pending), or
- Publish the packages to npm (if the previous Release PR was just merged).

## What to write

Focus on the *why*. The diff already shows the *what*.
