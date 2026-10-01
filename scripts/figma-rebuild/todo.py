"""Write lib/todo.json: planned jobs whose Figma export does not exist yet
(or all of them with --all). Run jobs.py first.

  python3 scripts/figma-rebuild/todo.py <dataDir> <runDir> [--all]
"""
import json, os, sys
data, run = sys.argv[1], sys.argv[2]
jobs = json.load(open(os.path.join(data, "lib/jobs.json")))
if "--all" not in sys.argv:
    jobs = [j for j in jobs if not os.path.exists(os.path.join(data, run, "figma", j["state"] + ".png"))]
json.dump(jobs, open(os.path.join(data, "lib/todo.json"), "w"))
print(len(jobs), "to build:", " ".join(j["state"] for j in jobs[:40]))
