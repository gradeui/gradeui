#!/usr/bin/env python3
"""Promote a Studio screen's raw JSX into a Next.js page in this app.

Usage:
  python3 scripts/promote-screen.py <dumped.jsx> <out-page.tsx> \
      --func BusinessTypePage \
      --name "US Onboarding — 1 Business type" \
      --id dmskgweh31a0m --version 1786356816160 \
      [--step]

Input is a screen's raw appSource (dump it with
apps/mcp-server/scripts/dump-glint-screens.mts, or paste from MCP
get_screen). The transform:

  1. strips data-gds-source-id attributes (Studio selection markers)
  2. rewrites the "@project/components" import to app modules
  3. with --step: drops the STEPS const and the <OnboardingLayout>
     wrapper (app/onboarding/layout.tsx provides the chrome), keeping
     <OnboardingLayout.Actions> which rides on context
  4. drops lucide icons that were only used by STEPS
  5. renames App to --func
  6. prepends "use client" + a provenance header, including the
     `// source-hash:` stamp scripts/check-promotions.mts reads to tell
     whether this page is still the current promotion of that screen

After running: add or refresh the screen's entry in lib/screens.ts
(slug, name, id, step, promotedAt = --version), then
`pnpm -F @gradeui/glint build` to type-check. Untyped helper components
in the screen may need light prop annotations to pass strict TS.
"""

from __future__ import annotations  # PEP 604 unions on Python 3.9

import argparse
import hashlib
import pathlib
import re
import sys

FLOW_NAMES = {"FlowStore", "useFlowField", "getFlowField", "resetFlow", "US_STATES"}


def source_signature(src: str) -> str:
    """The drift guard's signature of a Studio source.

    A PORT of `sourceSignature` in scripts/check-promotions.mts, and it
    has to stay one: the guard compares the hash stamped into a promoted
    page against the hash it computes from the live Studio screen, so the
    two implementations must normalise identically. Change one, change
    the other.

      - `data-gds-source-id="N"` goes, because a canvas save stamps those
        in and an MCP save strips them, and neither changes a pixel.
      - whitespace runs collapse, so reformatting is not a change.

    WHY THE PAGE CARRIES THIS (11 Aug 2026): the guard used to compare
    live Studio against a `sourceHash` field in lib/screens.ts, and both
    sides of that comparison were Studio. Running `check:promotions
    --update` without re-promoting re-blessed the baseline against
    whatever Studio held at that moment, and a stale app copy sat under a
    green tick indefinitely. That is how the gold wallet diverged, with
    Studio filtering on `tx.account` while the page here still read
    `tx.metal`, and the guard reporting all 15 screens matching. Stamping
    the signature into the generated page means the only way to move the
    app side of the comparison is to generate the page again.
    """
    normalised = re.sub(r'\s*data-gds-source-id="\d+"', "", src)
    normalised = re.sub(r"\s+", " ", normalised).strip()
    return hashlib.sha256(normalised.encode("utf-8")).hexdigest()[:12]


# Studio shared-component name -> the app module holding its ported twin.
#
# ONE TABLE, deliberately. This used to be two: a dict of import lines
# that nothing read for most names, and a hand-written if-chain plus a
# literal tuple of "known" names in the rewriter. Adding a mapping to one
# and not the others either kept flagging a name that now resolved fine
# or silently stopped flagging one that did not. Everything below is
# derived from this dict, so there is one place to edit.
#
# The app twins expose the SAME namespaces the Studio modules do
# (Persona.fmtMoney, Accounts.identifiers, Wordmark.metalSolid, ...), so
# promotion is a pure import rewrite: no call site inside the screen body
# is touched. Where the app also exports the underlying helpers by name,
# those stay for the app's own hand-written code. If you add a shared
# component, port it into the module named here and add its line.
COMPONENT_MODULES = {
    "OnboardingLayout": "@/components/layouts/onboarding",
    "AppChrome": "@/components/layouts/app-chrome",
    "Wordmark": "@/components/wordmark",
    "Persona": "@/lib/persona",
    "Market": "@/lib/market",
    "Accounts": "@/lib/accounts",
    "ActivityTable": "@/components/activity-table",
    "MetalButton": "@/components/metal-button",
    "MetalPriceCard": "@/components/metal-price-card",
    "MetalWalletCard": "@/components/metal-wallet-card",
    "TradeFlow": "@/components/trade-flow",
    "PhoneField": "@/components/phone-field",
}

# BuyFlow is deliberately absent. TradeFlow superseded it and there is no
# app-side twin, so a screen importing BuyFlow should keep landing in the
# `unknown` list: promoting it needs a decision (retarget to TradeFlow
# with direction="buy", or retire the Studio module), not a rewrite.


