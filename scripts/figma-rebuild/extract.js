// DOM -> layout spec, for rebuilding a captured state in Figma out of real
// DS components (scripts/figma-rebuild/README.md).
//
// Runs INSIDE the page (page.evaluate / javascript_tool) on a DEV build of
// apps/brightlocal: the dev build keeps React component names on the fiber
// tree, which is how an element is known to be the root of a DS Button
// rather than a button-shaped div. A production build mangles those names
// and every node comes back as plain geometry.
//
// The spec is geometry first. Every kept node carries its border box in
// viewport pixels, so the Figma side can place things exactly where the
// browser put them, and component identity on top, so it can place a DS
// instance there instead of a drawn rectangle.
//
// Returns { w, h, root } where root is the <body> node.
(() => {
  const VW = window.innerWidth;
  const VH = window.innerHeight;

  // Props worth carrying: the ones that pick a variant or a state. Anything
  // else (handlers, children, classes) is noise the Figma side cannot use.
  const PROP_KEYS = [
    "variant", "size", "side", "align", "orientation", "type", "value", "defaultValue",
    "checked", "defaultChecked", "pressed", "disabled", "open", "isActive", "active",
    "selected", "rating", "max", "level", "placeholder", "asChild", "position", "status",
    "color", "colour", "tone", "label", "name", "icon", "dataHook", "data-state", "kind",
  ];
  const pickProps = (p) => {
    if (!p || typeof p !== "object") return undefined;
    const o = {};
    for (const k of PROP_KEYS) {
      const v = p[k];
      if (v === undefined || v === null) continue;
      if (typeof v === "string") o[k] = v.slice(0, 80);
      else if (typeof v === "number" || typeof v === "boolean") o[k] = v;
    }
    return Object.keys(o).length ? o : undefined;
  };

  const nameOf = (t) => {
    if (!t || typeof t === "string") return null;
    return t.displayName || t.name
      || (t.render && (t.render.displayName || t.render.name))
      || (t.type && (t.type.displayName || t.type.name))
      || null;
  };

  // The composite fibers between this element's host fiber and the next
  // host fiber up: the components whose rendered root this element is.
  // Innermost first, so comps[0] is the most specific (a Slot, say) and the
  // DS component is usually a step or two further out.
  const compsOf = (el) => {
    const k = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
    if (!k) return undefined;
    let f = el[k].return;
    const out = [];
    while (f && typeof f.type !== "string" && f.tag !== 3 && out.length < 12) {
      const n = nameOf(f.type);
      if (n && !/^(Anonymous|_c\d*)$/.test(n)) out.push({ n, p: pickProps(f.memoizedProps) });
      f = f.return;
    }
    return out.length ? out : undefined;
  };

  const px = (v) => (v ? parseFloat(v) || 0 : 0);

  // Every colour leaves as rgb()/rgba(). Tailwind v4 opacity modifiers
  // compute to oklab(... / a), and the Figma side only parses rgb, so a
  // bg-black/50 scrim vanished (1 Oct). A 1px canvas resolves any CSS colour
  // the browser can paint.
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const colorCache = {};
  const rgba = (c) => {
    if (!c || /^rgba?\(/.test(c) || c === "none" || c === "transparent" || /^url/.test(c)) return c;
    if (colorCache[c]) return colorCache[c];
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "rgba(0,0,0,0)";
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
    return (colorCache[c] = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`);
  };
  const COLOR_FN = /(oklab|oklch|lab|lch|hsla?|hwb|color)\([^()]*\)/g;
  const fixColors = (str) => (str ? str.replace(COLOR_FN, (m) => rgba(m)) : str);
  const transparent = (c) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);
  const r1 = (n) => Math.round(n * 10) / 10;
  const rect = (r) => ({ x: r1(r.left), y: r1(r.top), w: r1(r.width), h: r1(r.height) });

  // A clip rect is the intersection of every overflow-clipping ancestor.
  const intersect = (a, b) => {
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
    return { x, y, w: Math.max(0, x2 - x), h: Math.max(0, y2 - y) };
  };

  const rotationOf = (cs) => {
    const t = cs.transform;
    if (!t || t === "none") return 0;
    const m = t.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const [a, b] = m[1].split(",").map(parseFloat);
    return Math.round((Math.atan2(b, a) * 180) / Math.PI);
  };

  // The family the browser actually RENDERED, not the first one asked for:
  // the Showcase widget asks for "Slabo 27px", the web font is not loaded in
  // the capture, and the shot shows the serif fallback. A family counts as
  // present when it changes the measured width against two different
  // generics. Generics map to what Chrome on macOS draws.
  const famCache = {};
  const GENERIC = { serif: "Times New Roman", "sans-serif": "Helvetica", monospace: "Courier New", "system-ui": "Inter", "ui-sans-serif": "Inter", "-apple-system": "Inter", "ui-monospace": "Menlo", cursive: "Apple Chancery", fantasy: "Papyrus" };
  const SAMPLE = "mmmmmmmmmmlli1WQ@#";
  const widthIn = (stack) => { cx.font = `72px ${stack}`; return cx.measureText(SAMPLE).width; };
  const renderedFamily = (stack) => {
    if (famCache[stack]) return famCache[stack];
    const fams = stack.split(",").map((f) => f.replace(/["']/g, "").trim()).filter(Boolean);
    let out = "Inter";
    for (const f of fams) {
      if (GENERIC[f]) { out = GENERIC[f]; break; }
      if (/^inter$/i.test(f)) { out = "Inter"; break; }
      const q = `"${f}"`;
      if (widthIn(`${q}, monospace`) !== widthIn("monospace") || widthIn(`${q}, serif`) !== widthIn("serif")) { out = f; break; }
    }
    return (famCache[stack] = out);
  };

  const fontOf = (cs) => ({
    family: renderedFamily(cs.fontFamily),
    size: px(cs.fontSize),
    weight: parseInt(cs.fontWeight, 10) || 400,
    lh: cs.lineHeight === "normal" ? null : px(cs.lineHeight),
    ls: cs.letterSpacing === "normal" ? 0 : px(cs.letterSpacing),
    color: rgba(cs.color),
    align: cs.textAlign,
    transform: cs.textTransform !== "none" ? cs.textTransform : undefined,
    decoration: /underline|line-through/.test(cs.textDecorationLine) ? cs.textDecorationLine : undefined,
    italic: cs.fontStyle === "italic" || undefined,
    nowrap: cs.whiteSpace === "nowrap" || cs.whiteSpace === "pre" || undefined,
    ellipsis: cs.textOverflow === "ellipsis" || undefined,
    tabular: /tabular-nums/.test(cs.fontVariantNumeric) || undefined,
    clamp: cs.webkitLineClamp && cs.webkitLineClamp !== "none" ? parseInt(cs.webkitLineClamp, 10) : undefined,
  });

  const visualOf = (el, cs) => {
    const v = {};
    const bgc = rgba(cs.backgroundColor);
    if (!transparent(bgc)) v.bg = bgc;
    if (cs.backgroundImage && cs.backgroundImage !== "none") v.bgImage = fixColors(cs.backgroundImage).slice(0, 600);
    const sides = ["Top", "Right", "Bottom", "Left"].map((s) => ({
      w: cs[`border${s}Style`] === "none" ? 0 : px(cs[`border${s}Width`]),
      c: rgba(cs[`border${s}Color`]),
    }));
    if (sides.some((s) => s.w > 0 && !transparent(s.c))) v.border = sides.map((s) => (s.w > 0 && !transparent(s.c) ? s : { w: 0 }));
    const rad = ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map((c) => px(cs[`border${c}Radius`]));
    if (rad.some((r) => r > 0)) v.radius = rad;
    if (cs.boxShadow && cs.boxShadow !== "none") v.shadow = fixColors(cs.boxShadow);
    if (cs.outlineStyle !== "none" && px(cs.outlineWidth) > 0 && !transparent(cs.outlineColor)) v.outline = { w: px(cs.outlineWidth), c: rgba(cs.outlineColor), o: px(cs.outlineOffset) };
    const op = parseFloat(cs.opacity);
    if (op < 1) v.opacity = op;
    return Object.keys(v).length ? v : undefined;
  };

  const clips = (cs) => ["hidden", "clip", "auto", "scroll"].includes(cs.overflowX) || ["hidden", "clip", "auto", "scroll"].includes(cs.overflowY);

  // SVG: keep the markup with currentColor resolved, so createNodeFromSvg
  // draws what the browser drew. A Lucide icon also carries its name, which
  // maps one to one onto the library's `Icon / <Name>` components.
  const svgOf = (el, cs) => {
    // Computed paint wins over attributes (a Tailwind fill-yellow-400 class
    // beats fill="none"), so write every part's computed fill / stroke /
    // stroke-width / opacity back onto the clone as attributes, which is all
    // createNodeFromSvg reads.
    const clone = el.cloneNode(true);
    const paint = (src, dst) => {
      if (src.nodeType !== 1 || dst.nodeType !== 1) return;
      const c = getComputedStyle(src);
      if (c.display === "none") { dst.setAttribute("display", "none"); return; }
      const fill = rgba(c.fill), stroke = rgba(c.stroke);
      if (fill) dst.setAttribute("fill", /^url/.test(fill) ? (src.getAttribute("fill") || fill) : fill);
      if (stroke) dst.setAttribute("stroke", /^url/.test(stroke) ? (src.getAttribute("stroke") || stroke) : stroke);
      if (c.strokeWidth && stroke && stroke !== "none") dst.setAttribute("stroke-width", parseFloat(c.strokeWidth));
      if (c.fillOpacity && c.fillOpacity !== "1") dst.setAttribute("fill-opacity", c.fillOpacity);
      if (c.strokeOpacity && c.strokeOpacity !== "1") dst.setAttribute("stroke-opacity", c.strokeOpacity);
      if (c.opacity && c.opacity !== "1") dst.setAttribute("opacity", c.opacity);
      if (src.tagName.toLowerCase() === "stop" && c.stopColor) dst.setAttribute("stop-color", rgba(c.stopColor));
      const sk = [...src.children], dk = [...dst.children];
      for (let i = 0; i < sk.length && i < dk.length; i += 1) paint(sk[i], dk[i]);
    };
    paint(el, clone);
    const b = el.getBoundingClientRect();
    clone.setAttribute("width", b.width);
    clone.setAttribute("height", b.height);
    clone.removeAttribute("class");
    clone.removeAttribute("style");
    const cls = el.getAttribute("class") || "";
    const lucide = (cls.match(/lucide-([a-z0-9-]+)/g) || []).map((c) => c.slice(7)).filter((c) => c !== "icon");
    // The colour an Icon instance should take: the first painted part.
    const first = el.querySelector("path, circle, rect, line, polyline, polygon, ellipse") || el;
    const fc = getComputedStyle(first);
    let markup = clone.outerHTML;
    if (markup.length > 600000) markup = null; // charts run to ~200k; past this, draw nothing rather than stall the plugin
    return { markup, lucide: lucide[0], stroke: fc.stroke !== "none" ? rgba(fc.stroke) : null, fill: fc.fill !== "none" ? rgba(fc.fill) : null, strokeWidth: parseFloat(fc.strokeWidth) || null };
  };

  const textRuns = (el, clip) => {
    const runs = [];
    for (const n of el.childNodes) {
      if (n.nodeType !== 3) continue;
      const s = n.textContent;
      if (!s || !s.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      if (!rects.length) continue;
      const b = range.getBoundingClientRect();
      const box = rect(b);
      if (!intersect(box, clip).w) continue;
      const vis = intersect(box, clip);
      // pre / pre-line / pre-wrap keep their line breaks (the email preview's
      // "Hi Sophie,\n\nThank you..."); everything else collapses like HTML.
      const pre = /^(pre|pre-line|pre-wrap|break-spaces)$/.test(getComputedStyle(el).whiteSpace);
      const txt = pre ? s.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n") : s.replace(/\s+/g, " ");
      const run = { t: txt, box, lines: rects.length, o: seq.get(n) };
      if (vis.w < box.w - 1 || vis.h < box.h - 1) run.vis = vis;
      runs.push(run);
    }
    return runs;
  };

  // document order of every text node, so a paragraph split across inline
  // elements is reassembled in reading order, not by position (a run that
  // wraps two lines starts at the left edge, before a bold date on line 1)
  const seq = new Map();
  { const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let i = 0; while (tw.nextNode()) seq.set(tw.currentNode, i++); }

  let count = 0;
  const walk = (el, clip) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.contentVisibility === "hidden") return null;
    if (parseFloat(cs.opacity) === 0) return null;
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "noscript", "template", "nextjs-portal", "link", "meta"].includes(tag)) return null;
    const b = el.getBoundingClientRect();
    const box = rect(b);
    const vis = intersect(box, clip);
    // sr-only text: a 1px box that clips. A 0x0 box that does NOT clip is a
    // layout wrapper whose children paint outside it (Recharts puts one
    // between ResponsiveContainer and the chart), so it is walked.
    const tiny = b.width <= 1 && b.height <= 1;
    const sr = (tiny && (clips(cs) || cs.clip !== "auto")) || (cs.position === "absolute" && cs.clip === "rect(0px, 0px, 0px, 0px)");
    if (sr) return null;

    const node = { tag, box };
    const comps = compsOf(el);
    if (comps) node.comps = comps;
    const hook = el.getAttribute("data-hook");
    if (hook) node.hook = hook;
    const slot = el.getAttribute("data-slot");
    if (slot) node.slot = slot;
    const st = el.getAttribute("data-state");
    if (st) node.state = st;
    if (el.getAttribute("aria-checked")) node.checked = el.getAttribute("aria-checked");
    if (el.getAttribute("aria-selected")) node.selectedAttr = el.getAttribute("aria-selected");
    if (el.disabled || el.getAttribute("aria-disabled") === "true" || el.hasAttribute("data-disabled")) node.disabled = true;
    const v = visualOf(el, cs);
    if (v) node.v = v;
    const rot = rotationOf(cs);
    if (rot) node.rot = rot;
    if (cs.position === "fixed" || cs.position === "sticky") node.pos = cs.position;
    const z = parseInt(cs.zIndex, 10);
    if (!Number.isNaN(z)) node.z = z;

    if (tag === "svg") {
      if (!vis.w || !vis.h) return null;
      node.svg = svgOf(el, cs);
      count += 1;
      return node;
    }
    if (tag === "img") {
      if (!vis.w || !vis.h) return null;
      node.img = { src: el.currentSrc || el.src, fit: cs.objectFit };
      count += 1;
      return node;
    }
    if (tag === "input" || tag === "textarea") {
      node.input = { value: el.value, placeholder: el.getAttribute("placeholder") || "", type: el.type, font: fontOf(cs), ph: rgba(getComputedStyle(el, "::placeholder").color), pad: [px(cs.paddingTop) + px(cs.borderTopWidth), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft) + px(cs.borderLeftWidth)] };
    }
    if (tag === "canvas") node.canvas = true;
    // list markers are ::marker, which no DOM walk sees: record "1." / "•"
    if (cs.display === "list-item" && cs.listStyleType !== "none") {
      const sibs = [...el.parentElement.children].filter((x) => getComputedStyle(x).display === "list-item");
      const i = sibs.indexOf(el) + 1;
      const t = /decimal/.test(cs.listStyleType) ? `${i}.` : /disc/.test(cs.listStyleType) ? "•" : /circle/.test(cs.listStyleType) ? "◦" : "–";
      node.marker = { t, inside: cs.listStylePosition === "inside" };
    }

    const clipsHere = clips(cs);
    if (clipsHere) node.clip = true;
    const childClip = clipsHere ? intersect(clip, box) : clip;

    const runs = textRuns(el, childClip);
    if (runs.length) {
      node.text = runs; node.font = fontOf(cs);
      // Inside a CSS-scaled thumbnail (the campaign and showcase mini
      // previews) the box is scaled but computed font sizes are not.
      const ow = el.offsetWidth;
      if (ow > 0) { const sc = Math.round((b.width / ow) * 1000) / 1000; if (Math.abs(sc - 1) > 0.02) node.font.scale = sc; }
    }

    const kids = [];
    for (const c of el.children) {
      const k = walk(c, childClip);
      if (!k) continue;
      if (Array.isArray(k)) kids.push(...k); else kids.push(k);
    }
    // Pseudo-elements that paint (a ::before dot, an ::after rule).
    for (const pe of ["::before", "::after"]) {
      const pcs = getComputedStyle(el, pe);
      if (pcs.content && pcs.content !== "none" && pcs.content !== "normal") {
        const pv = visualOf(el, pcs);
        const txt = pcs.content.replace(/^["']|["']$/g, "");
        if (pv || (txt && txt !== '""' && txt.trim())) node[pe === "::before" ? "before" : "after"] = { v: pv, t: txt.trim() || undefined, w: px(pcs.width), h: px(pcs.height), font: fontOf(pcs) };
      }
    }
    if (kids.length) node.kids = kids;

    // Off-screen and fully clipped: drop it, keep nothing.
    if (!vis.w || !vis.h) {
      if (!kids.length) return null;
    }
    // A wrapper that paints nothing, clips nothing and is no component just
    // hands its children up: the Figma tree stays shallow and every kept
    // node means something.
    // Layout, for the auto-layout masters (build.js ignores it in the
    // geometric rebuild). Flex/grid containers with two or more children are
    // kept even when they paint nothing, because they ARE the structure.
    const disp = cs.display;
    if (/flex|grid/.test(disp) && kids.length >= 2) {
      node.lay = {
        d: /grid/.test(disp) ? "grid" : "flex",
        dir: cs.flexDirection,
        gap: [px(cs.rowGap), px(cs.columnGap)],
        pad: [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)],
        jc: cs.justifyContent, ai: cs.alignItems, wrap: cs.flexWrap !== "nowrap" || undefined,
        cols: /grid/.test(disp) ? cs.gridTemplateColumns.split(" ").length : undefined,
      };
    } else if (kids.length >= 2 && disp === "block") {
      node.lay = { d: "block", pad: [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)] };
    }
    const grow = parseFloat(cs.flexGrow);
    if (grow > 0) node.grow = grow;
    if (cs.alignSelf && cs.alignSelf !== "auto") node.as = cs.alignSelf;
    if (cs.position === "absolute") node.pos = "absolute";
    const meaningful = node.v || node.comps || node.clip || node.text || node.input || node.before || node.after || node.hook || node.rot || node.pos || (node.lay && node.lay.d !== "block");
    if (!meaningful) return kids.length ? kids : null;
    count += 1;
    return node;
  };

  const root = walk(document.body, { x: 0, y: 0, w: VW, h: VH });
  return { w: VW, h: VH, url: location.pathname + location.search, count, root: Array.isArray(root) ? { tag: "body", box: { x: 0, y: 0, w: VW, h: VH }, kids: root } : root };
})()
