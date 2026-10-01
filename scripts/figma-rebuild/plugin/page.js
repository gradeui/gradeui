// Page masters: a DS Global Layout instance dressed as one BrightLocal page,
// from that page's captured spec. Sidebar Content / Footer slots take the
// app's own nav and account row (built in auto-layout from the DOM), the Page
// Header gets the trail, title, description and actions, and the Content Body
// slot takes `content` (a master's component id) or stays empty for examples.
//
// Spacing: the app's AppLayoutShell is tighter than the library's Global
// Layout (sidebar 280 vs 288, content at x 304 / y 136, 952 wide, vs 336 /
// 156, 896). Padding overrides on the instance put content where the app
// does; the components themselves are untouched.
(async (api, specPath, opts = {}) => {
  const spec = typeof specPath === "string" ? await (await fetch(`http://localhost:9228/${specPath}`)).json() : specPath;
  // page header hooks carry a per-page prefix (templates-page-header-title,
  // get-reviews-page-header-title...), so match on the suffix
  const find = (hook) => { let f = null; const suffix = hook.replace(/^reviews-/, "-"); const w = (n) => { if (f) return; if (n.hook === hook || (n.hook && hook.startsWith("reviews-page-header") && n.hook.endsWith(suffix))) { f = n; return; } (n.kids || []).forEach(w); }; w(spec.root); return f; };
  const texts = (n) => { const o = []; const w = (x) => { (x.text || []).forEach((r) => o.push(r.t.trim())); (x.kids || []).forEach(w); }; if (n) w(n); return o.filter(Boolean); };
  const clear = (slot) => { for (const k of slot.children.slice()) { try { k.remove(); } catch (e) { k.visible = false; } } };
  await figma.loadFontAsync({ family: "Inter", style: "Regular" }); await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }); await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  const set = await api.lib("GlobalLayout");
  const gl = set.children.find((c) => /Desktop/.test(c.name)).createInstance();
  gl.name = "Global Layout";
  gl.resize(1280, opts.h || 900);
  const page = await api.pageNamed(opts.page || "Masters · Reviews");
  page.appendChild(gl);

  // spacing to the app's shell
  const pc = gl.findOne((x) => x.name === "Page Container"); pc.paddingLeft = 0; pc.paddingRight = 0;
  const hr = gl.findOne((x) => x.name === "Page Header Region"); hr.paddingLeft = 16; hr.paddingRight = 24;
  const cr = gl.findOne((x) => x.name === "Content Region"); cr.paddingLeft = 16; cr.paddingRight = 24; cr.paddingTop = 36; cr.paddingBottom = 24;
  const ph = gl.findOne((x) => x.name === "Page Header" && x.type === "INSTANCE"); ph.paddingTop = 16; ph.paddingBottom = 0; ph.paddingLeft = 0; ph.paddingRight = 0;
  const glc = gl.findOne((x) => x.name === "Global Layout Content" && x.type === "INSTANCE"); glc.paddingLeft = glc.paddingRight = glc.paddingTop = glc.paddingBottom = 0;

  // sidebar: the app's nav and account row, in the DS Sidebar's slots
  const nav = find("sidebar-content"), foot = find("sidebar-footer");
  const sc = gl.findOne((x) => x.type === "SLOT" && x.name === "Sidebar Content");
  const sf = gl.findOne((x) => x.type === "SLOT" && x.name === "Sidebar Footer");
  const built = {};
  if (nav && sc) {
    const r = await api.buildAuto(spec, (n) => n === nav, { page: page.name, name: "Nav" });
    if (r.id) { clear(sc); const f = await figma.getNodeByIdAsync(r.id); sc.appendChild(f); try { f.layoutSizingHorizontal = "FILL"; } catch (e) {} built.nav = true; }
  }
  if (foot && sf) {
    const r = await api.buildAuto(spec, (n) => n === foot, { page: page.name, name: "Account" });
    if (r.id) { clear(sf); const f = await figma.getNodeByIdAsync(r.id); sf.appendChild(f); try { f.layoutSizingHorizontal = "FILL"; } catch (e) {} built.foot = true; }
  }

  // page header: trail, title, description, actions
  const crumbs = texts(find("reviews-page-header-breadcrumbs")).filter((t) => t !== "…" && t !== "...");
  const bc = ph.findOne((x) => x.type === "INSTANCE" && x.name === "Breadcrumb");
  const bitems = await api.lib("BreadcrumbItem");
  if (bc && bitems) {
    const link = bitems.children.find((c) => c.name === "Variant=Link, State=Default");
    const items = bc.children.filter((c) => c.type === "INSTANCE" && /BreadcrumbItem/.test(c.name));
    // N crumbs: the first N-1 pair booleans on, the ungoverned last item is the Nth
    const props = {};
    // Breadcrumb 6 governs the always-present last item; 1-5 are the pairs
    for (let i = 1; i <= 6; i++) { const k = Object.keys(bc.componentProperties).find((p) => p.startsWith(`Breadcrumb ${i}#`)); if (k) props[k] = i === 6 ? true : i <= crumbs.length - 1; }
    try { bc.setProperties(props); } catch (e) {}
    const shown = items.filter((it) => it.visible);
    for (let i = 0; i < shown.length && i < crumbs.length; i++) {
      try { shown[i].swapComponent(link); } catch (e) {}
      const t = shown[i].findOne((x) => x.type === "TEXT");
      if (t) { try { await figma.loadFontAsync({ family: "Inter", style: "Regular" }); t.fontName = { family: "Inter", style: "Regular" }; t.characters = crumbs[i]; } catch (e) {} }
    }
    built.crumbs = crumbs;
  }
  const title = texts(find("reviews-page-header-title"))[0] || opts.title || "";
  const desc = texts(find("reviews-page-header-description")).join(" ");
  const ht = ph.findOne((x) => x.type === "TEXT" && x.name === "Page Heading");
  if (ht) { try { ht.fontName = { family: "Inter", style: "Semi Bold" }; ht.characters = title; } catch (e) {} }
  const ds = ph.findOne((x) => x.type === "SLOT" && x.name === "Page Header Description");
  if (ds) { const t = ds.findOne((x) => x.type === "TEXT"); if (t) { try { t.fontName = { family: "Inter", style: "Regular" }; t.characters = desc || " "; } catch (e) {} } }
  const acts = find("reviews-page-header-actions");
  const as = ph.findOne((x) => x.type === "SLOT" && x.name === "Page Header Actions");
  if (as) {
    clear(as);
    if (acts) { const r = await api.buildAuto(spec, (n) => n === acts, { page: page.name, name: "Actions" }); if (r.id) { as.appendChild(await figma.getNodeByIdAsync(r.id)); built.actions = true; } }
  }

  // content
  const body = gl.findOne((x) => x.type === "SLOT" && x.name === "Global Layout Content Body");
  if (body) {
    clear(body);
    if (opts.content) { const c = await figma.getNodeByIdAsync(opts.content); const i = c.type === "COMPONENT_SET" ? c.defaultVariant.createInstance() : c.createInstance(); body.appendChild(i); try { i.layoutSizingHorizontal = "FILL"; } catch (e) {} built.content = i.id; }
  }
  return { id: gl.id, title, built };
})