def comment_spans(src: str) -> list[tuple[int, int]]:
    """(start, end) of every // and /* */ comment, so a search can skip them.

    Deliberately simple: it does not track strings, so a "//" inside a string
    literal would be mistaken for a comment start. That is acceptable here
    because the only caller is looking for a JSX tag, and a tag name inside a
    string is not a tag either, so both readings skip it.
    """
    spans: list[tuple[int, int]] = []
    i, n = 0, len(src)
    while i < n:
        if src.startswith("//", i):
            end = src.find("\n", i)
            end = n if end == -1 else end
            spans.append((i, end))
            i = end
        elif src.startswith("/*", i):
            end = src.find("*/", i + 2)
            end = n if end == -1 else end + 2
            spans.append((i, end))
            i = end
        else:
            i += 1
    return spans


def find_outside_comments(src: str, needle: str) -> int:
    """Index of the first `needle` that is NOT inside a comment, or -1.

    WHY (11 Aug 2026): unwrap_chrome used a plain str.find for the opening
    tag, and a screen whose COMMENT mentioned "<AppChrome>" in prose had that
    mention rewritten to "<>" instead of the real element. The element then
    survived, the tree was unbalanced, and the promoted page failed to parse
    with "Identifier expected" pointing at the closing fragment, which is a
    long way from the cause. Comments are the one place a tag name appears as
    text rather than as syntax, so they are skipped.
    """
    spans = comment_spans(src)
    at = src.find(needle)
    while at != -1:
        if not any(lo <= at < hi for lo, hi in spans):
            return at
        at = src.find(needle, at + 1)
    return -1


