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
  6. prepends "use client" + a provenance header

After running: add or refresh the screen's entry in lib/screens.ts
(slug, name, id, step, promotedAt = --version), then
`pnpm -F @gradeui/glint build` to type-check. Untyped helper components
in the screen may need light prop annotations to pass strict TS.
"""

import argparse
import pathlib
import re
import sys

FLOW_NAMES = {"FlowStore", "useFlowField", "getFlowField", "resetFlow", "US_STATES"}


def transform(src: str, func: str, screen_name: str, design_id: str,
              version: int, is_step: bool) -> tuple[str, list[str]]:
    problems: list[str] = []

    src = re.sub(r'\s*data-gds-source-id="\d+"', "", src)

    m = re.search(r'import\s*\{([^}]*)\}\s*from\s*"@project/components";\n', src)
    if m:
        names = [n.strip() for n in m.group(1).split(",") if n.strip()]
        lines = []
        if "OnboardingLayout" in names:
            lines.append('import { OnboardingLayout } from "@/components/layouts/onboarding";')
        if "Wordmark" in names:
            lines.append('import { Wordmark } from "@/components/wordmark";')
        flow = [n for n in names if n in FLOW_NAMES]
        if flow:
            lines.append(f'import {{ {", ".join(flow)} }} from "@/lib/flow-store";')
        unknown = [n for n in names
                   if n not in FLOW_NAMES and n not in ("OnboardingLayout", "Wordmark")]
        if unknown:
            problems.append(f"unknown @project/components imports {unknown}: "
                            "port those shared components first")
        src = src.replace(m.group(0), "\n".join(lines) + "\n")
    elif "@project/components" in src:
        problems.append("unmatched @project/components import shape")

    if is_step:
        new = re.sub(r"const STEPS = \[\n(?:.*\n)*?\];\n\n?", "", src, count=1)
        if new == src:
            problems.append("STEPS block not found")
        src = new
        new = re.sub(
            r'^(\s*)<OnboardingLayout steps=\{STEPS\}[^>]*>\s*$',
            r"\1<>", src, flags=re.M)
        if new == src:
            problems.append("opening OnboardingLayout wrapper not found")
        src = new
        new = re.sub(r"^(\s*)</OnboardingLayout>\s*$", r"\1</>", src, flags=re.M)
        if new == src:
            problems.append("closing OnboardingLayout wrapper not found")
        src = new
        if "OnboardingLayout." not in src:
            src = src.replace(
                'import { OnboardingLayout } from "@/components/layouts/onboarding";\n', "")

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
        "// re-promotion workflow: apps/glint/README.md.\n\n"
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
    args = ap.parse_args()

    out, problems = transform(args.input.read_text(), args.func, args.name,
                              args.id, args.version, args.step)
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
