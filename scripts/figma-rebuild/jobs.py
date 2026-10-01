"""Plan the Figma build: one job per captured state with a spec.

  python3 scripts/figma-rebuild/jobs.py <dataDir> <runDir> [state-prefix ...]

Reads <dataDir>/lib/cardmap.json (page, section, sectionX, index, card name,
read from the screenshot file) and writes <dataDir>/lib/jobs.json: each
state goes onto "DS · <page>" in a section of the same name and x, stacked in
the screenshot file's card order, 120px apart at their real heights.
"""
import json, os, sys

data, run = sys.argv[1], sys.argv[2]
prefixes = sys.argv[3:]
cards = json.load(open(os.path.join(data, "lib/cardmap.json")))
specdir = os.path.join(data, run, "specs")
jobs, ys = [], {}
for page, section, sx, idx, name in sorted(cards, key=lambda c: (c[0], c[2], c[3])):
    key = (page, section)
    y = ys.get(key, 140)
    f = os.path.join(specdir, name + ".json")
    h = 900
    if os.path.exists(f):
        h = json.load(open(f)).get("h", 900)
    ys[key] = y + h + 160
    if not os.path.exists(f):
        continue
    if prefixes and not any(name.startswith(p) for p in prefixes):
        continue
    jobs.append({"state": name, "page": "DS · " + page, "section": section, "sx": sx, "y": y, "h": h})
json.dump(jobs, open(os.path.join(data, "lib/jobs.json"), "w"))
print(len(jobs), "jobs")
