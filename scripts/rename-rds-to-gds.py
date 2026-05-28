#!/usr/bin/env python3
"""
Rename the lingering Ramp-era runtime tokens to Grade equivalents.

This is the deferred breaking change that the previous rename-ramp-to-grade.py
pass intentionally left behind, because they're persisted in user state:

  - `--rds-*` CSS custom properties     → `--gds-*`
  - `data-ramp-theme` HTML attribute    → `data-grade-theme`
  - localStorage keys (`ramp-mode`, `ramp-theme`,
    `rds-playgrounds`, `rds-template-saves`, `rds-chat-settings`)
    → grade-mode / grade-theme / gds-playgrounds / gds-template-saves /
    gds-chat-settings

The library has no public users yet, so we're doing the clean break — no
localStorage migration shim. Anyone running a dev branch will get a one-time
loss of their local theme/playground selection on next load. Acceptable.

CRITICAL preservation: `--ramp-*` CSS custom properties stay as-is. They are
the per-step color-ramp values (--ramp-50 ... --ramp-950), which is technical
terminology (an OKLCH color ramp), NOT brand. The previous rename pass
protected the same set; we preserve it here too.
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Scope: every package + app that holds runtime tokens. The rename touches
# packages/ui (the canonical library), packages/core, packages/pro, packages/
# studio, packages/walker, packages/skills, apps/docs (which still keeps a
# copy of components during the transition), apps/consume-app, and any
# root-level design docs (PRESENCE.md, MAP.md, STUDIO-*.md, CLAUDE.md) that
# reference the runtime tokens. SCOPE includes ROOT so the os.walk picks
# them up — SKIP_DIRS / SKIP_DIR_PATHS keep us out of node_modules etc.
SCOPE = [
    ROOT,
]

EXTENSIONS = {".tsx", ".ts", ".jsx", ".js", ".mjs", ".mts", ".mdx", ".md", ".json", ".css", ".html", ".txt"}

# Skip dirs (generated / external).
SKIP_DIRS = {"node_modules", ".next", "dist", ".turbo", "build", ".git", ".vercel"}

# Skip specific files that are historical artifacts or describe past releases —
# the old text was accurate when written, so rewriting it would falsify history.
SKIP_FILES = {
    # The previous rename script — historical artifact of the Ramp→Grade pass.
    ROOT / "scripts" / "rename-ramp-to-grade.py",
    # This script itself (don't recurse).
    ROOT / "scripts" / "rename-rds-to-gds.py",
    # Published CHANGELOG entries describe what shipped under the old names.
    ROOT / "packages" / "ui" / "CHANGELOG.md",
}

# Skip the pending-changeset folder — a *new* changeset describing THIS rename
# will be written by hand after the script runs. Existing changesets should
# not be retroactively rewritten.
SKIP_DIR_PATHS = {
    ROOT / ".changeset",
}

# -------------------------------------------------------------------------
# PROTECTED tokens — match-and-stash these before any replacement runs, then
# restore them at the end. This is the safety net that keeps technical
# substrings intact while the script is busy with brand-prefix renames.
# Ordered longest-first.
# -------------------------------------------------------------------------
PROTECTED = [
    # Historical npm scope. `@rds-energy/ui` is the OLD package name from the
    # ramp-ds predecessor era — referenced in the rendered changelog ("renamed
    # from @rds-energy/ui to @gradeui/ui"). Rewriting it would falsify the
    # history of why the package was renamed. Longest-first match.
    "@rds-energy/ui",
    "@rds-energy",

    # The per-step color ramp CSS prefix (--ramp-50 ... --ramp-950). Technical
    # terminology for OKLCH color ramps — NOT brand. Preserved by the previous
    # rename pass for the same reason.
    "--ramp-",
]

# -------------------------------------------------------------------------
# REPLACEMENTS — longest-first to avoid prefix collisions (e.g. `rds-template-
# saves` must be replaced before any naked `rds-` rule could chew it).
# Quoted forms for localStorage keys are deliberate: matching the bare token
# `ramp-mode` would also match prose like "in ramp-mode the swatches…"; the
# quotes (' and ") bind it to a code literal.
# -------------------------------------------------------------------------
REPLACEMENTS = [
    # ── CSS custom properties (bulk: 800+ occurrences) ────────────────────
    ("--rds-", "--gds-"),

    # ── HTML attribute set by the pre-hydration script ────────────────────
    ("data-ramp-theme", "data-grade-theme"),

    # ── localStorage keys + downloaded-file naming ────────────────────────
    # Filename / template-literal prefix forms first (longest substrings),
    # so `ramp-theme-` is normalised before bare `ramp-theme` could match
    # something it shouldn't.
    ("`ramp-theme-", "`grade-theme-"),  # download filename template
    ("`ramp-theme`", "`grade-theme`"),  # markdown code ref in comments
    ("`ramp-mode`", "`grade-mode`"),

    # rds-* family — playgrounds / templates / chat settings (all three
    # quote styles: single / double / backtick).
    ("'rds-playgrounds'", "'gds-playgrounds'"),
    ('"rds-playgrounds"', '"gds-playgrounds"'),
    ("`rds-playgrounds`", "`gds-playgrounds`"),
    ("'rds-template-saves'", "'gds-template-saves'"),
    ('"rds-template-saves"', '"gds-template-saves"'),
    ("`rds-template-saves`", "`gds-template-saves`"),
    ("'rds-chat-settings'", "'gds-chat-settings'"),
    ('"rds-chat-settings"', '"gds-chat-settings"'),
    ("`rds-chat-settings`", "`gds-chat-settings`"),
    # ramp-* family — mode + theme + user-themes store.
    ("'ramp-mode'", "'grade-mode'"),
    ('"ramp-mode"', '"grade-mode"'),
    ("'ramp-theme'", "'grade-theme'"),
    ('"ramp-theme"', '"grade-theme"'),
    # `ramp-user-themes` wasn't in the original CLAUDE.md deferred-rename
    # list — discovered during cleanup. Holds { [id]: ThemeInput } for any
    # custom themes the user saved through the Theme Builder.
    ("'ramp-user-themes'", "'grade-user-themes'"),
    ('"ramp-user-themes"', '"grade-user-themes"'),

    # ── Bare CSS class prefix (lowest-priority, last) ─────────────────────
    # `.rds-app-shell`, `.rds-card`, `.rds-button`, `.rds-aura-*`,
    # `.rds-surface-*`, `.rds-flex`, `.rds-grid`, `.rds-row`, `.rds-stack`,
    # `.rds-checkbox`, `.rds-media-surface`, `.rds-map`, `.rds-energy`, and
    # the per-step grey/green/yellow scale class names. These show up both
    # as CSS selectors (`.rds-card { … }`) and in JSX `className` strings.
    #
    # Ordering note: this rule runs AFTER every more-specific replacement
    # above. By the time we get here, `--rds-` has already become `--gds-`,
    # so the bare `rds-` rule below cannot retouch those (the leading `--`
    # is part of the matched string in the rule above, not here).
    ("rds-", "gds-"),
]


def should_skip(path: Path) -> bool:
    if any(part in SKIP_DIRS for part in path.parts):
        return True
    if path in SKIP_FILES:
        return True
    # Skip if path is inside any of the SKIP_DIR_PATHS.
    for skip_dir in SKIP_DIR_PATHS:
        try:
            path.relative_to(skip_dir)
            return True
        except ValueError:
            pass
    return False


def find_files():
    files = []
    for base in SCOPE:
        if not base.exists():
            continue
        for root, dirs, filenames in os.walk(base):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            root_path = Path(root)
            if should_skip(root_path):
                # Skip the whole subtree.
                dirs[:] = []
                continue
            for name in filenames:
                p = root_path / name
                if p.suffix in EXTENSIONS and not should_skip(p):
                    files.append(p)
    return files


def transform(content: str) -> tuple[str, int]:
    """Apply protected-token stashing, then the replacement list, then restore."""
    changes = 0
    placeholders: dict[str, str] = {}

    # 1. Stash protected tokens behind unique placeholders.
    for i, token in enumerate(PROTECTED):
        if token in content:
            ph = f"\x01PRT{i}\x02"
            placeholders[ph] = token
            content = content.replace(token, ph)

    # 2. Apply replacements.
    for old, new in REPLACEMENTS:
        if old in content:
            c = content.count(old)
            content = content.replace(old, new)
            changes += c

    # 3. Restore protected tokens.
    for ph, token in placeholders.items():
        content = content.replace(ph, token)

    return content, changes


def main(dry_run: bool = False) -> int:
    files = find_files()
    total_changes = 0
    changed_files = 0
    per_replacement_counts: dict[str, int] = {old: 0 for old, _ in REPLACEMENTS}

    for f in files:
        try:
            original = f.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        # Track per-replacement counts before the protect/restore cycle would
        # mask them. We count on the original string for simplicity — protected
        # tokens (`--ramp-`) don't overlap with our replacement set so the
        # counts are accurate.
        for old, _ in REPLACEMENTS:
            per_replacement_counts[old] += original.count(old)

        new_content, changes = transform(original)
        if changes > 0 and new_content != original:
            if not dry_run:
                f.write_text(new_content, encoding="utf-8")
            total_changes += changes
            changed_files += 1
            print(f"  {changes:5d}  {f.relative_to(ROOT)}")

    print(f"\n{'DRY RUN ' if dry_run else ''}Total: {total_changes} changes across {changed_files} files\n")
    print("Per-replacement breakdown:")
    for old, new in REPLACEMENTS:
        c = per_replacement_counts[old]
        if c > 0:
            print(f"  {c:5d}  {old!r} -> {new!r}")
    return 0


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    sys.exit(main(dry_run=dry_run))
