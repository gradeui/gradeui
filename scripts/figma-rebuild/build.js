// Spec -> Figma, out of real DS library components (scripts/figma-rebuild/README.md).
//
// Runs INSIDE the Figma plugin sandbox: a figma_execute call fetches this
// file from serve.mjs and evals it. The value of the file is a factory:
//
//   const B = eval(await (await fetch("http://localhost:9228/builder.js")).text());
//   const api = await B({ base: "http://localhost:9228" });
//   await api.build("specs/manager-01-list.json", { page: "DS · Review Manager", x: 0, y: 0 });
//
// Placement is GEOMETRIC: every node lands at the border box the browser
// gave it, so the rebuild lines up with the screenshot by construction.
// Identity is LAYERED ON TOP: where the React tree says a node is the root
// of a DS component (Button, Badge, Card, Tabs trigger...), a real library
// instance goes there instead of drawn rectangles, set to the variant and
// copy the code used. Cards and sheets take their contents through the
// component's own SLOT, built loose first (a node inside a slot inside an
// instance stops being reachable, docs/FIGMA-BRIDGE-COMPONENTS.md).
(async (cfg) => {
  const BASE = cfg.base || "http://localhost:9228";
  const REG_KEY = "dsRebuildReg";

  // ── library registry ──────────────────────────────────────────────────
  // name -> [kind, key]. SET keys import the whole set; CMP keys one node.
  // Keys read from the live library through instances in BrightLocal's
  // Deliverables file (1 Oct 2026), not from the 28 Aug keys dump.
  const LIB = {
    Button: ["SET", "8e33dcb77c1c15d25eb1ac46c99e61cf70b81829"],
    Badge: ["SET", "5c75da4590351a2d1e25391c4ac03bf8e2d27e8d"],
    BadgeNumber: ["SET", "5a4a59604364b53ec0dc0f121057496368d1a2cf"],
    Card: ["SET", "2e1b50dd6bc1b825057b4c12a517830f3b53d7d0"],
    TabsTrigger: ["SET", "2d8176f7fd6710a4c51f07994afb3638dd31f6df"],
    Avatar: ["SET", "f20ce5cb0f0c3acf077996f8f7e4ec7190a136da"],
    Separator: ["SET", "8ae438c592de4d0ce9e23f17edeb03ad924ff8d5"],
    Checkbox: ["SET", "0b4b5a8ea23a621cd22ec858cf6c4cc30bc01522"],
    Switch: ["SET", "4b8748dceac66a16cb2fd9176cb1267256a51be9"],
    Input: ["SET", "549f27cf9297db49200573fe5f8be6ce62ef779d"],
    Select: ["SET", "18620c150b5dbe9cdb898599aed7d339c2ecfc5d"],
    Textarea: ["SET", "3109289adb50aa37951b594bc4dffaa7c7335809"],
    PaginationItem: ["SET", "8c36a5c43d792a6291d8ebd853b9cfca2bc7533e"],
    BreadcrumbItem: ["SET", "f25a49fab262587d23385b349ca6fda0345615c5"],
    SidebarMenuButton: ["SET", "4ca0a21ab311e95282e309c455da099b983889d5"],
    SidebarMenuSubItem: ["SET", "d4e110539239d8f88f0dc791d3b8a9811a450654"],
    Logo: ["SET", "887f23b624ba23adf3a8df877b6049c8932c77e8"],
    SocialIcon: ["SET", "5e432c15a0ff6ef777e5f0264943abd384899c9d"],
    Sheet: ["SET", "6589bd20bea574379295f508be00c8c4fc65e95c"],
    Dialog: ["SET", "9e758d15a8db10e25749650223cd97680e97a28e"],
    AlertDialog: ["SET", "6bfaace7ac33d5666bc2238e9bc20e98c004509c"],
    Progress: ["SET", "9737e63f469982f2ca8bd49fd432b350e80a3c56"],
    Alert: ["SET", "554c7cfc95a06b87fc36c1fbbecb211dbec6c3e3"],
    Tooltip: ["SET", "44be25a8fcc096b35c2d79b2213df56cfd632912"],
    RadioItem: ["SET", "ef99cbad03f10cdd6435807a352faea1df58dc6c"],
    CommandItem: ["SET", "f9c4c71836d05b36319220d90065384963ff5e0b"],
    DropdownItem: ["SET", "ce33b99fecc0379301e249c34596ef0af7d82716"],
    SelectItem: ["SET", "949934af9e7ba0052724caa8e547695266c19091"],
    TableCell: ["SET", "5558c0d15e48dfd0be026252a9abe81ef97112c4"],
    TableHead: ["SET", "20b03983553f3028e4c33ec151fb1ca9abb1e9ee"],
    Toggle: ["SET", "946d46bd331f1074ebfeb428f9fb4b89aee33d10"],
    Chip: ["SET", "64dce4c841ac44d639d7fbf810b2a074336876b8"],
    Skeleton: ["SET", "a9f783cab0da65e68d24e30f95e187b1baf011a3"],
    EmptyState: ["SET", "80015e0333f4eb144e8b8ca01fe77b74f453bc5a"],
  };

  const reg = (() => { try { return JSON.parse(figma.root.getPluginData(REG_KEY) || "{}"); } catch { return {}; } })();
  const saveReg = () => figma.root.setPluginData(REG_KEY, JSON.stringify(reg));
  const nodeCache = {};
  const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

  async function lib(name) {
    if (nodeCache[name] !== undefined) return nodeCache[name];
    let node = null;
    if (reg[name]) node = await figma.getNodeByIdAsync(reg[name]).catch(() => null);
    if (!node && LIB[name] && !cfg.noImport) {
      const [kind, key] = LIB[name];
      try {
        node = await timeout(kind === "SET" ? figma.importComponentSetByKeyAsync(key) : figma.importComponentByKeyAsync(key), cfg.importMs || 6000);
        reg[name] = node.id; saveReg();
      } catch (e) { node = null; }
    }
    if (!node) node = await nested(NESTED_NAMES[name] || name);
    nodeCache[name] = node;
    return node;
  }

  // Route 3 (docs/FIGMA-BRIDGE-COMPONENTS.md): a component that is nested
  // inside a pinned library instance can be reached through it without a
  // download. The pinned holder lives on the "DS rebuild · library" page.
  const NESTED_NAMES = { BadgeNumber: "Badge Number", BreadcrumbItem: "Breadcrumb / BreadcrumbItem", CardTitle: "Card Title", CardDescription: "Card Description", CardHeader: "Card Header" };
  let nestedIndex = null;
  async function nested(setName) {
    if (!nestedIndex) {
      nestedIndex = {};
      const page = figma.root.children.find((p) => p.name === "DS rebuild · library");
      if (page) {
        await page.loadAsync();
        for (const inst of page.findAllWithCriteria({ types: ["INSTANCE"] })) {
          let m; try { m = await inst.getMainComponentAsync(); } catch (e) { continue; }
          if (!m) continue;
          const set = m.parent && m.parent.type === "COMPONENT_SET" ? m.parent : m;
          if (!nestedIndex[set.name]) nestedIndex[set.name] = set;
        }
      }
    }
    return nestedIndex[setName] || null;
  }

  // Icons: `Icon / <PascalName>` in the library. Keys come from icons.json
  // (served, generated from docs/figma-library-keys.tsv).
  let ICON_KEYS = null;
  async function icon(lucide) {
    if (!lucide) return null;
    const pascal = /[A-Z]/.test(lucide[0]) ? lucide : lucide.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
    const cacheName = "Icon/" + pascal;
    if (nodeCache[cacheName] !== undefined) return nodeCache[cacheName];
    if (!ICON_KEYS) ICON_KEYS = await (await fetch(`${BASE}/lib/icons.json`)).json();
    const alias = { House: "Home", ChartLine: "LineChart", ChartColumn: "BarChart3", CircleCheckBig: "CheckCircle", TriangleAlert: "AlertTriangle", CircleAlert: "AlertCircle", Ellipsis: "MoreHorizontal", EllipsisVertical: "MoreVertical" };
    const key = ICON_KEYS[pascal] || ICON_KEYS[alias[pascal]];
    let node = await nested("Icon / " + pascal) || await nested("Icon / " + (alias[pascal] || ""));
    if (reg[cacheName] && !node) node = await figma.getNodeByIdAsync(reg[cacheName]).catch(() => null);
    if (!node && key && !cfg.noImport) {
      try {
        node = await timeout(figma.importComponentByKeyAsync(key), cfg.importMs || 6000);
        reg[cacheName] = node.id; saveReg();
        // pin it, or the import is garbage-collected once nothing uses it
        const lp = figma.root.children.find((p) => p.name === "DS rebuild · library");
        if (lp) await lp.loadAsync();
        const holder = lp && lp.children.find((x) => x.name === "pinned library components");
        if (holder) { const i = node.createInstance(); i.name = "pin · Icon/" + pascal; holder.appendChild(i); }
      } catch (e) { node = null; }
    }
    nodeCache[cacheName] = node;
    return node;
  }

  // ── paint helpers ─────────────────────────────────────────────────────
  const parseColor = (s) => {
    if (!s) return null;
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a: p.length > 3 ? p[3] : 1 };
  };
  const solid = (s) => {
    const c = parseColor(s);
    if (!c || c.a === 0) return null;
    return { type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a };
  };
  const splitTop = (s) => {
    const out = []; let depth = 0, cur = "";
    for (const ch of s) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  const shadows = (s) => {
    if (!s) return [];
    return splitTop(s).map((part) => {
      const col = (part.match(/rgba?\([^)]+\)/) || [])[0];
      const nums = part.replace(col || "", "").match(/-?[\d.]+px|-?[\d.]+(?=\s|$)/g) || [];
      const [x, y, blur, spread] = nums.map((n) => parseFloat(n) || 0);
      const c = parseColor(col);
      if (!c || c.a === 0) return null;
      return { type: /inset/.test(part) ? "INNER_SHADOW" : "DROP_SHADOW", color: { r: c.r, g: c.g, b: c.b, a: c.a }, offset: { x: x || 0, y: y || 0 }, radius: blur || 0, spread: spread || 0, visible: true, blendMode: "NORMAL" };
    }).filter(Boolean);
  };
  const gradient = (s, w, h) => {
    const m = s && s.match(/linear-gradient\((.*)\)$/);
    if (!m) return null;
    const parts = splitTop(m[1]);
    let angle = 180;
    if (/deg/.test(parts[0])) angle = parseFloat(parts.shift());
    else if (/^to /.test(parts[0])) { const d = parts.shift(); angle = { "to bottom": 180, "to top": 0, "to right": 90, "to left": 270 }[d] ?? 180; }
    const stops = parts.map((p, i) => {
      const col = (p.match(/rgba?\([^)]+\)/) || [])[0];
      const pos = (p.match(/([\d.]+)%/) || [])[1];
      const c = parseColor(col) || { r: 0, g: 0, b: 0, a: 0 };
      return { color: { r: c.r, g: c.g, b: c.b, a: c.a }, position: pos !== undefined ? parseFloat(pos) / 100 : i / Math.max(1, parts.length - 1) };
    });
    const rad = ((angle - 90) * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    return { type: "GRADIENT_LINEAR", gradientStops: stops, gradientTransform: [[cos, sin, 0.5 - cos / 2 - sin / 2], [-sin, cos, 0.5 + sin / 2 - cos / 2]] };
  };

  // ── fonts ─────────────────────────────────────────────────────────────
  const loaded = new Set();
  const styleFor = (w, italic) => {
    const base = w >= 700 ? "Bold" : w >= 600 ? "Semi Bold" : w >= 500 ? "Medium" : "Regular";
    if (!italic) return base;
    return base === "Regular" ? "Italic" : base + " Italic";
  };
  // Fonts: Inter for the product; other families (the Showcase widget's
  // Slabo 27px, Poppins...) only when this machine has them, at the nearest
  // style it really has. A missing family or style makes Figma try to fetch
  // it, and with library downloads stalled that fetch never returns, so
  // every load also races a timeout and falls back to Inter.
  let AVAIL = null;
  const WEIGHT = { Thin: 100, "Extra Light": 200, ExtraLight: 200, Light: 300, Regular: 400, Medium: 500, "Semi Bold": 600, SemiBold: 600, Bold: 700, "Extra Bold": 800, ExtraBold: 800, Black: 900 };
  async function font(family, style) {
    const fam = !family || /inter/i.test(family) || /^(ui-|system-ui|sans-serif|-apple)/.test(family) ? "Inter" : family;
    if (!AVAIL) {
      AVAIL = {};
      for (const f of await figma.listAvailableFontsAsync()) (AVAIL[f.fontName.family] ||= []).push(f.fontName.style);
    }
    let fn = { family: "Inter", style };
    if (fam !== "Inter" && AVAIL[fam]) {
      const styles = AVAIL[fam];
      const italic = /Italic/.test(style);
      const want = WEIGHT[style.replace(/ ?Italic$/, "")] || 400;
      const cands = styles.filter((st) => /Italic/.test(st) === italic);
      const pick = (cands.length ? cands : styles).map((st) => [Math.abs((WEIGHT[st.replace(/ ?Italic$/, "")] || 400) - want), st]).sort((x, y) => x[0] - y[0])[0];
      if (pick) fn = { family: fam, style: pick[1] };
    }
    const k = fn.family + "|" + fn.style;
    if (loaded.has(k)) return fn;
    const ok = await Promise.race([figma.loadFontAsync(fn).then(() => true), new Promise((r) => setTimeout(() => r(false), 3000))]).catch(() => false);
    if (ok) { loaded.add(k); return fn; }
    const inter = { family: "Inter", style: WEIGHT[style] ? style : "Regular" };
    await figma.loadFontAsync(inter); loaded.add(inter.family + "|" + inter.style);
    return inter;
  }

  // ── node makers ───────────────────────────────────────────────────────
  // In AUTO mode (masters) the parent is an auto-layout frame: appending is
  // placing, and x/y are ignored by the layout.
  let AUTO = false;
  const place = (node, parent, box, ox, oy) => {
    parent.appendChild(node);
    if (AUTO && parent.layoutMode && parent.layoutMode !== "NONE") return;
    node.x = box.x - ox;
    node.y = box.y - oy;
  };

  const applyVisual = (f, v, box) => {
    if (!v) { f.fills = []; return; }
    const fills = [];
    if (v.bg) { const p = solid(v.bg); if (p) fills.push(p); }
    if (v.bgImage) { const g = gradient(v.bgImage, box.w, box.h); if (g) fills.push(g); }
    f.fills = fills;
    if (v.border) {
      const s = v.border.find((b) => b.w > 0);
      const p = s && solid(s.c);
      if (p) {
        f.strokes = [p];
        f.strokeAlign = "INSIDE";
        const [t, r, b, l] = v.border.map((x) => x.w || 0);
        if (t === r && r === b && b === l) f.strokeWeight = t;
        else { f.strokeTopWeight = t; f.strokeRightWeight = r; f.strokeBottomWeight = b; f.strokeLeftWeight = l; }
      }
    }
    if (v.radius) {
      const [tl, tr, br, bl] = v.radius.map((r) => Math.min(r, box.w / 2, box.h / 2));
      f.topLeftRadius = tl; f.topRightRadius = tr; f.bottomRightRadius = br; f.bottomLeftRadius = bl;
    }
    const fx = shadows(v.shadow);
    if (v.outline) { const c = parseColor(v.outline.c); if (c) fx.push({ type: "DROP_SHADOW", color: { r: c.r, g: c.g, b: c.b, a: c.a }, offset: { x: 0, y: 0 }, radius: 0, spread: v.outline.w + (v.outline.o || 0), visible: true, blendMode: "NORMAL" }); }
    if (fx.length) f.effects = fx;
    if (v.opacity !== undefined) f.opacity = v.opacity;
  };

  async function makeText(run, fontSpec, parent, ox, oy, nameHint) {
    const t = figma.createText();
    const fs0 = fontSpec || {};
    const k = fs0.scale || 1;
    const fs = k === 1 ? fs0 : Object.assign({}, fs0, { size: (fs0.size || 14) * k, lh: fs0.lh ? fs0.lh * k : null, ls: (fs0.ls || 0) * k });
    t.fontName = await font(fs.family, styleFor(fs.weight || 400, fs.italic));
    t.fontSize = fs.size || 14;
    const lh = fs.lh || Math.round((fs.size || 14) * 1.2);
    t.lineHeight = { unit: "PIXELS", value: lh };
    if (fs.ls) t.letterSpacing = { unit: "PIXELS", value: fs.ls };
    if (fs.transform === "uppercase") t.textCase = "UPPER";
    if (fs.transform === "lowercase") t.textCase = "LOWER";
    if (fs.transform === "capitalize") t.textCase = "TITLE";
    if (fs.decoration && /underline/.test(fs.decoration)) t.textDecoration = "UNDERLINE";
    if (fs.decoration && /line-through/.test(fs.decoration)) t.textDecoration = "STRIKETHROUGH";
    const p = solid(fs.color);
    t.fills = p ? [p] : [];
    let txt = run.t.replace(/^\s+|\s+$/g, "");
    // nowrap text is one line whatever getClientRects said
    if (fs.nowrap && !/\n/.test(txt)) run = Object.assign({}, run, { lines: 1 });
    t.characters = txt || " ";
    t.name = nameHint || txt.slice(0, 40);
    const box = run.box;
    // Inline boxes are the font's content area, not the line box: centre
    // the Figma line box on it.
    const lines = Math.max(1, run.lines || 1);
    const contentH = Math.max(1, box.h - (lines - 1) * lh);
    const dy = (lh - contentH) / 2;
    if (lines <= 1) {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
      parent.appendChild(t);
      t.x = box.x - ox;
      // keep right/centre alignment honest when Figma's advance widths drift
      if (fs.align === "right" || fs.align === "end") t.x = box.x + box.w - t.width - ox;
      else if (fs.align === "center") t.x = box.x + box.w / 2 - t.width / 2 - ox;
    } else {
      t.textAutoResize = "HEIGHT";
      // Figma's Inter runs ~1% wider than Chrome's: without slack a wrapped
      // line breaks a word early
      const w = Math.max(1, box.w * 1.015 + 2);
      t.resize(w, t.height);
      t.textAlignHorizontal = fs.align === "center" ? "CENTER" : fs.align === "right" || fs.align === "end" ? "RIGHT" : "LEFT";
      parent.appendChild(t);
      t.x = (fs.align === "center" ? box.x + box.w / 2 - w / 2 : fs.align === "right" || fs.align === "end" ? box.x + box.w - w : box.x) - ox;
    }
    t.y = box.y - dy - oy;
    // Truncated in the browser: an ellipsis on one line, or a line clamp.
    // The run's box is the FULL text; vis is what the cell let through.
    if (fs.clamp && lines > fs.clamp) {
      try { t.textAutoResize = "HEIGHT"; t.resize(Math.max(1, box.w + 1), t.height); t.textTruncation = "ENDING"; t.maxLines = fs.clamp; } catch {}
    } else if (run.vis && (fs.ellipsis || fs.nowrap) && run.vis.w < box.w - 1) {
      // clipped one-liner: the ellipsis usually lives on an ancestor cell
      try { t.textAutoResize = "NONE"; t.resize(Math.max(1, run.vis.w), lh); t.textTruncation = "ENDING"; t.x = run.vis.x - ox; } catch {}
    }
    return t;
  }

  async function makeSvg(n, parent, ox, oy) {
    const s = n.svg || {};
    const color = s.stroke || s.fill || (s.markup && (s.markup.match(/stroke="(rgb[^"]+)"/) || s.markup.match(/fill="(rgb[^"]+)"/) || [])[1]) || null;
    // Lucide React components are named for the icon (Star, ChevronDown),
    // so an svg with no lucide-* class can still be matched by its fiber.
    if (!ICON_KEYS) ICON_KEYS = await (await fetch(`${BASE}/lib/icons.json`)).json();
    const byComp = !s.lucide && n.comps && n.comps.map((c) => c.n).find((nm) => ICON_KEYS[nm]);
    const ic = s.lucide ? await icon(s.lucide) : byComp ? await icon(byComp) : null;
    let node;
    // Review-site marks: the DS Social Media Icon, picked by brand colour
    // (the app's SourceMark components are minified to one letter).
    let social = null;
    if (n.comps && n.comps.some((c) => /SourceMark|Mark$/.test(c.n)) && s.markup) {
      const m = s.markup;
      const has = (r, g, b) => m.includes(`rgb(${r}, ${g}, ${b})`);
      social = has(66, 133, 244) || has(234, 67, 53) ? "Google" : has(8, 102, 255) || has(24, 119, 242) ? "Facebook" : has(255, 26, 26) || has(211, 35, 35) || has(212, 41, 37) ? "Yelp" : /apple/i.test(n.comps.map((c) => c.n).join()) ? "Apple" : null;
    }
    const sset = social ? await lib("SocialIcon") : null;
    if (sset) {
      const v = variantOf(sset, { Name: social, Colors: "Original" });
      node = v.createInstance();
      node.resize(n.box.w, n.box.h);
      node.name = `Social Media Icon · ${social}`;
      place(node, parent, n.box, ox, oy);
      return node;
    }
    if (ic) {
      node = ic.createInstance();
      node.resize(n.box.w, n.box.h);
      const paint = solid(color);
      if (paint) for (const v of node.findAll((x) => x.type === "VECTOR" || x.type === "BOOLEAN_OPERATION")) {
        if (v.strokes && v.strokes.length) v.strokes = [paint];
        if (v.fills && v.fills.length && v.fills.some((f) => f.visible !== false)) v.fills = [paint];
      }
      // a filled icon (a star the code fills) carries fill as well as stroke
      if (s.fill) { const fp = solid(s.fill); if (fp) for (const v of node.findAll((x) => x.type === "VECTOR")) v.fills = [fp]; }
    } else if (s.markup) {
      try { node = figma.createNodeFromSvg(s.markup); } catch (e) { node = figma.createFrame(); node.fills = []; }
      node.resize(Math.max(0.01, n.box.w), Math.max(0.01, n.box.h));
    } else {
      node = figma.createFrame(); node.fills = []; node.resize(Math.max(0.01, n.box.w), Math.max(0.01, n.box.h));
    }
    node.name = s.lucide ? `Icon / ${s.lucide}` : byComp ? `Icon / ${byComp}` : (n.hook || nice(n) || "svg");
    place(node, parent, n.box, ox, oy);
    if (n.rot) {
      const cx = node.x + node.width / 2, cy = node.y + node.height / 2;
      node.rotation = -n.rot;
      const b = node.absoluteBoundingBox, pb = parent.absoluteBoundingBox || { x: 0, y: 0 };
      node.x += cx - ((b.x - pb.x) + b.width / 2);
      node.y += cy - ((b.y - pb.y) + b.height / 2);
    }
    return node;
  }

  const imgCache = {};
  async function makeImg(n, parent, ox, oy) {
    const r = figma.createRectangle();
    r.resize(Math.max(0.01, n.box.w), Math.max(0.01, n.box.h));
    r.name = n.hook || "image";
    try {
      const src = n.img.src;
      let hash = imgCache[src];
      if (!hash) {
        const url = /^data:/.test(src) ? null : `${BASE}/proxy?url=${encodeURIComponent(src)}`;
        if (url) {
          const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
          hash = figma.createImage(buf).hash; imgCache[src] = hash;
        }
      }
      if (hash) r.fills = [{ type: "IMAGE", imageHash: hash, scaleMode: n.img.fit === "contain" ? "FIT" : "FILL" }];
    } catch (e) { r.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }]; }
    if (n.v && n.v.radius) { const [tl, tr, br, bl] = n.v.radius; r.topLeftRadius = tl; r.topRightRadius = tr; r.bottomRightRadius = br; r.bottomLeftRadius = bl; }
    place(r, parent, n.box, ox, oy);
    return r;
  }

  // ── DS instance helpers ───────────────────────────────────────────────
  const allText = (n) => {
    const out = [];
    const w = (x) => { (x.text || []).forEach((r) => out.push(r.t)); if (x.input) out.push(x.input.value || x.input.placeholder); (x.kids || []).forEach(w); };
    w(n);
    return out.join(" ").replace(/\s+/g, " ").trim();
  };
  const firstText = (n) => { let f = null; const w = (x) => { if (f) return; if (x.text && x.text.length) { f = x; return; } (x.kids || []).forEach(w); }; w(n); return f; };
  const svgs = (n) => { const out = []; const w = (x) => { if (x.svg) out.push(x); (x.kids || []).forEach(w); }; w(n); return out; };
  const comp = (n, names) => (n.comps || []).find((c) => names.includes(c.n));
  // A readable layer name: the data-hook, else the nearest component that
  // is not a Radix/React plumbing layer, else the tag.
  const nice = (n) => {
    if (n.hook) return n.hook;
    const c = (n.comps || []).map((x) => x.n).find((nm) => /^[A-Z]/.test(nm) && !/^(Primitive|Slot|Popper|Roving|Focus|Dismissable|Presence|Portal|Collection|Visually|Menu(Anchor|Provider|Content)|.*Provider$|.*Context$|.*Impl$|[A-Z]$)/.test(nm) && !/\./.test(nm));
    return c || null;
  };

  async function setLayerText(inst, layerName, value, fontSpec) {
    const t = inst.findOne((x) => x.type === "TEXT" && (!layerName || x.name === layerName));
    if (!t) return null;
    try {
      // Normalise to static Inter at the same weight. The library's text
      // carries either an empty family (stale import) or Inter with
      // variable-font axis settings, and loading the latter can wait on a
      // download that never comes back (1 Oct 2026). Same glyphs either way.
      const st = fontSpec && fontSpec.weight ? styleFor(fontSpec.weight) : (t.fontName && typeof t.fontName === "object" && t.fontName.style) || "Medium";
      const fn = await font("Inter", st);
      t.fontName = fn;
      t.characters = value;
      if (fontSpec) {
        // the code's type, not the library's (the Figma library predates the
        // DS 3.0.0 type scale in places: sm buttons are 12px there, 14 in code)
        const k = fontSpec.scale || 1;
        if (fontSpec.size) t.fontSize = fontSpec.size * k;
        if (fontSpec.lh) t.lineHeight = { unit: "PIXELS", value: fontSpec.lh * k };
        if (fontSpec.color) { const p = solid(fontSpec.color); if (p) t.fills = [p]; }
      }
    } catch (e) {}
    return t;
  }
  const variantOf = (set, want) => {
    // want: { Axis: value }; picks the child whose name matches the most axes
    let best = null, bestScore = -1;
    for (const c of set.children) {
      const parts = Object.fromEntries(c.name.split(", ").map((p) => p.split("=")));
      let s = 0;
      for (const [k, v] of Object.entries(want)) if (parts[k] === v) s++;
      if (s > bestScore) { best = c; bestScore = s; }
    }
    return best;
  };
  // Swap a DS instance's icon layer to the code's icon. When the library
  // icon cannot be had, the layer goes transparent (it still holds its
  // space, so the label does not shift) and the code's own SVG is queued to
  // be drawn over it once the instance is placed.
  let overlayQueue = [];
  async function iconFor(layer, svgNode) {
    if (!layer || !svgNode) return false;
    const ok = await swapIcon(layer, svgNode.svg.lucide, svgNode.svg.stroke || svgNode.svg.fill);
    if (!ok) { layer.opacity = 0; overlayQueue.push(svgNode); }
    return ok;
  }
  async function flushOverlays(parent, ox, oy) {
    const q = overlayQueue; overlayQueue = [];
    for (const n of q) { if (n.svg) await makeSvg(n, parent, ox, oy); else await render(n, parent, ox, oy); }
  }
  async function swapIcon(slotInst, lucide, color) {
    const ic = await icon(lucide);
    if (!ic || !slotInst) return false;
    try { slotInst.swapComponent(ic); } catch (e) { return false; }
    const paint = solid(color);
    if (paint) for (const v of slotInst.findAll((x) => x.type === "VECTOR")) if (v.strokes && v.strokes.length) v.strokes = [paint];
    return true;
  }

  // Each mapper returns a node it has already PLACED in parent, or null to
  // fall back to the generic drawing.
  let crumbN = 0;
  const crumb = (s) => { crumbN++; if (cfg.trace) figma.root.setPluginData("dsRebuildTrace", crumbN + " " + s); };
  const MAP = [];

  // Button
  MAP.push({
    when: (n) => comp(n, ["Button"]) && /^(button|a)$/.test(n.tag),
    async make(n, parent, ox, oy) {
      const set = await lib("Button"); if (!set) return null;
      const c = comp(n, ["Button"]).p || {};
      const vmap = { default: "Primary", primary: "Primary", secondary: "Secondary", outline: "Outline", ghost: "Ghost", destructive: "Destructive", warning: "Warning", link: "Ghost" };
      const label = allText(n);
      const icons = svgs(n);
      const size = !label ? "icon" : ({ sm: "sm", lg: "lg", icon: "icon", "icon-sm": "icon", "icon-lg": "icon" }[c.size] || "default");
      const v = variantOf(set, { Variant: vmap[c.variant] || "Primary", State: n.disabled ? "Disabled" : "Default", Size: size });
      crumb("btn:create"); const inst = v.createInstance();
      inst.name = `Button · ${label || (icons[0] && icons[0].svg.lucide) || "icon"}`;
      const iconLayers = inst.children.filter((x) => x.type === "INSTANCE");
      const textLayer = inst.children.find((x) => x.type === "TEXT");
      const tRun = firstText(n);
      crumb("btn:text"); if (textLayer) {
        if (label) await setLayerText(inst, textLayer.name, label, tRun && tRun.font);
        else textLayer.visible = false;
      }
      const tx = tRun && tRun.text[0] ? tRun.text[0].box.x : n.box.x + n.box.w;
      const left = icons.filter((i) => i.box.x < tx);
      const right = icons.filter((i) => i.box.x >= tx);
      crumb("btn:icons"); if (iconLayers[0]) { iconLayers[0].visible = !!left.length; if (left.length) await iconFor(iconLayers[0], left[0]); }
      if (iconLayers[1]) { iconLayers[1].visible = !!right.length && !!label; if (right.length && label) await iconFor(iconLayers[1], right[0]); }
      // the code's shape and paint win where it restyles the button (rounded-md
      // facet triggers, the customer page's dark button)
      if (n.v) {
        if (n.v.radius) { try { inst.cornerRadius = n.v.radius[0]; } catch (e) {} }
        if (n.v.bg) { const p = solid(n.v.bg); if (p) inst.fills = [p]; }
        if (n.v.border) { const b = n.v.border.find((x) => x.w > 0); const p = b && solid(b.c); if (p) { inst.strokes = [p]; inst.strokeWeight = b.w; } }
      }
      crumb("btn:resize"); inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); crumb("btn:place");
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Badge (and the app's StatusChip, which wraps it)
  MAP.push({
    when: (n) => comp(n, ["Badge"]) && !comp(n, ["Button"]),
    async make(n, parent, ox, oy) {
      const set = await lib("Badge"); if (!set) return null;
      const c = comp(n, ["Badge"]).p || {};
      const vmap = { default: "Primary", primary: "Primary", secondary: "Secondary", outline: "Outline", destructive: "Destructive" };
      const v = variantOf(set, { Variant: vmap[c.variant] || "Secondary", State: "Default" });
      const inst = v.createInstance();
      const label = allText(n);
      inst.name = `Badge · ${label}`;
      const tRun = firstText(n);
      await setLayerText(inst, null, label, tRun && tRun.font);
      const icons = svgs(n);
      const iconLayers = inst.children.filter((x) => x.type === "INSTANCE");
      if (iconLayers[0]) { iconLayers[0].visible = !!icons.length; if (icons.length) await iconFor(iconLayers[0], icons[0]); }
      if (iconLayers[1]) iconLayers[1].visible = false;
      // app colours win where the code tints the badge (status chips)
      if (n.v && n.v.bg) { const p = solid(n.v.bg); if (p) inst.fills = [p]; }
      if (n.v && n.v.border) { const s = n.v.border.find((b) => b.w > 0); const p = s && solid(s.c); if (p) inst.strokes = [p]; } else if (n.v && n.v.bg) inst.strokes = [];
      inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h));
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Tabs trigger
  MAP.push({
    when: (n) => comp(n, ["TabsTrigger"]) && n.tag === "button",
    async make(n, parent, ox, oy) {
      const set = await lib("TabsTrigger"); if (!set) return null;
      const active = n.state === "active" || n.state === "on" || n.state === "checked" || n.selectedAttr === "true" || n.checked === "true";
      const v = variantOf(set, { Active: active ? "On" : "Off", State: n.disabled ? "Disabled" : "Default" });
      const inst = v.createInstance();
      // label = first text; a trailing number is the count badge
      const runs = []; const w = (x) => { (x.text || []).forEach((r) => runs.push({ t: r.t.trim(), font: x.font, node: x })); (x.kids || []).forEach(w); }; w(n);
      const label = runs[0] ? runs[0].t : "";
      const count = runs.slice(1).map((r) => r.t).join(" ");
      inst.name = `Tabs / Trigger · ${label}`;
      await setLayerText(inst, "Tabs Text", label, runs[0] && runs[0].font);
      const badge = inst.findOne((x) => x.name === "Badge Number");
      if (badge) {
        badge.visible = !!count;
        if (count) {
          const cr = runs[1];
          await setLayerText(badge, null, count, cr && cr.font);
          const pill = cr && cr.node && cr.node.v && cr.node.v.bg ? cr.node : null;
          if (pill) { const p = solid(pill.v.bg); if (p) badge.fills = [p]; }
        }
      }
      const ic = inst.findOne((x) => x.type === "INSTANCE" && /^Icon/.test(x.name));
      if (ic) ic.visible = false;
      inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h));
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Avatar
  MAP.push({
    when: (n) => comp(n, ["Avatar"]) && n.tag === "span" && !comp(n, ["AvatarFallback", "AvatarImage"]),
    async make(n, parent, ox, oy) {
      const set = await lib("Avatar"); if (!set) return null;
      const px = Math.round(n.box.w);
      const size = { 48: "12", 40: "10", 32: "8", 24: "6", 20: "5" }[px] || "8";
      const v = variantOf(set, { Type: "Fallback", Size: size });
      const inst = v.createInstance();
      const label = allText(n);
      inst.name = `Avatar · ${label}`;
      await setLayerText(inst, null, label);
      inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h));
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Separator
  MAP.push({
    when: (n) => comp(n, ["Separator"]) && !n.kids,
    async make(n, parent, ox, oy) {
      const set = await lib("Separator"); if (!set) return null;
      const vertical = n.box.h > n.box.w;
      const v = variantOf(set, { Variant: vertical ? "Vertical" : "Horizontal", Spacing: "Default" });
      const inst = v.createInstance();
      inst.name = "Separator";
      // the library's Separator carries its own inset; the code's rule runs edge to edge
      for (const fr of [inst, inst.findOne((x) => x.name === "SeparatorContainer")]) { if (!fr) continue; try { fr.paddingLeft = fr.paddingRight = fr.paddingTop = fr.paddingBottom = 0; } catch (e) {} }
      const line = inst.findOne((x) => x.type === "LINE"); if (line) { try { line.layoutSizingHorizontal = "FILL"; } catch (e) {} }
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Checkbox (the box only; its label is the app's own text)
  MAP.push({
    when: (n) => comp(n, ["Checkbox"]) && n.tag === "button",
    async make(n, parent, ox, oy) {
      const set = await lib("Checkbox"); if (!set) return null;
      const on = n.state === "checked" || n.checked === "true";
      const v = variantOf(set, { Status: on ? "Active" : "Inactive", State: n.disabled ? "Disabled" : "Default" });
      const inst = v.createInstance();
      inst.name = `Checkbox · ${on ? "on" : "off"}`;
      try { inst.setProperties({ "Show Text#266:18": false, "Show Description#48:23": false }); } catch {}
      inst.layoutSizingHorizontal = "FIXED";
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Switch
  MAP.push({
    when: (n) => comp(n, ["Switch"]) && n.tag === "button",
    async make(n, parent, ox, oy) {
      const set = await lib("Switch"); if (!set) return null;
      const on = n.state === "checked";
      const v = variantOf(set, { Active: on ? "On" : "Off", Type: "Default", Side: "Left", State: "Default" });
      const inst = v.createInstance();
      inst.name = `Switch · ${on ? "on" : "off"}`;
      try { inst.setProperties({ "Show Text#217:26": false, "Show Description#428:18": false }); } catch {}
      if (n.disabled) inst.opacity = 0.5;
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Sidebar menu buttons (top rows and sub rows)
  MAP.push({
    // not the account row: an avatar plus two lines is the DS's dropdown
    // trigger pattern, not a menu button, so it stays drawn (Avatar inside is DS)
    when: (n) => comp(n, ["SidebarMenuButton", "SidebarMenuSubButton"]) && /^(button|a)$/.test(n.tag) && !JSON.stringify(n).includes('"Avatar"'),
    async make(n, parent, ox, oy) {
      const sub = !!comp(n, ["SidebarMenuSubButton"]);
      const set = await lib(sub ? "SidebarMenuSubItem" : "SidebarMenuButton"); if (!set) return null;
      const active = n.state === "active" || (comp(n, ["SidebarMenuButton", "SidebarMenuSubButton"]).p || {}).isActive === true;
      const v = sub ? variantOf(set, { State: active ? "Active" : "Default" }) : variantOf(set, { Type: "Simple", State: active ? "Active" : "Default", Collapsed: "False" });
      const inst = v.createInstance();
      const runs = []; const w = (x) => { (x.text || []).forEach((r) => runs.push({ t: r.t.trim(), font: x.font })); (x.kids || []).forEach(w); }; w(n);
      const label = runs.map((r) => r.t).join(" ");
      const icons0 = svgs(n);
      const chevron = icons0.find((i) => /chevron/.test(i.svg.lucide || "") && i.box.x > n.box.x + n.box.w * 0.6);
      const main = runs[0] ? runs[0].t : "";
      const subtitle = runs.length > 1 ? runs.slice(1).map((r) => r.t).join(" ") : "";
      inst.name = `${sub ? "SidebarMenuSubItem" : "SidebarMenuButton"} · ${main}`;
      try {
        if (sub) inst.setProperties({ "Text#3278:82": main, "Icon#3281:375": icons0.length > 0 });
        else inst.setProperties({ "Text#3278:82": main, "Icon#3281:0": icons0.some((i) => i !== chevron), "Dropdown#3281:44": !!chevron, "Subtitle#3281:45": !!subtitle, ...(subtitle ? { "Subtitle Text#3281:46": subtitle } : {}) });
      } catch (e) { await setLayerText(inst, null, main, runs[0] && runs[0].font); }
      if (runs[0] && runs[0].font) for (const t of inst.findAll((x) => x.type === "TEXT")) { const p = solid(runs[0].font.color); if (p && t.characters === main) t.fills = [p]; }
      // the code's labels never truncate in the nav; Figma's padding differs by a pixel or two
      // Never truncate a nav label the code shows whole: measure it, and widen
      // the item by the pixel or two Figma's metrics need beyond the code's box.
      let need = 0;
      for (const t of inst.findAll((x) => x.type === "TEXT" && x.visible)) {
        try { const c = t.clone(); c.textAutoResize = "WIDTH_AND_HEIGHT"; figma.currentPage.appendChild(c); need = Math.max(need, c.width); c.remove(); t.textTruncation = "DISABLED"; } catch {}
      }
      n = Object.assign({}, n, { box: Object.assign({}, n.box, { w: Math.max(n.box.w, need + (inst.paddingLeft || 0) + (inst.paddingRight || 0) + (icons0.some((i) => i !== chevron) ? 24 : 0) + 2) }) });
      // masters: nav labels hug, so a longer label never wraps the item
      if (AUTO && sub) { try { inst.primaryAxisAlignItems = "MIN"; } catch (e) {} for (const t of inst.findAll((x) => x.type === "TEXT" && x.visible)) { try { t.textAutoResize = "WIDTH_AND_HEIGHT"; t.layoutSizingHorizontal = "HUG"; } catch (e) {} } }
      const icons = icons0.filter((i) => i !== chevron);
      const iconLayer = inst.findOne((x) => x.type === "INSTANCE" && /^Icon \//.test(x.name));
      if (iconLayer && icons[0]) await iconFor(iconLayer, icons[0]);
      if (n.v && n.v.bg) { const p = solid(n.v.bg); if (p) inst.fills = [p]; }
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Pagination items
  MAP.push({
    when: (n) => comp(n, ["PaginationLink", "PaginationButton", "PaginationPrevious", "PaginationNext"]) && /^(button|a)$/.test(n.tag),
    async make(n, parent, ox, oy) {
      const set = await lib("PaginationItem"); if (!set) return null;
      const label = allText(n);
      const isPrev = /prev/i.test(label) || comp(n, ["PaginationPrevious"]);
      const isNext = /next/i.test(label) || comp(n, ["PaginationNext"]);
      const active = (comp(n, ["PaginationLink", "PaginationButton"]) || {}).p?.isActive || n.v?.border;
      const v = variantOf(set, { Variant: isPrev ? "Previous" : isNext ? "Next" : "Link", State: n.disabled ? "Disabled" : active ? "Active" : "Default" });
      const inst = v.createInstance();
      inst.name = `PaginationItem · ${label || (isPrev ? "prev" : isNext ? "next" : "")}`;
      if (!isPrev && !isNext) await setLayerText(inst, null, label);
      else { const t = inst.findOne((x) => x.type === "TEXT"); if (t) { if (label) await setLayerText(inst, t.name, label); else t.visible = false; } }
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Breadcrumb items: links, the current page, the ellipsis
  MAP.push({
    when: (n) => comp(n, ["BreadcrumbLink", "BreadcrumbPage", "BreadcrumbEllipsis"]) && /^(a|span|button)$/.test(n.tag),
    async make(n, parent, ox, oy) {
      const set = await lib("BreadcrumbItem"); if (!set) return null;
      const kind = comp(n, ["BreadcrumbEllipsis"]) ? "Ellipsis" : comp(n, ["BreadcrumbPage"]) ? "Link Current" : "Link";
      const v = variantOf(set, { Variant: kind, State: "Default" });
      const inst = v.createInstance();
      const label = allText(n);
      inst.name = `BreadcrumbItem · ${label || kind}`;
      if (kind !== "Ellipsis") { const tr = firstText(n); await setLayerText(inst, null, label, tr && tr.font); }
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Card title / description: the DS's own text components, at the code's
  // size, weight and colour (the code's CardTitle is a size smaller than the
  // Figma default in places; the instance follows the code).
  async function textComponent(n, parent, ox, oy, setName, pick) {
    const set = await lib(setName); if (!set) return null;
    const run = (n.text && n.text[0]) || null;
    const label = allText(n);
    if (!label) return null;
    const v = set.type === "COMPONENT_SET" ? pick(set) : set;
    const inst = v.createInstance();
    inst.name = `${set.name} · ${label.slice(0, 40)}`;
    const t = await setLayerText(inst, null, label, n.font);
    if (t && n.font) {
      try {
        t.fontName = await font("Inter", styleFor(n.font.weight || 400));
        t.fontSize = n.font.size; if (n.font.lh) t.lineHeight = { unit: "PIXELS", value: n.font.lh };
        t.textAutoResize = "HEIGHT";
      } catch {}
    }
    const oneLine = !run || (run.lines || 1) <= 1;
    if (oneLine && t) {
      // one line in the code stays one line: hug the text rather than
      // wrapping at the code's box when Figma's advances run a hair wider
      try { t.layoutSizingHorizontal = "HUG"; } catch {}
      try { t.textAutoResize = "WIDTH_AND_HEIGHT"; } catch {}
      try { inst.layoutSizingHorizontal = "HUG"; } catch {}
      try { inst.primaryAxisSizingMode = "AUTO"; inst.counterAxisSizingMode = "AUTO"; } catch {}
    } else {
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
    }
    place(inst, parent, n.box, ox, oy);
    return inst;
  }
  MAP.push({
    when: (n) => comp(n, ["CardTitle"]) && n.text && !n.kids,
    make: (n, parent, ox, oy) => textComponent(n, parent, ox, oy, "CardTitle", (set) => variantOf(set, { "Font Size": (n.font && n.font.size >= 18) ? "Default" : "Small" })),
  });
  MAP.push({
    when: (n) => comp(n, ["CardDescription"]) && n.text && !n.kids,
    make: (n, parent, ox, oy) => textComponent(n, parent, ox, oy, "CardDescription", (set) => set.children[0]),
  });


  // ── overlays: drawers, dialogs, alert dialogs ─────────────────────────
  // An AlertDialog instance has no body slot: it can only carry a title, a
  // description and its two buttons. Anything more (an Alert inside, a list)
  // goes through the Dialog's Body slot instead, or it would be dropped.
  const simpleAlert = (n) => {
    const parts = [];
    const w = (x) => { if (comp(x, ["AlertDialogTitle", "AlertDialogDescription"]) || (comp(x, ["Button", "AlertDialogCancel", "AlertDialogAction"]) && /^(button|a)$/.test(x.tag))) { parts.push(allText(x)); return; } (x.kids || []).forEach(w); };
    w(n);
    return allText(n).replace(/\s/g, "").length <= parts.join("").replace(/\s/g, "").length + 2;
  };
  // A drawer is the DS Sheet; its contents go through the Sheet Body SLOT at
  // the code's own coordinates, with the DS header/footer off and the panel
  // padding zeroed so slot (0,0) is the panel's (0,0). The scrim is the
  // code's own overlay node, drawn separately.
  async function surfaceIn(n, parent, ox, oy, renderKids, inst, slotName, zeroNames) {
    for (const nm of zeroNames) {
      const fr = nm === "@root" ? inst : inst.findOne((x) => x.name === nm);
      if (!fr) continue;
      try { fr.paddingTop = fr.paddingBottom = fr.paddingLeft = fr.paddingRight = 0; fr.itemSpacing = 0; } catch {}
    }
    // an auto-layout instance ignores resize() on a hugging axis
    try { inst.counterAxisSizingMode = "FIXED"; inst.primaryAxisSizingMode = "FIXED"; } catch (e) {}
    // the library Dialog carries max-width 480; the code's dialogs run to 512+
    try { inst.maxWidth = null; inst.minWidth = null; inst.maxHeight = null; } catch (e) {}
    inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h));
    const body = figma.createFrame();
    body.name = "content"; body.fills = []; body.clipsContent = true;
    body.resize(Math.max(1, n.box.w), Math.max(1, n.box.h));
    await renderKids(n, body, n.box.x, n.box.y);
    const slot = inst.findOne((x) => x.type === "SLOT" && x.name === slotName);
    if (!slot) { inst.remove(); body.remove(); return null; }
    try { slot.paddingTop = slot.paddingBottom = slot.paddingLeft = slot.paddingRight = 0; } catch {}
    slot.appendChild(body);
    try { body.layoutSizingHorizontal = "FIXED"; body.layoutSizingVertical = "FIXED"; } catch {}
    // the library's slot has its own fixed width (Dialog: 432 inside 480);
    // it must fill the surface or a wider dialog's content overflows it
    try { slot.layoutSizingHorizontal = "FILL"; } catch (e) {}
    // the surface hugs its slot and can grow a few px once the body lands
    try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
    // a master's drawer body fills the panel and keeps the panel's height
    if (AUTO && isAL(body)) { try { body.layoutSizingHorizontal = "FILL"; body.layoutSizingVertical = "FILL"; } catch {} }
    place(inst, parent, n.box, ox, oy);
    return inst;
  }
  MAP.push({
    container: true,
    when: (n) => comp(n, ["DrawerContent", "SheetContent", "Drawer.Content"]) && n.box.w > 200 && n.box.h > 200,
    async make(n, parent, ox, oy, renderKids) {
      const set = await lib("Sheet"); if (!set) return null;
      const side = n.box.x > 200 ? "right" : n.box.x <= 1 && n.box.w < 900 ? "left" : n.box.y > 100 ? "bottom" : "right";
      const v = variantOf(set, { Breakpoint: "md", Position: side });
      const inst = v.createInstance();
      inst.name = `Sheet · ${n.hook || "drawer"}`;
      try { inst.setProperties({ "Show Header#27228:10": false, "Show Footer#27228:1": false, "Show icon#29064:0": false }); } catch {}
      inst.fills = [];
      const close = inst.findOne((x) => x.name === "Sheet / Close Icon"); if (close) close.visible = false;
      const content = inst.findOne((x) => x.name === "_SheetContent");
      if (content) { try { content.layoutSizingHorizontal = "FILL"; content.layoutSizingVertical = "FILL"; } catch {} if (n.v) { const p = n.v.bg && solid(n.v.bg); if (p) content.fills = [p]; } }
      return surfaceIn(n, parent, ox, oy, renderKids, inst, "Sheet Body", ["@root", "_SheetContent"]);
    },
  });
  MAP.push({
    container: true,
    when: (n) => comp(n, ["DialogContent", "DialogContentModal", "AlertDialogContent"]) && !(comp(n, ["AlertDialogContent"]) && simpleAlert(n)) && !comp(n, ["DrawerContent", "SheetContent", "Drawer.Content"]) && n.box.w > 200 && n.box.h > 100 && n.box.w < 1000,
    async make(n, parent, ox, oy, renderKids) {
      const set = await lib("Dialog"); if (!set) return null;
      const v = variantOf(set, { Breakpoint: "lg" });
      const inst = v.createInstance();
      inst.name = `Dialog · ${n.hook || "dialog"}`;
      for (const nm of ["Dialog Header", "Dialog Footer", "Dialog / Close Icon"]) { const x = inst.findOne((y) => y.name === nm); if (x) x.visible = false; }
      if (n.v) { const p = n.v.bg && solid(n.v.bg); if (p) inst.fills = [p]; if (n.v.radius) try { inst.cornerRadius = n.v.radius[0]; } catch {} }
      return surfaceIn(n, parent, ox, oy, renderKids, inst, "Dialog Body", ["@root"]);
    },
  });
  MAP.push({
    when: (n) => comp(n, ["AlertDialogContent"]) && n.box.w > 200 && simpleAlert(n),
    async make(n, parent, ox, oy) {
      const set = await lib("AlertDialog"); if (!set) return null;
      const find = (names) => { let f = null; const w = (x) => { if (f) return; if (comp(x, names)) { f = x; return; } (x.kids || []).forEach(w); }; w(n); return f; };
      const title = find(["AlertDialogTitle"]), desc = find(["AlertDialogDescription"]);
      const btns = []; const wb = (x) => { if (comp(x, ["Button", "AlertDialogCancel", "AlertDialogAction"]) && /^(button|a)$/.test(x.tag)) { btns.push(x); return; } (x.kids || []).forEach(wb); }; wb(n);
      if (!title) return null;
      const v = variantOf(set, { Breakpoint: n.box.w > 480 ? "md" : "sm" });
      const inst = v.createInstance();
      inst.name = `AlertDialog · ${allText(title).slice(0, 40)}`;
      try { inst.setProperties({ "Title Text#83:0": allText(title), "Description Text#83:3": desc ? allText(desc) : "" }); } catch {}
      if (!desc) { const d = inst.findOne((x) => x.type === "TEXT" && x.name !== "Title Text"); if (d) d.visible = false; }
      const slots = inst.findOne((x) => x.name === "_AlertDialogFooter");
      const bset = await lib("Button");
      if (slots && bset) {
        const kids = slots.children.filter((x) => x.type === "INSTANCE");
        btns.sort((a, b) => a.box.x - b.box.x);
        for (let i = 0; i < kids.length; i++) {
          const b = btns[i];
          if (!b) { kids[i].visible = false; continue; }
          const c = (comp(b, ["Button"]) || {}).p || {};
          const vmap = { default: "Primary", secondary: "Secondary", outline: "Outline", ghost: "Ghost", destructive: "Destructive" };
          const want = variantOf(bset, { Variant: vmap[c.variant] || (comp(b, ["AlertDialogCancel"]) ? "Outline" : "Primary"), State: "Default", Size: "default" });
          try { kids[i].swapComponent(want); } catch {}
          await setLayerText(kids[i], null, allText(b));
          for (const ic of kids[i].children.filter((x) => x.type === "INSTANCE")) ic.visible = false;
        }
      }
      try { inst.maxWidth = null; inst.minWidth = null; inst.counterAxisSizingMode = "FIXED"; inst.resize(Math.max(1, n.box.w), inst.height); inst.primaryAxisSizingMode = "AUTO"; } catch {}
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // ── form controls ─────────────────────────────────────────────────────
  MAP.push({
    when: (n) => (comp(n, ["InputGroup"]) && n.tag === "div") || (comp(n, ["Input"]) && n.tag === "input" && !n.kids),
    async make(n, parent, ox, oy) {
      const set = await lib("Input"); if (!set) return null;
      let inputNode = n.input ? n : null;
      const w = (x) => { if (inputNode) return; if (x.input) { inputNode = x; return; } (x.kids || []).forEach(w); }; w(n);
      if (!inputNode || inputNode.tag === "textarea") return null;
      const filled = !!inputNode.input.value;
      const v = variantOf(set, { "Horizontal Layout": "No", Variant: "Text", State: n.disabled ? "Disabled" : filled ? "Filled" : "Default" });
      const inst = v.createInstance();
      inst.name = `Input · ${inputNode.input.value || inputNode.input.placeholder}`;
      try { inst.setProperties({ "Show Label#65:9": false, "Show Description#334:40": false, "Show Link#501:47": false, "Placeholder Text#65:12": inputNode.input.value || inputNode.input.placeholder || " " }); } catch {}
      const ph = inst.findOne((x) => x.type === "TEXT" && /Placeholder|Input/i.test(x.parent ? x.parent.name : ""));
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
      place(inst, parent, n.box, ox, oy);
      // the field's own icon layers: Icon / Search (leading, no property, so
      // shown directly) and Secondary Icon (trailing, behind a boolean)
      const tx = inputNode.box.x + (inputNode.input.pad ? inputNode.input.pad[3] : 0);
      for (const ic of svgs(n)) {
        const leading = ic.box.x < tx;
        const layer = leading ? inst.findOne((x) => x.type === "INSTANCE" && x.name === "Icon / Search") : inst.findOne((x) => x.type === "INSTANCE" && x.name === "Secondary Icon");
        if (!layer) { overlayQueue.push(ic); continue; }
        if (leading) layer.visible = true; else { try { inst.setProperties({ "Secondary Icon#23060:25": true }); } catch (e) {} }
        if (!(await swapIcon(layer, ic.svg.lucide || (ic.comps && ic.comps[0].n), ic.svg.stroke))) { if (ic.svg.lucide !== "search") { layer.opacity = 0; overlayQueue.push(ic); } }
      }
      // icon-to-text gap: the code's gap-2 (the library row carries 64)
      const irow = inst.findOne((x) => x.name === "Input" && x.type === "FRAME");
      if (irow) { try { irow.itemSpacing = 8; irow.primaryAxisAlignItems = "MIN"; } catch (e) {} }
      // the field takes the code's height (32), not the library's 36, without clipping its border
      const iwrap = inst.findOne((x) => x.name === "Input Wrapper");
      try { if (iwrap) iwrap.layoutSizingVertical = "FILL"; if (irow) { irow.layoutSizingVertical = "FILL"; irow.paddingTop = irow.paddingBottom = 0; } } catch (e) {}
      // add-ons that carry copy or paint (a "px" suffix, a colour swatch) are the
      // code's own and sit over the field; icon-only add-ons are the icon layers above
      const holdsInput = (k) => k === inputNode || JSON.stringify(k).includes('"input":');
      for (const k of (n.kids || [])) {
        if (holdsInput(k)) continue;
        const onlySvg = !k.text && !k.v && (k.kids || []).every((x) => x.svg) || k.svg;
        if (!onlySvg) overlayQueue.push(k);
      }
      const ph2 = inst.findOne((x) => x.type === "TEXT" && x.name === "PlaceholderText");
      if (ph2 && inputNode.input.font) { try { ph2.textAlignHorizontal = "LEFT"; ph2.textTruncation = "DISABLED"; ph2.textAutoResize = "WIDTH_AND_HEIGHT"; ph2.layoutSizingHorizontal = "HUG"; } catch (e) {} try { ph2.fontSize = inputNode.input.font.size; const c = solid(inputNode.input.value ? inputNode.input.font.color : (inputNode.input.ph || inputNode.input.font.color)); if (c) ph2.fills = [c]; } catch (e) {} }
      return inst;
    },
  });
  MAP.push({
    when: (n) => comp(n, ["Textarea"]) && n.tag === "textarea",
    async make(n, parent, ox, oy) {
      const set = await lib("Textarea"); if (!set) return null;
      const filled = !!(n.input && n.input.value);
      const v = variantOf(set, { State: n.disabled ? "Disabled" : filled ? "Filled" : "Default" });
      const inst = v.createInstance();
      inst.name = "Textarea";
      try { inst.setProperties({ "Show Label#183:11": false, "Show Description#183:16": false, "Placeholder Text#183:5": (n.input && (n.input.value || n.input.placeholder)) || " " }); } catch {}
      const inner = inst.findOne((x) => x.name === "Input");
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); if (inner) { inner.layoutSizingVertical = "FILL"; } } catch {}
      const tt = inst.findOne((x) => x.type === "TEXT" && x.name === "PlaceholderText");
      if (tt && n.input && n.input.font) {
        const f = n.input.font, k = f.scale || 1;
        try { tt.fontName = await font("Inter", styleFor(f.weight || 400)); tt.fontSize = f.size * k; if (f.lh) tt.lineHeight = { unit: "PIXELS", value: f.lh * k }; const c = solid(n.input.value ? f.color : (n.input.ph || f.color)); if (c) tt.fills = [c]; } catch (e) {}
        if (inner && n.input.pad) { try { inner.paddingTop = n.input.pad[0]; inner.paddingLeft = n.input.pad[3]; inner.paddingRight = n.input.pad[1]; } catch (e) {} }
      }
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });
  MAP.push({
    when: (n) => comp(n, ["SelectTrigger"]) && n.tag === "button",
    async make(n, parent, ox, oy) {
      const set = await lib("Select"); if (!set) return null;
      const label = allText(n);
      const v = variantOf(set, { State: n.disabled ? "Disabled" : label ? "Filled" : "Default" });
      const inst = v.createInstance();
      inst.name = `Select · ${label}`;
      try { inst.setProperties({ "Show Label#345:164": false, "Show Description#345:170": false, "Placeholder#3001:0": label || " ", "Show Icon#17382:0": false }); } catch {}
      const st = inst.findOne((x) => x.type === "TEXT" && x.name === "PlaceholderText");
      const fr = firstText(n);
      if (st && fr && fr.font) { try { st.fontName = await font("Inter", styleFor(fr.font.weight || 400)); st.fontSize = fr.font.size; if (fr.font.lh) st.lineHeight = { unit: "PIXELS", value: fr.font.lh }; const c = solid(fr.font.color); if (c) st.fills = [c]; } catch (e) {} }
      if (n.v && n.v.radius) { const tr = inst.findOne((x) => x.name === "_SelectTrigger"); if (tr) try { tr.cornerRadius = n.v.radius[0]; } catch (e) {} }
      try { inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h)); } catch {}
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // Logo
  MAP.push({
    when: (n) => comp(n, ["Logo"]) && (n.svg || n.kids),
    async make(n, parent, ox, oy) {
      const set = await lib("Logo"); if (!set) return null;
      const v = variantOf(set, { Variant: "Logotype" });
      const inst = v.createInstance();
      inst.name = "Logo";
      const art = n.svg ? n : svgs(n)[0] || n;
      try { inst.rescale(art.box.w / inst.width); } catch {}
      place(inst, parent, art.box, ox, oy);
      return inst;
    },
  });

  // Card: the instance draws the surface; everything inside goes through
  // its Card Content SLOT, laid out at the code's own coordinates.
  MAP.push({
    container: true,
    when: (n) => comp(n, ["Card"]) && n.tag === "div" && n.box.w > 40 && n.box.h > 24,
    async make(n, parent, ox, oy, renderKids) {
      const set = await lib("Card"); if (!set) return null;
      const c = comp(n, ["Card"]).p || {};
      const hasBorder = !!(n.v && n.v.border);
      const filled = !!(n.v && n.v.bg && !/255, 255, 255/.test(n.v.bg));
      const variant = c.variant === "transparent" ? "Transparent" : filled && !hasBorder ? "Filled" : "Border";
      const v = variantOf(set, { Variant: variant, Density: "Default" });
      const inst = v.createInstance();
      inst.name = `Card${n.hook ? " · " + n.hook : ""}`;
      try { inst.setProperties({ "Show Header#28091:0": false, "Show Footer#28091:18": false, "Show Media#28396:0": false, "Show Content#28091:9": true, "Show Toolbar#33445:72": false, "Show Action#33445:97": false, "Show Divider#33445:122": false }); } catch (e) {}
      // zero the chain between the card edge and the slot, so slot (0,0) is the card's own (0,0)
      for (const fr of [inst, inst.findOne((x) => x.name === "Card Content" && x.type === "FRAME"), inst.findOne((x) => x.type === "SLOT" && x.name === "Card Content")]) {
        if (!fr) continue;
        try { fr.paddingTop = fr.paddingBottom = fr.paddingLeft = fr.paddingRight = 0; fr.itemSpacing = 0; } catch {}
      }
      if (n.v) {
        const p = n.v.bg && solid(n.v.bg); if (p) inst.fills = [p];
        if (n.v.radius) { const r = n.v.radius[0]; try { inst.cornerRadius = r; } catch {} }
        if (!hasBorder) inst.strokes = [];
        if (n.v.shadow) inst.effects = shadows(n.v.shadow); else inst.effects = [];
      }
      inst.resize(Math.max(1, n.box.w), Math.max(1, n.box.h));
      const body = figma.createFrame();
      body.name = "content";
      body.fills = [];
      body.clipsContent = !!n.clip;
      body.resize(Math.max(1, n.box.w), Math.max(1, n.box.h));
      await renderKids(n, body, n.box.x, n.box.y);
      const slot = inst.findOne((x) => x.type === "SLOT" && x.name === "Card Content");
      if (slot) {
        slot.appendChild(body);
        try {
          if (AUTO && isAL(body)) { body.layoutSizingHorizontal = "FILL"; body.layoutSizingVertical = "HUG"; inst.primaryAxisSizingMode = "AUTO"; }
          else { body.layoutSizingHorizontal = "FIXED"; body.layoutSizingVertical = "FIXED"; }
        } catch {}
      }
      else { inst.remove(); body.remove(); return null; }
      place(inst, parent, n.box, ox, oy);
      return inst;
    },
  });

  // ── generic renderer ─────────────────────────────────────────────────
  const stats = { nodes: 0, instances: {}, fallbacks: 0, errors: [], t: {}, truncated: 0 };
  let DEADLINE = Infinity;
  const tick = (k, t0) => { stats.t[k] = (stats.t[k] || 0) + (Date.now() - t0); };

  // ── inline text: one text node per paragraph, not one per DOM text run ──
  // "4.7 average" is a <span>4.7</span> beside " average"; placed as two
  // runs at the browser's x, Figma's slightly different advances ate the
  // space ("4.7average") or opened one ("Delete “ name ”"), and a wrapped
  // sentence with a bold date in it was drawn over itself. Merged, the text
  // flows like the browser's does and keeps each run's style as a range.
  const INLINE_TAGS = /^(span|a|b|strong|em|i|code|small|sup|sub|abbr|time|label|mark|s|u|kbd|q|cite|data|var|bdi|bdo|br)$/;
  const inlineKid = (k) => INLINE_TAGS.test(k.tag) && !k.v && !k.clip && !k.svg && !k.img && !k.input && !k.pos && !k.rot && !(k.lay && k.lay.d !== "block") &&
    ((k.text && k.text.length) || (k.kids && k.kids.length)) && (!k.kids || k.kids.every(inlineKid)) && !MAP.some((m) => m.when(k));
  const segsOf = (n) => {
    const out = (n.text || []).map((r) => ({ t: r.t, box: r.box, lines: r.lines || 1, font: n.font, o: r.o }));
    for (const k of n.kids || []) if (inlineKid(k)) out.push(...segsOf(k));
    return out;
  };
  async function makeMerged(segs, n, parent, ox, oy) {
    const lineOf = (b) => Math.round(b.y / 4);
    if (segs.every((sg) => sg.o !== undefined)) segs.sort((a, b) => a.o - b.o);
    else segs.sort((a, b) => (Math.abs(a.box.y - b.box.y) < 6 ? a.box.x - b.box.x : a.box.y - b.box.y));
    // a gap the code made with a margin (ml-2 between "Ratings" and "4.7
    // average") has no space character: put one in where the runs sit apart
    for (let i = 1; i < segs.length; i++) {
      const a = segs[i - 1], b = segs[i];
      const sameLine = Math.abs(a.box.y - b.box.y) < 6 && (a.lines || 1) === 1;
      if (sameLine && !/\s$/.test(a.t) && !/^\s/.test(b.t) && b.box.x - (a.box.x + a.box.w) > 2) segs[i] = Object.assign({}, b, { t: " " + b.t });
    }
    const f0 = segs[0].font || n.font || {};
    const k = f0.scale || 1;
    const lh = (f0.lh || Math.round((f0.size || 14) * 1.2)) * k;
    const t = figma.createText();
    t.fontName = await font(f0.family, styleFor(f0.weight || 400, f0.italic));
    t.fontSize = (f0.size || 14) * k; t.lineHeight = { unit: "PIXELS", value: lh };
    let chars = segs.map((sg) => sg.t).join("");
    const lead = chars.length - chars.replace(/^\s+/, "").length;
    chars = chars.replace(/^\s+/, "").replace(/\s+$/, "");
    t.characters = chars || " ";
    let pos = -lead;
    for (const sg of segs) {
      const a = Math.max(0, pos), b = Math.min(chars.length, pos + sg.t.length); pos += sg.t.length;
      if (b <= a) continue;
      const f = sg.font || f0; const kk = f.scale || 1;
      try {
        t.setRangeFontName(a, b, await font(f.family, styleFor(f.weight || 400, f.italic)));
        t.setRangeFontSize(a, b, (f.size || 14) * kk);
        const pnt = solid(f.color); if (pnt) t.setRangeFills(a, b, [pnt]);
        if (f.decoration && /underline/.test(f.decoration)) t.setRangeTextDecoration(a, b, "UNDERLINE");
      } catch (e) {}
    }
    t.name = chars.slice(0, 40);
    const minX = Math.min(...segs.map((sg) => sg.box.x)), maxX = Math.max(...segs.map((sg) => sg.box.x + sg.box.w));
    const minY = Math.min(...segs.map((sg) => sg.box.y));
    const multi = new Set(segs.map((sg) => lineOf(sg.box))).size > 1 || segs.some((sg) => sg.lines > 1) || /\n/.test(chars);
    const contentH = Math.max(1, segs[0].box.h - ((segs[0].lines || 1) - 1) * lh);
    parent.appendChild(t);
    if (!multi || (f0.nowrap && !/\n/.test(chars))) {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
      t.x = minX - ox;
      if (f0.align === "right" || f0.align === "end") t.x = maxX - t.width - ox;
      else if (f0.align === "center") t.x = (minX + maxX) / 2 - t.width / 2 - ox;
    } else {
      // the browser wrapped this paragraph inside its block: give Figma the
      // block's width (a hair more, Figma's Inter runs ~1% wider)
      const left = Math.min(minX, n.box.x + 0.5), right = Math.max(maxX, n.box.x + n.box.w - 0.5);
      const w = Math.max(maxX - minX, right - left) * 1.015 + 2;
      t.textAutoResize = "HEIGHT"; t.resize(w, t.height);
      t.textAlignHorizontal = f0.align === "center" ? "CENTER" : f0.align === "right" || f0.align === "end" ? "RIGHT" : "LEFT";
      t.x = (f0.align === "center" ? (left + right) / 2 - w / 2 : f0.align === "right" || f0.align === "end" ? right - w : left) - ox;
    }
    t.y = minY - (lh - contentH) / 2 - oy;
    return t;
  }

  async function renderKids(n, frame, ox, oy) {
    if (n.marker) {
      const f = n.font || (firstText(n) || {}).font || { size: 14, lh: 20, color: "rgb(17, 20, 18)" };
      const lh = f.lh || 20;
      const mt = await makeText({ t: n.marker.t, lines: 1, box: { x: n.box.x, y: n.box.y + (lh - (f.size || 14) * 1.2) / 2, w: 20, h: (f.size || 14) * 1.2 } }, f, frame, ox, oy, "marker");
      if (!n.marker.inside) mt.x = n.box.x - ox - mt.width - 6;
    }
    const inlineKids = (n.kids || []).filter(inlineKid);
    const canMerge = (!n.lay || n.lay.d === "block") && !n.input && ((n.text && n.text.length && inlineKids.length) || (n.text && n.text.length > 1) || (!n.text && inlineKids.length > 1 && inlineKids.length === (n.kids || []).length));
    if (canMerge) {
      try { await makeMerged(segsOf(Object.assign({}, n, { kids: inlineKids })), n, frame, ox, oy); stats.nodes++; } catch (e) { stats.errors.push("merge:" + String(e).slice(0, 80)); }
      for (const k of (n.kids || []).filter((k) => !inlineKids.includes(k)).sort((a, b) => (a.z || 0) - (b.z || 0))) await render(k, frame, ox, oy);
      return;
    }
    if (n.text && n.text.length) for (const r of n.text) { try { const tt = Date.now(); await makeText(r, n.font, frame, ox, oy); tick("text", tt); stats.nodes++; } catch (e) { stats.errors.push("text:" + String(e).slice(0, 80)); } }
    if (n.input && !n.kids) {
      const val = n.input.value || n.input.placeholder;
      if (val) {
        const f = Object.assign({}, n.input.font, n.input.value ? {} : { color: n.input.ph || n.input.font.color });
        const box = n.box;
        const lh = f.lh || Math.round(f.size * 1.4);
        const pad = n.input.pad || [8, 12, 8, 12];
        const multi = n.tag === "textarea";
        // the run box is a LINE box here, so no content-area correction
        const y = multi ? box.y + pad[0] : box.y + (box.h - lh) / 2;
        await makeText({ t: val, lines: 1, box: { x: box.x + pad[3], y: y + (lh - lh) / 2, w: box.w - pad[1] - pad[3], h: lh } }, Object.assign({}, f, { lh }), frame, ox, oy, n.input.value ? "value" : "placeholder");
      }
    }
    const kids = (n.kids || []).slice();
    // positioned children with a z-index paint later
    kids.sort((a, b) => (a.z || 0) - (b.z || 0));
    for (const k of kids) await render(k, frame, ox, oy);
  }

  async function render(n, parent, ox, oy) {
    if (Date.now() > DEADLINE) { stats.truncated++; return null; }
    // prototype chrome, not product: the demo tweaker launcher
    if (n.comps && n.comps.some((c) => /^(ShellTweaker|DemoTweaker|Tweaker)/.test(c.n))) return null;
    crumb((n.hook || n.tag) + " " + ((n.comps && n.comps[0].n) || "") + (n.svg ? " svg:" + (n.svg.lucide || "") : "") + (n.img ? " img" : ""));
    try {
      for (const m of MAP) {
        if (m.when(n)) {
          const tm = Date.now();
          overlayQueue = [];
          const made = await m.make(n, parent, ox, oy, renderKids);
          if (made) await flushOverlays(parent, ox, oy); else overlayQueue = [];
          tick("map:" + (made ? made.name.split(" · ")[0] : "miss"), tm);
          if (made) { stats.instances[made.name.split(" · ")[0]] = (stats.instances[made.name.split(" · ")[0]] || 0) + 1; return made; }
          stats.fallbacks++;
          break;
        }
      }
      if (n.svg) { stats.nodes++; const ts = Date.now(); const r = await makeSvg(n, parent, ox, oy); tick("svg", ts); return r; }
      if (n.img && cfg.skipImg) return null;
      if (n.img) { stats.nodes++; const ts = Date.now(); const r = await makeImg(n, parent, ox, oy); tick("img", ts); return r; }
      const drawn = n.v || n.clip || n.rot;
      if (!drawn) { await renderKids(n, parent, ox, oy); return null; }
      const f = figma.createFrame();
      f.name = nice(n) || n.tag;
      f.resize(Math.max(0.01, n.box.w), Math.max(0.01, n.box.h));
      applyVisual(f, n.v, n.box);
      f.clipsContent = !!n.clip;
      place(f, parent, n.box, ox, oy);
      stats.nodes++;
      await renderKids(n, f, n.box.x, n.box.y);
      return f;
    } catch (e) {
      stats.errors.push((n.hook || n.tag) + ": " + String(e).slice(0, 100));
      return null;
    }
  }


  // ── AUTO mode: auto-layout masters from the code's own flex structure ──
  const near = (a, b, tol = 2) => Math.abs(a - b) <= tol;
  const innerOf = (pn) => {
    const pad = (pn && pn.lay && pn.lay.pad) || [0, 0, 0, 0];
    const bw = (pn && pn.v && pn.v.border) ? pn.v.border.map((b) => b.w || 0) : [0, 0, 0, 0];
    return { w: pn ? pn.box.w - pad[1] - pad[3] - bw[1] - bw[3] : 0, h: pn ? pn.box.h - pad[0] - pad[2] - bw[0] - bw[2] : 0 };
  };
  const isAL = (f) => f && f.layoutMode && f.layoutMode !== "NONE";
  const median = (a) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };

  // Size a child inside an auto-layout parent the way the browser did:
  // FILL where it spans the parent's content box (or flex-grows), HUG where
  // its own layout reproduces its size, FIXED otherwise.
  // a row of DS buttons may hug wider than the code's box (Figma's button
  // metrics); anything else keeps the code's width so columns stay aligned
  const buttonsOnly = (node) => { try { return node.children && node.children.length > 0 && node.children.every((c) => c.type === "INSTANCE" && /^Button/.test(c.name)); } catch (e) { return false; } };
  function sizeIn(node, n, parent, pn) {
    if (!isAL(parent)) return;
    const inner = innerOf(pn);
    const row = parent.layoutMode === "HORIZONTAL";
    const canHug = isAL(node) || node.type === "TEXT";
    // flex-grow only means FILL where the parent has a size of its own on
    // that axis; inside a hugging parent FILL collapses the child to nothing
    const parentFixedPrimary = parent.primaryAxisSizingMode === "FIXED";
    if (n.grow && !parentFixedPrimary) n = Object.assign({}, n, { grow: 0 });
    try {
      if (row) {
        if (n.grow) node.layoutSizingHorizontal = "FILL";
        else if (canHug) { node.layoutSizingHorizontal = "HUG"; if ((buttonsOnly(node) ? node.width < n.box.w - 1.5 : !near(node.width, n.box.w, 1.5))) { node.layoutSizingHorizontal = "FIXED"; node.resize(Math.max(1, n.box.w), node.height); } }
        else node.layoutSizingHorizontal = "FIXED";
        if (pn && pn.lay && /stretch|normal/.test(pn.lay.ai || "") && near(n.box.h, inner.h)) node.layoutSizingVertical = "FILL";
        else if (canHug && node.type !== "TEXT") { node.layoutSizingVertical = "HUG"; if (!near(node.height, n.box.h, 0.4)) { node.layoutSizingVertical = "FIXED"; node.resize(node.width, Math.max(1, n.box.h)); } }
      } else {
        if (near(n.box.w, inner.w, 2)) node.layoutSizingHorizontal = "FILL";
        else if (canHug) { node.layoutSizingHorizontal = "HUG"; if ((buttonsOnly(node) ? node.width < n.box.w - 1.5 : !near(node.width, n.box.w, 1.5))) { node.layoutSizingHorizontal = "FIXED"; node.resize(Math.max(1, n.box.w), node.height); } }
        else node.layoutSizingHorizontal = "FIXED";
        if (n.grow) node.layoutSizingVertical = "FILL";
        else if (canHug && node.type !== "TEXT") { node.layoutSizingVertical = "HUG"; if (!near(node.height, n.box.h, 0.4)) { node.layoutSizingVertical = "FIXED"; node.resize(node.width, Math.max(1, n.box.h)); } }
      }
    } catch (e) {}
  }

  // Configure frame f as auto-layout from spec node n (its flex/grid/block
  // layout, or the children's geometry when the code gave none).
  function layoutFrom(f, n, kids) {
    const lay = n.lay || {};
    let dir = "VERTICAL";
    if (lay.d === "flex") dir = /row/.test(lay.dir || "row") ? "HORIZONTAL" : "VERTICAL";
    else if (lay.d === "grid") dir = (lay.cols || 1) > 1 ? "HORIZONTAL" : "VERTICAL";
    else if (kids.length >= 2) {
      const sideBySide = kids.every((k, i) => i === 0 || k.box.x >= kids[i - 1].box.x + kids[i - 1].box.w - 2);
      dir = sideBySide ? "HORIZONTAL" : "VERTICAL";
    }
    f.layoutMode = dir;
    const bw = n.v && n.v.border ? n.v.border.map((b) => b.w || 0) : [0, 0, 0, 0];
    let pad = lay.pad;
    if (!pad && kids.length) {
      const minX = Math.min(...kids.map((k) => k.box.x)), minY = Math.min(...kids.map((k) => k.box.y));
      const maxX = Math.max(...kids.map((k) => k.box.x + k.box.w)), maxY = Math.max(...kids.map((k) => k.box.y + k.box.h));
      pad = [Math.max(0, minY - n.box.y - bw[0]), Math.max(0, n.box.x + n.box.w - maxX - bw[1]), Math.max(0, n.box.y + n.box.h - maxY - bw[2]), Math.max(0, minX - n.box.x - bw[3])];
    }
    pad = pad || [0, 0, 0, 0];
    f.paddingTop = pad[0] + bw[0]; f.paddingRight = pad[1] + bw[1]; f.paddingBottom = pad[2] + bw[2]; f.paddingLeft = pad[3] + bw[3];
    // spacing: the declared gap, else the gaps the margins actually made
    const flow = kids.filter((k) => k.pos !== "absolute" && k.pos !== "fixed");
    const gaps = [];
    for (let i = 1; i < flow.length; i++) gaps.push(dir === "HORIZONTAL" ? flow[i].box.x - (flow[i - 1].box.x + flow[i - 1].box.w) : flow[i].box.y - (flow[i - 1].box.y + flow[i - 1].box.h));
    const declared = lay.gap ? (dir === "HORIZONTAL" ? lay.gap[1] : lay.gap[0]) : 0;
    f.itemSpacing = Math.max(0, Math.round(declared || median(gaps.filter((g) => g > -1)) || 0));
    const jc = lay.jc || "normal";
    f.primaryAxisAlignItems = /space-between|space-around|space-evenly/.test(jc) ? "SPACE_BETWEEN" : /center/.test(jc) ? "CENTER" : /end/.test(jc) ? "MAX" : "MIN";
    const ai = lay.ai || "normal";
    f.counterAxisAlignItems = /center/.test(ai) ? "CENTER" : /end/.test(ai) ? "MAX" : (/baseline/.test(ai) && dir === "HORIZONTAL") ? "BASELINE" : "MIN";
    // a wrapping row the browser laid out on ONE line stays one line here:
    // Figma's slightly wider buttons would otherwise tip it onto two
    const oneLine = flow.length > 1 && flow.every((k) => Math.abs(k.box.y - flow[0].box.y) < 3);
    if ((lay.wrap || lay.d === "grid" && (lay.cols || 1) > 1) && !(dir === "HORIZONTAL" && oneLine)) { f.layoutWrap = "WRAP"; f.counterAxisSpacing = lay.gap ? (dir === "HORIZONTAL" ? lay.gap[0] : lay.gap[1]) : f.itemSpacing; }
    f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO";
  }

  let VIEW_H = Infinity;
  async function autoKids(n, frame) {
    // a table row the capture's viewport cut in half is not content: drop it
    const kids = (n.kids || []).filter((k) => !(k.comps && k.comps.some((c) => /^(ShellTweaker|DemoTweaker|Tweaker)/.test(c.n))) && !(k.tag === "tr" && k.box.y + k.box.h > VIEW_H + 1));
    const mixed = (n.text && n.text.length && kids.length) || (n.text && n.text.length > 1) || (n.input && !kids.length);
    if (mixed || !kids.length && n.text) {
      // inline mixes (text beside a link, "7 of 60") keep the browser's
      // geometry inside this one frame
      const was = AUTO; AUTO = false;
      frame.layoutMode = "NONE";
      frame.resize(Math.max(1, n.box.w), Math.max(1, n.box.h));
      await renderKids(n, frame, n.box.x, n.box.y);
      AUTO = was;
      return;
    }
    // display:contents wrappers have no box, so the extractor hoists their
    // children: a row of two columns arrives as four children, two pairs
    // sharing an x. Regroup children that overlap on the row's own axis into
    // stacks (and side-by-side children of a column into rows).
    const lay0 = n.lay || {};
    const rowish = lay0.d === "flex" && /row/.test(lay0.dir || "row");
    const colish = lay0.d === "flex" && /column/.test(lay0.dir || "");
    const flowKids = kids.filter((k) => k.pos !== "absolute" && k.pos !== "fixed");
    const cluster = (axis) => {
      const sorted = flowKids.slice().sort((a, b) => a.box[axis] - b.box[axis]);
      const groups = [];
      for (const k of sorted) {
        const g = groups[groups.length - 1];
        const lo = k.box[axis], hi = k.box[axis] + (axis === "x" ? k.box.w : k.box.h);
        if (g && lo < g.hi - 1) { g.items.push(k); g.hi = Math.max(g.hi, hi); } else groups.push({ items: [k], hi });
      }
      return groups;
    };
    if ((rowish || colish) && flowKids.length >= 3) {
      const groups = cluster(rowish ? "x" : "y");
      if (groups.length >= 2 && groups.some((g) => g.items.length > 1)) {
        const synth = groups.map((g) => {
          if (g.items.length === 1) return g.items[0];
          const items = g.items.slice().sort((a, b) => rowish ? a.box.y - b.box.y : a.box.x - b.box.x);
          const box = { x: Math.min(...items.map((k) => k.box.x)), y: Math.min(...items.map((k) => k.box.y)) };
          box.w = Math.max(...items.map((k) => k.box.x + k.box.w)) - box.x; box.h = Math.max(...items.map((k) => k.box.y + k.box.h)) - box.y;
          const gaps = items.slice(1).map((k, i) => rowish ? k.box.y - (items[i].box.y + items[i].box.h) : k.box.x - (items[i].box.x + items[i].box.w));
          return { tag: "div", box, kids: items, lay: { d: "flex", dir: rowish ? "column" : "row", gap: [Math.max(0, median(gaps)), Math.max(0, median(gaps))], pad: [0, 0, 0, 0], jc: "normal", ai: "normal" } };
        });
        const out = kids.filter((k) => k.pos === "absolute" || k.pos === "fixed");
        return autoKids(Object.assign({}, n, { kids: synth.concat(out) }), frame);
      }
    }
    layoutFrom(frame, n, kids);
    // DOM order is layout order; only out-of-flow children paint by z, last
    const flow = kids.filter((k) => k.pos !== "absolute" && k.pos !== "fixed");
    const out = kids.filter((k) => k.pos === "absolute" || k.pos === "fixed").sort((a, b) => (a.z || 0) - (b.z || 0));
    // ONE big gap in a row is an auto margin (ml-auto pushing a group to the
    // end): split the row into a start group and an end group, space-between.
    if (frame.layoutMode === "HORIZONTAL" && flow.length >= 3 && frame.primaryAxisAlignItems !== "SPACE_BETWEEN") {
      const gaps = flow.slice(1).map((k, i) => k.box.x - (flow[i].box.x + flow[i].box.w));
      const base = frame.itemSpacing;
      const big = gaps.map((g, i) => [g, i]).filter(([g]) => g > base + 16);
      if (big.length === 1) {
        const cut = big[0][1] + 1;
        const groups = [flow.slice(0, cut), flow.slice(cut)];
        const small = gaps.filter((g, i) => i !== big[0][1]);
        frame.primaryAxisAlignItems = "SPACE_BETWEEN";
        for (const [gi, g] of groups.entries()) {
          const box = { x: Math.min(...g.map((k) => k.box.x)), y: Math.min(...g.map((k) => k.box.y)) };
          box.w = Math.max(...g.map((k) => k.box.x + k.box.w)) - box.x; box.h = Math.max(...g.map((k) => k.box.y + k.box.h)) - box.y;
          const gn = { tag: "div", box, kids: g, lay: { d: "flex", dir: "row", gap: [0, small.length ? median(small) : base], pad: [0, 0, 0, 0], jc: "normal", ai: (n.lay && n.lay.ai) || "center" } };
          const gf = figma.createFrame(); gf.name = gi === 0 ? "start" : "end"; gf.fills = [];
          frame.appendChild(gf);
          await autoKids(gn, gf);
          try { gf.layoutSizingHorizontal = "HUG"; gf.layoutSizingVertical = "HUG"; } catch (e) {}
        }
        for (const k of out) await renderAuto(k, frame, n);
        return;
      }
    }
    for (const k of flow.concat(out)) await renderAuto(k, frame, n);
  }

  async function renderAuto(n, parent, pn) {
    if (n.comps && n.comps.some((c) => /^(ShellTweaker|DemoTweaker|Tweaker)/.test(c.n))) return null;
    try {
      let made = null;
      for (const m of MAP) {
        if (m.when(n)) {
          overlayQueue = [];
          made = await m.make(n, parent, 0, 0, (nn, body) => autoKids(nn, body));
          if (made) { overlayQueue = []; break; }
        }
      }
      if (!made && n.svg) made = await makeSvg(n, parent, 0, 0);
      if (!made && n.img) made = await makeImg(n, parent, 0, 0);
      if (!made && !n.v && !n.clip && n.text && n.text.length === 1 && !n.kids && !n.input) {
        // a bare text element is just its text node
        const t = await makeText(n.text[0], n.font, parent, 0, 0);
        t.name = nice(n) || t.name;
        if (isAL(parent)) {
          if ((n.text[0].lines || 1) > 1 && !(n.font && n.font.nowrap)) { t.textAutoResize = "HEIGHT"; t.layoutSizingHorizontal = "FILL"; }
          else if (t.textTruncation === "ENDING") { t.layoutSizingHorizontal = "FILL"; }
          else t.textAutoResize = "WIDTH_AND_HEIGHT";
        }
        return t;
      }
      if (!made) {
        const kids = n.kids || [];
        // a wrapper that paints nothing and holds one child is that child
        // (never a table cell: its width IS the column, painted or not)
        if (!n.v && !n.clip && !n.lay && kids.length === 1 && !n.text && !n.hook && !/^(td|th)$/.test(n.tag)) return await renderAuto(kids[0], parent, pn);
        const f = figma.createFrame();
        f.name = nice(n) || n.tag;
        f.fills = [];
        applyVisual(f, n.v, n.box);
        f.clipsContent = !!n.clip;
        parent.appendChild(f);
        await autoKids(n, f);
        made = f;
      }
      if (n.pos === "absolute" || n.pos === "fixed") {
        if (isAL(parent)) { made.layoutPositioning = "ABSOLUTE"; made.x = n.box.x - pn.box.x; made.y = n.box.y - pn.box.y; }
        return made;
      }
      sizeIn(made, n, parent, pn);
      // Margins: auto layout has none per child, so a child that sits inside
      // its parent's content edge (an indented sub-list, mx-3) is wrapped in
      // a frame padded by exactly that margin.
      if (isAL(parent) && parent.layoutMode === "VERTICAL" && parent.counterAxisAlignItems === "MIN" && pn) {
        const pad = (pn.lay && pn.lay.pad) || [0, 0, 0, 0];
        const bw = pn.v && pn.v.border ? pn.v.border.map((b) => b.w || 0) : [0, 0, 0, 0];
        const left = pn.box.x + pad[3] + bw[3], right = pn.box.x + pn.box.w - pad[1] - bw[1];
        const ml = Math.round(n.box.x - left), mr = Math.round(right - (n.box.x + n.box.w));
        if (ml > 1 && ml < pn.box.w / 2) {
          const w = figma.createFrame(); w.name = "inset"; w.fills = []; w.layoutMode = "VERTICAL";
          w.paddingLeft = ml; w.paddingRight = Math.max(0, mr);
          parent.insertChild(parent.children.indexOf(made), w);
          const wasFill = made.layoutSizingHorizontal === "FILL";
          w.appendChild(made);
          try { w.layoutSizingHorizontal = "FILL"; w.layoutSizingVertical = "HUG"; if (wasFill || mr <= 1) made.layoutSizingHorizontal = "FILL"; } catch (e) {}
          return w;
        }
      }
      return made;
    } catch (e) {
      stats.errors.push("auto " + (n.hook || n.tag) + ": " + String(e).slice(0, 100));
      return null;
    }
  }

  // Build ONE subtree of a spec as an auto-layout frame (the start of a
  // master). `pick` finds the node: { hook } or { comp } or a function.
  async function buildAuto(specPath, pick, opts = {}) {
    const spec = typeof specPath === "string" ? await (await fetch(`${BASE}/${specPath}`)).json() : specPath;
    let target = null;
    const test = typeof pick === "function" ? pick : (n) => (pick.hook && n.hook === pick.hook) || (pick.comp && n.comps && n.comps.some((c) => c.n === pick.comp));
    const w = (n) => { if (target) return; if (test(n)) { target = n; return; } (n.kids || []).forEach(w); };
    w(spec.root);
    if (!target) return { error: "not found" };
    VIEW_H = spec.h || Infinity;
    const page = await pageNamed(opts.page || "DS rebuild · scratch");
    const host = figma.createFrame();
    host.name = "host"; host.fills = []; host.layoutMode = "VERTICAL"; host.primaryAxisSizingMode = "AUTO"; host.counterAxisSizingMode = "AUTO";
    page.appendChild(host);
    AUTO = true;
    const fake = { box: { x: target.box.x, y: target.box.y, w: target.box.w, h: target.box.h }, lay: { d: "flex", dir: "column", pad: [0, 0, 0, 0] } };
    const made = await renderAuto(target, host, fake);
    AUTO = false;
    if (!made) { host.remove(); return { error: "render failed", errors: stats.errors.slice(0, 5) }; }
    page.appendChild(made);
    try { if (isAL(made)) { made.layoutSizingHorizontal = "FIXED"; made.resize(target.box.w, made.height); } } catch (e) {}
    host.remove();
    made.x = opts.x || 0; made.y = opts.y || 0;
    if (opts.name) made.name = opts.name;
    return { id: made.id, w: made.width, h: made.height, box: target.box, errors: stats.errors.slice(0, 8) };
  }

  // ── public api ───────────────────────────────────────────────────────
  async function pageNamed(name) {
    let p = figma.root.children.find((x) => x.name === name);
    if (!p) { p = figma.createPage(); p.name = name; }
    await p.loadAsync();
    return p;
  }

  async function build(specPath, opts = {}) {
    const t0 = Date.now();
    DEADLINE = opts.budgetMs ? t0 + opts.budgetMs : Infinity;
    const spec = typeof specPath === "string" ? await (await fetch(`${BASE}/${specPath}`)).json() : specPath;
    const page = await pageNamed(opts.page || "DS rebuild");
    const name = opts.name || (typeof specPath === "string" ? specPath.split("/").pop().replace(/\.json$/, "") : "rebuild");
    const old = page.children.find((x) => x.name === name);
    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(spec.w, spec.h);
    frame.clipsContent = true;
    frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    const bodyBg = spec.root.v && spec.root.v.bg && solid(spec.root.v.bg);
    if (bodyBg) frame.fills = [bodyBg];
    page.appendChild(frame);
    frame.x = opts.x !== undefined ? opts.x : (old ? old.x : 0);
    frame.y = opts.y !== undefined ? opts.y : (old ? old.y : 0);
    await renderKids(spec.root, frame, 0, 0);
    if (old && opts.replace !== false) { try { old.remove(); } catch (e) {} }
    frame.setPluginData("dsRebuild", JSON.stringify({ spec: typeof specPath === "string" ? specPath : null, at: new Date().toISOString() }));
    return { id: frame.id, ms: Date.now() - t0, stats };
  }

  async function exportPng(nodeId, outPath, scale = 1) {
    const node = await figma.getNodeByIdAsync(nodeId);
    const bytes = await node.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: scale } });
    const r = await fetch(`${BASE}/${outPath}`, { method: "POST", body: bytes });
    return { status: r.status, bytes: bytes.length };
  }

  return { build, buildAuto, exportPng, lib, icon, reg, stats, pageNamed, _render: render, _setLayerText: setLayerText };
})
