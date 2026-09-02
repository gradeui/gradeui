#!/usr/bin/env bash
# Record every RM flow, in order, one at a time.
#
# ONE AT A TIME IS DELIBERATE. Both the recorder and capture-states.mjs drive
# a headless Chromium against the same dev server; two of them racing produces
# flaky waitFors in both, and a video that recorded the wrong thing looks
# exactly like a video that recorded the right thing (see RM-VIDEO-SPEC.md).
#
#   pnpm dev must be up.
#   bash scripts/record-all-rm.sh [outdir]
set -u
OUT="${1:-$HOME/Desktop/brightlocal-videos/rm-$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$OUT"
# Section order first, then the three wizard branches. A viewer watching
# straight through gets the tool before the flows inside it.
FLOWS=(
  rm-reviewshub
  rm-inbox
  rm-insights
  rm-templates
  rm-widgets
  rm-createwidget
  rm-getreviews
  rm-getreviews-email
  rm-getreviews-sms
  rm-getreviews-link
  rm-settings
)
fail=0
for f in "${FLOWS[@]}"; do
  echo "=== $f"
  if node scripts/record-flow-lossless.mjs \
       --flow="scripts/flows/$f.json" \
       --out="$OUT/$f.mp4" --fps=30 > "$OUT/$f.log" 2>&1; then
    # The recorder ignores the directory in --out and writes its own
    # nested "<name>-<stamp>/" folder, so the file is found rather than
    # assumed. Reporting a size from the path we ASKED for prints nothing
    # and reads as a silent failure.
    made=$(find "$OUT" -name "$f.mp4" -type f 2>/dev/null | head -1)
    if [ -n "$made" ]; then
      echo "    ok  $(du -h "$made" | cut -f1)  $made"
    else
      echo "    NO FILE — recorder exited 0 but wrote nothing"
      fail=$((fail+1))
    fi
  else
    echo "    FAILED — see $OUT/$f.log"
    fail=$((fail+1))
  fi
done
echo
echo "$(( ${#FLOWS[@]} - fail ))/${#FLOWS[@]} recorded → $OUT"
