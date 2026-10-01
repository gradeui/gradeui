"""Compare every built state with its screenshot; write cmp/*.png and a table.

  python3 scripts/figma-rebuild/sweep.py <dataDir>/<runDir>
"""
import os, subprocess, sys
run = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(run, "cmp"), exist_ok=True)
rows = []
for f in sorted(os.listdir(os.path.join(run, "figma"))):
    s = f[:-4]
    shot = os.path.join(run, s + ".png")
    if not os.path.exists(shot):
        continue
    out = subprocess.run(["python3", os.path.join(here, "compare.py"), shot, os.path.join(run, "figma", f), os.path.join(run, "cmp", f)], capture_output=True, text=True).stdout.strip()
    rows.append((float(out.split("%")[0]) if "%" in out else 999, s))
rows.sort(reverse=True)
with open(os.path.join(run, "sweep.txt"), "w") as fh:
    for p, s in rows:
        fh.write(f"{p:6.2f}  {s}\n")
for p, s in rows:
    print(f"{p:6.2f}  {s}")
