#!/usr/bin/env python3
"""Promote a Studio screen's raw JSX into a page in this app.

Usage:
  python3 scripts/promote-screen.py <dumped.jsx> <out/page.jsx> \
      --name "RM — Review Manager (DataTable)" --id dmsxf5zjggd0n \
      --version 1788800623722

Unlike apps/glint, screens stay JSX (page.jsx, not .tsx): the proposal
module they import is JSX too, and a 300k-character screen gains nothing
from strict typing it will lose on the next re-promotion. The transform:

  1. strips data-gds-source-id attributes (Studio selection markers)
  2. renames the default export App to <Func>Page
  3. prepends "use client" + a provenance header with the source-hash
     stamp scripts/check-promotions.mts reads

Every screen carries its own AppLayoutShell + ProposalSidebar, exactly
as authored, so what renders here is what rendered in Studio. Nothing
inside the body is touched.
"""

from __future__ import annotations

import argparse
import hashlib
import pathlib
import re
import sys


def source_signature(src: str) -> str:
    """Port of sourceSignature in scripts/check-promotions.mts. Keep in step."""
    normalised = re.sub(r'\s*data-gds-source-id="\d+"', "", src)
    normalised = re.sub(r"\s+", " ", normalised).strip()
    return hashlib.sha256(normalised.encode("utf-8")).hexdigest()[:12]


def func_name(screen_name: str) -> str:
    words = re.sub(r"[^A-Za-z0-9 ]+", " ", screen_name).split()
    return "".join(w[:1].upper() + w[1:] for w in words) + "Page" or "ScreenPage"


def transform(src: str, screen_name: str, design_id: str, version: int) -> tuple[str, list[str]]:
    problems: list[str] = []
    stamp = source_signature(src)
    src = re.sub(r'\s*data-gds-source-id="\d+"', "", src)
    func = func_name(screen_name)
    new = src.replace("export default function App()", f"export default function {func}()")
    if new == src:
        problems.append("`export default function App()` not found")
    src = new
    header = (
        '"use client";\n\n'
        f'// Promoted from Studio screen "{screen_name}"\n'
        f"// (design {design_id}, version {version}). Registry: lib/screens.ts;\n"
        "// re-promotion workflow: apps/brightlocal/README.md.\n"
        f"// source-hash: {stamp}\n\n"
    )
    return header + src.lstrip("\n"), problems


PATCH_FILE = pathlib.Path(__file__).with_name("promotion-patches.json")


def apply_patches(src: str, out_path: str) -> tuple[str, int]:
    """Reapply the app-side edits a promotion cannot carry (see the JSON's
    _why). Exact strings; a miss is fatal so a lost patch is loud."""
    import json
    if not PATCH_FILE.exists():
        return src, 0
    entries = json.loads(PATCH_FILE.read_text()).get(out_path.lstrip("./")) or []
    for entry in entries:
        n = src.count(entry["find"])
        if n != 1:
            raise SystemExit(
                f"promote-screen: patch for {out_path} matched {n} times, expected 1.\n"
                f"  why:  {entry.get('why', '(no note)')}\n"
                "The Studio source moved. Update scripts/promotion-patches.json."
            )
        src = src.replace(entry["find"], entry["replace"], 1)
    return src, len(entries)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=pathlib.Path)
    ap.add_argument("output", type=pathlib.Path)
    ap.add_argument("--name", required=True)
    ap.add_argument("--id", required=True)
    ap.add_argument("--version", required=True, type=int)
    args = ap.parse_args()
    out, problems = transform(args.input.read_text(), args.name, args.id, args.version)
    out, patched = apply_patches(out, str(args.output))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(out)
    print(f"wrote {args.output} ({len(out)} chars)" + (f", {patched} patches applied" if patched else ""))
    for p in problems:
        print(" - PROBLEM:", p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