def opening_tag_span(src: str, name: str) -> tuple[int, int] | None:
    """Span of `<Name ...>`, including a MULTI-LINE prop list, or None.

    Scans for the `>` that closes the opening tag while tracking JSX
    expression-container depth, so a prop holding an element does not end
    the tag early. This replaced a regex (`<Name[^>]*>` anchored to one
    line) that silently corrupted every screen whose chrome took a prop
    like toolbarLeading={<Button ...>Back</Button>}: `[^>]*` crosses
    newlines, so it ran to the `>` closing the nested <Button> and
    swallowed the props in between, leaving orphaned JSX in the promoted
    page. It matched on the LINE, so it only ever worked when the whole
    opening tag fitted on one.
    """
    # The tag must END here: `<AppChrome ` or `<AppChrome>` and NOT
    # `<AppChrome.Actions>`. A compound part is a different element that
    # lives in the body and must survive the unwrap, so matching it as the
    # wrapper would delete the wrong thing.
    start = -1
    at = find_outside_comments(src, f"<{name}")
    while at != -1:
        after = src[at + 1 + len(name) : at + 2 + len(name)]
        if after in ("", " ", "\n", "\t", ">", "/"):
            start = at
            break
        at = find_outside_comments(src[at + 1 :], f"<{name}")
        at = -1 if at == -1 else at + 1
    if start == -1:
        return None
    depth = 0
    for i in range(start + 1 + len(name), len(src)):
        c = src[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        elif c == ">" and depth == 0:
            return start, i + 1
    return None


def unwrap_chrome(src: str, name: str, problems: list[str]) -> str:
    """Drop a <Name ...> wrapper element (the route layout provides the
    chrome), keeping any Name.* compound uses. Same shape for
    OnboardingLayout and AppChrome.

    Props on the wrapper go with it, which is the intended behaviour: the
    route layout is what supplies them now. For AppChrome that means the
    screen's own toolbarLeading Back button is dropped in favour of the
    layout's, so the two cannot disagree.
    """
    span = opening_tag_span(src, name)
    if span is None:
        problems.append(f"opening {name} wrapper not found")
    else:
        line_start = src.rfind("\n", 0, span[0]) + 1
        indent = src[line_start:span[0]]
        src = src[:line_start] + indent + "<>" + src[span[1]:]
    close_at = find_outside_comments(src, f"</{name}>")
    if close_at == -1:
        problems.append(f"closing {name} wrapper not found")
    else:
        src = src[:close_at] + "</>" + src[close_at + len(name) + 3:]
    # With the wrapper gone the name may be unused. Compound uses keep it
    # alive: --step drops <OnboardingLayout> but keeps
    # <OnboardingLayout.Actions>, which rides on context.
    #
    # The import block has ALREADY been rewritten and grouped by module by
    # the time this runs, so this drops the name from whichever grouped
    # line holds it rather than matching a whole literal import line (the
    # shape this used before COMPONENT_MODULES replaced the per-name
    # IMPORT_LINES table). The line goes too if that was its only name.
    if f"{name}." not in src and f"<{name}" not in src:
        module = COMPONENT_MODULES.get(name)
        if module:
            pattern = rf'import \{{([^}}]*)\}} from "{re.escape(module)}";\n'
            m = re.search(pattern, src)
            if m:
                kept = [
                    n.strip()
                    for n in m.group(1).split(",")
                    if n.strip() and n.strip() != name
                ]
                line = (
                    f'import {{ {", ".join(kept)} }} from "{module}";\n'
                    if kept
                    else ""
                )
                src = src[: m.start()] + line + src[m.end():]
    return src


def transform(src: str, func: str, screen_name: str, design_id: str,
              version: int, is_step: bool,
              unwrap: str | None = None) -> tuple[str, list[str]]:
    problems: list[str] = []

    # Signed BEFORE any rewriting, so the stamp describes the Studio
    # source that came in rather than the page that goes out.
    stamp = source_signature(src)

    src = re.sub(r'\s*data-gds-source-id="\d+"', "", src)

    m = re.search(r'import\s*\{([^}]*)\}\s*from\s*"@project/components";\n', src)
    if m:
        names = [n.strip() for n in m.group(1).split(",") if n.strip()]
        # Group by target module so several names from one file share an
        # import line, which is what FlowStore's five names need and what
        # any future multi-export module will need too. Dict order is
        # insertion order, so the emitted lines follow the order the names
        # appeared in the Studio import.
        by_module: dict[str, list[str]] = {}
        for n in names:
            module = "@/lib/flow-store" if n in FLOW_NAMES else COMPONENT_MODULES.get(n)
            if module:
                by_module.setdefault(module, []).append(n)
        lines = [
            f'import {{ {", ".join(ns)} }} from "{module}";'
            for module, ns in by_module.items()
        ]
        unknown = [
            n for n in names if n not in FLOW_NAMES and n not in COMPONENT_MODULES
        ]
        if unknown:
            problems.append(f"unknown @project/components imports {unknown}: "
                            "port those shared components first, then add "
                            "them to COMPONENT_MODULES")
        src = src.replace(m.group(0), "\n".join(lines) + "\n")
    elif "@project/components" in src:
        problems.append("unmatched @project/components import shape")

    if is_step:
        new = re.sub(r"const STEPS = \[\n(?:.*\n)*?\];\n\n?", "", src, count=1)
        if new == src:
            problems.append("STEPS block not found")
        src = new
        src = unwrap_chrome(src, "OnboardingLayout", problems)
    if unwrap:
        src = unwrap_chrome(src, unwrap, problems)

    m2 = re.search(r"import\s*\{([^}]*)\}\s*from\s*\"lucide-react\";\n", src, re.S)
    if m2:
        icons = [i.strip() for i in m2.group(1).split(",") if i.strip()]
        rest = src.replace(m2.group(0), "")
        used = [i for i in icons if re.search(r"\b" + re.escape(i) + r"\b", rest)]
        if used != icons:
            if used:
                if len(", ".join(used)) <= 60:
                    imp = f'import {{ {", ".join(used)} }} from "lucide-react";\n'
                else:
                    imp = "import {\n  " + ",\n  ".join(used) + ',\n} from "lucide-react";\n'
                src = src.replace(m2.group(0), imp)
            else:
                src = src.replace(m2.group(0), "")

    new = src.replace("export default function App()",
                      f"export default function {func}()")
    if new == src:
        problems.append("`export default function App()` not found")
    src = new

    header = (
        '"use client";\n\n'
        f'// Promoted from Studio screen "{screen_name}"\n'
        f"// (design {design_id}, version {version}). Registry: lib/screens.ts;\n"
        "// re-promotion workflow: apps/glint/README.md.\n"
        f"// source-hash: {stamp}\n"
        "// (the drift guard's signature of the Studio source this page was\n"
        "// built from, so check:promotions measures Studio against THIS copy\n"
        "// and not against a baseline that --update can rewrite.)\n\n"
    )
    return header + src.lstrip("\n"), problems


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=pathlib.Path)
    ap.add_argument("output", type=pathlib.Path)
    ap.add_argument("--func", required=True)
    ap.add_argument("--name", required=True, help="Studio screen name")
    ap.add_argument("--id", required=True, help="Studio design id")
    ap.add_argument("--version", required=True, type=int,
                    help="designs.updated_at epoch ms of the source")
    ap.add_argument("--step", action="store_true",
                    help="screen is an /onboarding step (unwrap the chrome)")
    ap.add_argument("--unwrap", metavar="COMPONENT",
                    help="drop this chrome wrapper element (the route "
                         "layout provides it), e.g. --unwrap AppChrome "
                         "for product screens")
    args = ap.parse_args()

    out, problems = transform(args.input.read_text(), args.func, args.name,
                              args.id, args.version, args.step,
                              unwrap=args.unwrap)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(out)
    print(f"wrote {args.output} ({len(out)} chars)")
    if problems:
        print("PROBLEMS:")
        for p in problems:
            print(" -", p)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
