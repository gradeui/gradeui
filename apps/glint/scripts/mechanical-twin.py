# python3 scripts/mechanical-twin.py <studio-source.jsx> <out.tsx relative to apps/glint> <Name> <studio id>
# Mechanical app twin of a Studio shared component: same body, imports
# rewritten to the app's modules, "use client", ts-nocheck, untyped exports.
import sys, re, os
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src, out, name, sid = sys.argv[1:5]
s = open(src).read()
mods = {}
for line in open(os.path.join(APP, 'scripts/promote-screen.py')):
    m = re.match(r'\s+"(\w+)": "(@/[^"]+)",', line)
    if m:
        mods[m.group(1)] = m.group(2)
mods['FlowStore'] = '@/lib/flow-store'


def rep(m):
    names = [n.strip() for n in m.group(1).split(',') if n.strip()]
    lines = []
    for n in names:
        if n not in mods:
            raise SystemExit('no module for ' + n)
        lines.append('import { %s } from "%s";' % (n, mods[n]))
    return '\n'.join(lines)


s = re.sub(r'import \{([^}]*)\} from "@project/components";', rep, s, flags=re.S)
s = re.sub(r'// TWIN: apps/glint/[^\n]*\n// [^\n]*\n',
           '// TWIN: the Studio shared component "%s" (%s). Editing one does\n// not touch the other. Keep the pair in sync.\n' % (name, sid), s, count=1)
s = s.replace('  useWebDsType();\n',
              '  /* useWebDsType() is Studio only: the app sets the Web DS type in\n'
              '     app/globals.css and loads the faces with next/font. */\n')
exported = re.findall(r'^export function (\w+)\(', s, flags=re.M)
for n in exported:
    s = re.sub(r'^export function ' + n + r'\(', 'function ' + n + '(', s, flags=re.M)
if exported:
    s += '\n/* Exported untyped: the body is plain JSX (see the header). */\n'
    for n in exported:
        s += 'const __%s: any = %s;\nexport { __%s as %s };\n' % (n, n, n, n)
hdr = ('// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio\n'
       '// JSX byte for byte; only the imports and the export line are rewritten\n'
       '// (scripts/mechanical-twin.py), so the pair cannot drift by\n'
       '// hand-porting.\n"use client";\n\n')
open(os.path.join(APP, out), 'w').write(hdr + s)
print('wrote', out)
