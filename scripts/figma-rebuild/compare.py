"""Side-by-side + diff of a captured state and its Figma rebuild export.

  python3 scripts/figma-rebuild/compare.py <screenshot.png> <figma.png> <out.png>

Prints the share of pixels that differ noticeably (any channel > 40 after a
1px blur on both), which is the number the rebuild sweep tracks per state.
"""
import sys
from PIL import Image, ImageChops, ImageFilter

shot, fig, out = sys.argv[1:4]
a = Image.open(shot).convert("RGB")
b = Image.open(fig).convert("RGB")
if a.size != b.size:
    a = a.resize(b.size, Image.LANCZOS)
d = ImageChops.difference(a.filter(ImageFilter.GaussianBlur(1)), b.filter(ImageFilter.GaussianBlur(1)))
mask = d.convert("L").point(lambda v: 255 if v > 40 else 0)
pct = 100.0 * sum(1 for v in mask.getdata() if v) / (mask.size[0] * mask.size[1])
w, h = b.size
canvas = Image.new("RGB", (w * 3 + 40, h), (255, 255, 255))
canvas.paste(a, (0, 0))
canvas.paste(b, (w + 20, 0))
red = Image.new("RGB", b.size, (230, 40, 40))
over = Image.composite(red, b.point(lambda v: 160 + v // 3), mask)
canvas.paste(over, (2 * w + 40, 0))
canvas.save(out)
print(f"{pct:.2f}% differ")
