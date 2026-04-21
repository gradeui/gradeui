#!/usr/bin/env python3
"""
Rename "Ramp" brand to "Grade" across the codebase.

Carefully preserves technical color-ramp terminology:
  - `Ramp` type (color ramp data shape — 11 OKLCH triplets)
  - `RampKey` type (keyof Ramp)
  - `RAMP_KEYS` constant (array of ramp step numbers)
  - `RAMP_STEPS` constant (same — different file)
  - `RampSwatches` UI component (displays a ramp)
  - lowercase `ramp`, `ramps`, `rampName`, etc.
  - CSS vars `--ramp-*`
  - String "Ramp swatches" in comments (technical)

Web-API false positives defensively protected (not currently in repo):
  RampTexture, RampProperty, RampRange, RampToValueAtTime
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SCOPE = [ROOT / "apps" / "docs", ROOT / "packages" / "ui"]
EXTENSIONS = {".tsx", ".ts", ".mdx", ".md", ".json", ".css"}
SKIP_DIRS = {"node_modules", ".next", "dist", ".turbo", "build", ".git"}

# -------------------------------------------------------------------------
# PROTECTED (preserve literally — technical terms, not brand).
# Ordered longest-first; matched as substrings and replaced with placeholders
# before the brand pass runs.
# -------------------------------------------------------------------------
PROTECTED = [
    # Technical identifiers we must keep verbatim.
    "RAMP_STEPS",
    "RampSwatches",
    # Web API false positives (defensive).
    "RampTexture",
    "RampProperty",
    "RampRange",
    "RampToValueAtTime",
    # The `Ramp` type and `RampKey`/`RAMP_KEYS` technical constants.
    # These are bare-word identifiers, so we protect by exact match
    # with surrounding syntax to avoid false matches.
    "RAMP_KEYS",
    "RampKey",
    # `Ramp` type in its common syntactic forms.
    # Since bare "Ramp" collides with the brand word, we protect the
    # specific contexts where it appears as a type reference.
    "interface Ramp {",
    "interface Ramp\n",
    "type Ramp ",
    "as Ramp;",
    "as Ramp\n",
    "as Ramp)",
    "as Ramp,",
    ": Ramp;",
    ": Ramp,",
    ": Ramp\n",
    ": Ramp }",
    ": Ramp)",
    ": Ramp[",
    "<Ramp>",
    "<Ramp,",
    "Ramp>",  # tail of generic
    ", Ramp>",
    ", Ramp;",
    ", Ramp,",
    ", Ramp }",
    "{ Ramp,",
    "{ Ramp }",
    "{Ramp}",
    "Ramp[]",
    # Import/export type lists
    "type Ramp }",
    " Ramp } from",
    "Ramp, type",  # rare but safe
    "type { ModeName, OKLCHTriplet, Ramp }",
    # CSS / comment technical references.
    "--ramp-",
    "Ramp swatches",  # comment describing --ramp-* css vars
    "ramp swatches",
]

# -------------------------------------------------------------------------
# BRAND IDENTIFIER REPLACEMENTS — compound names that are clearly brand.
# Applied as exact-string replacements, longest-first.
# -------------------------------------------------------------------------
IDENTIFIER_REPLACEMENTS = [
    ("RAMP_PRE_HYDRATION_SCRIPT", "GRADE_PRE_HYDRATION_SCRIPT"),
    ("useMaybeRampTheme", "useMaybeGradeTheme"),
    ("useRampTheme", "useGradeTheme"),
    ("RampThemeContextValue", "GradeThemeContextValue"),
    ("RampThemeContext", "GradeThemeContext"),
    ("RampThemeProviderProps", "GradeThemeProviderProps"),
    ("RampThemeProvider", "GradeThemeProvider"),
    ("RampThemeSwitcherProps", "GradeThemeSwitcherProps"),
    ("RampThemeSwitcher", "GradeThemeSwitcher"),
    ("RampModeSwitcherProps", "GradeModeSwitcherProps"),
    ("RampModeSwitcher", "GradeModeSwitcher"),
    ("RampTheme", "GradeTheme"),
    # File path strings (for import specifiers).
    ("ramp-theme-provider", "grade-theme-provider"),
    ("ramp-theme-switcher", "grade-theme-switcher"),
    ("ramp-mode-switcher", "grade-mode-switcher"),
]

# -------------------------------------------------------------------------
# BRAND PHRASE REPLACEMENTS — standalone "Ramp" in prose / UI strings.
# Each phrase is specific enough to avoid colliding with type refs.
# -------------------------------------------------------------------------
PHRASE_REPLACEMENTS = [
    ("Ramp Design System", "Grade Design System"),
    ("Ramp DS", "Grade DS"),
    ("Ramp UI", "Grade UI"),
    # Typical English frames — surrounding context disambiguates.
    ("Welcome to Ramp", "Welcome to Grade"),
    ("What is Ramp?", "What is Grade?"),
    ("What is Ramp", "What is Grade"),
    ("Ramp is a comprehensive", "Grade is a comprehensive"),
    ("Ramp is ", "Grade is "),
    ("with Ramp.", "with Grade."),
    ("with Ramp ", "with Grade "),
    ("with Ramp,", "with Grade,"),
    ("at Ramp\n", "at Grade\n"),
    ("at Ramp<", "at Grade<"),  # JSX
    ("at Ramp ", "at Grade "),
    ("at Ramp<", "at Grade<"),
    ("at Ramp.", "at Grade."),
    ("about Ramp\n", "about Grade\n"),
    ("about Ramp ", "about Grade "),
    ("about Ramp\"", "about Grade\""),
    ("of Ramp\n", "of Grade\n"),
    ("of Ramp ", "of Grade "),
    ("of Ramp\"", "of Grade\""),
    ("of Ramp.", "of Grade."),
    ("Why Choose Ramp?", "Why Choose Grade?"),
    ("choose Ramp?", "choose Grade?"),
    ("choose Ramp", "choose Grade"),
    ("all Ramp\n", "all Grade\n"),
    ("all Ramp ", "all Grade "),
    ("real Ramp ", "real Grade "),
    ("real Ramp\n", "real Grade\n"),
    ("actual Ramp ", "actual Grade "),
    ("legacy Ramp ", "legacy Grade "),
    ("Ramp semantic", "Grade semantic"),
    ("Ramp extras", "Grade extras"),
    ("Ramp branding", "Grade branding"),
    ("Ramp design ", "Grade design "),
    ("Ramp theme", "Grade theme"),
    ("Ramp components", "Grade components"),
    ("Ramp Sandpack", "Grade Sandpack"),
    ("Ramp preview", "Grade preview"),
    ("Ramp + Paper", "Grade + Paper"),
    ("Ramp&quot;", "Grade&quot;"),
    ("&quot;Ramp&quot;", "&quot;Grade&quot;"),
    # JSX text — "<...>Ramp<..."; catch trailing close-tag variant.
    (">Ramp<", ">Grade<"),
    (">Ramp.<", ">Grade.<"),
    # Leading-sentence variants (start of JSX text or prose).
    ("\nRamp ", "\nGrade "),
    (". Ramp ", ". Grade "),
    (", Ramp ", ", Grade "),  # only fires in prose; type lists use different spacing
    # Double-quoted brand literals — careful: only generic brand phrases.
    ("\"Ramp\"", "\"Grade\""),
    ("'Ramp'", "'Grade'"),
]


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def find_files():
    files = []
    for base in SCOPE:
        if not base.exists():
            continue
        for root, dirs, filenames in os.walk(base):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            root_path = Path(root)
            if should_skip(root_path):
                continue
            for name in filenames:
                p = root_path / name
                if p.suffix in EXTENSIONS:
                    files.append(p)
    return files


def transform(content: str) -> tuple[str, int]:
    changes = 0
    placeholders = {}

    # 1. Protect technical tokens.
    for i, token in enumerate(PROTECTED):
        if token in content:
            ph = f"\x01PRT{i}\x02"
            placeholders[ph] = token
            content = content.replace(token, ph)

    # 2. Brand identifier replacements.
    for old, new in IDENTIFIER_REPLACEMENTS:
        if old in content:
            c = content.count(old)
            content = content.replace(old, new)
            changes += c

    # 3. Phrase replacements.
    for old, new in PHRASE_REPLACEMENTS:
        if old in content:
            c = content.count(old)
            content = content.replace(old, new)
            changes += c

    # 4. Restore protected tokens.
    for ph, token in placeholders.items():
        content = content.replace(ph, token)

    return content, changes


def main(dry_run: bool = False):
    files = find_files()
    total_changes = 0
    changed_files = 0
    for f in files:
        try:
            original = f.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        new_content, changes = transform(original)
        if changes > 0 and new_content != original:
            if not dry_run:
                f.write_text(new_content, encoding="utf-8")
            total_changes += changes
            changed_files += 1
            print(f"  {changes:4d}  {f.relative_to(ROOT)}")
    print(f"\n{'DRY RUN ' if dry_run else ''}Total: {total_changes} changes across {changed_files} files")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    main(dry_run=dry_run)
