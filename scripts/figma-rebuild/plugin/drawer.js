// Generic drawer master: a DS Sheet dressed from one captured drawer.
// Titled drawers use the Sheet's own header (Title / Description props, its
// close); untitled ones get Drawer / Pager header. The body is the code's
// DrawerBody built in auto-layout; the footer is the code's DrawerFooter.
(async (api, specPath, opts) => {
  const spec = await (await fetch(`http://localhost:9228/${specPath}`)).json();
  const has = (n, name) => n.comps && n.comps.some((c) => c.n === name);
  let panel = null; const w = (n) => { if (panel) return; if ((has(n, "Drawer.Content") || has(n, "DrawerContent") || has(n, "SheetContent")) && n.box.w > 200) { panel = n; return; } (n.kids || []).forEach(w); }; w(spec.root);
  if (!panel) return { error: "no drawer in spec" };
  const find = (root, name) => { let f = null; const v = (n) => { if (f) return; if (has(n, name)) { f = n; return; } (n.kids || []).forEach(v); }; v(root); return f; };
  const texts = (n) => { const o = []; const v = (x) => { (x.text || []).forEach((r) => o.push(r.t.trim())); (x.kids || []).forEach(v); }; if (n) v(n); return o.filter(Boolean); };
  const header = find(panel, "DrawerHeader") || find(panel, "SheetHeader") || find(panel, "SideSheetHeader");
  const title = find(panel, "DrawerTitle") || find(panel, "SheetTitle");
  const desc = find(panel, "DrawerDescription") || find(panel, "SheetDescription");
  const body = find(panel, "DrawerBody") || find(panel, "SheetBody");
  const footer = find(panel, "DrawerFooter") || find(panel, "SheetFooter");
  const clear = (slot) => { for (const k of slot.children.slice()) { try { k.remove(); } catch (e) { k.visible = false; } } };

  const sheetSet = await api.lib("Sheet");
  const sh = sheetSet.children.find((c) => c.name === "Breakpoint=md, Position=right").createInstance();
  const page = await api.pageNamed("Masters · Reviews"); page.appendChild(sh);
  const titled = !!title;
  sh.setProperties({ "Show Header#27228:10": titled, "Show Footer#27228:1": !!footer, "Show icon#29064:0": false, ...(titled ? { "Title Text#220:40": texts(title).join(" "), "Description Text#220:49": desc ? texts(desc).join(" ") : "" } : {}) });
  if (titled && !desc) { const d = sh.findOne((x) => x.type === "TEXT" && x.name === "SheetDescription"); if (d) d.visible = false; }
  sh.fills = []; sh.resize(Math.round(panel.box.w), 900);
  const content = sh.findOne((x) => x.name === "_SheetContent"); content.layoutSizingHorizontal = "FILL"; content.layoutSizingVertical = "FILL";
  const close = sh.findOne((x) => x.name === "Sheet / Close Icon"); if (close) close.visible = titled;
  const bslot = sh.findOne((x) => x.type === "SLOT" && x.name === "Sheet Body"); const fslot = sh.findOne((x) => x.type === "SLOT" && x.name === "Sheet Footer");
  clear(bslot); clear(fslot);
  const out = { titled, title: title ? texts(title).join(" ") : null };
  if (!titled) {
    content.paddingTop = content.paddingLeft = content.paddingRight = 0; content.itemSpacing = 0;
    if (header && opts.pager) { const p = (await figma.getNodeByIdAsync(opts.pager)).createInstance(); bslot.appendChild(p); p.layoutSizingHorizontal = "FILL"; }
  }
  if (body) {
    const r = await api.buildAuto(spec, (n) => n === body, { page: page.name, name: "Body" });
    if (r.id) { const f = await figma.getNodeByIdAsync(r.id); bslot.appendChild(f); try { f.layoutSizingHorizontal = "FILL"; } catch (e) {} out.body = true; }
  }
  if (footer) {
    const r = await api.buildAuto(spec, (n) => n === footer, { page: page.name, name: "Actions" });
    if (r.id) { const f = await figma.getNodeByIdAsync(r.id); fslot.appendChild(f); try { f.layoutSizingHorizontal = "FILL"; } catch (e) {} out.footer = true; }
  }
  const root = figma.createFrame(); root.name = opts.name; root.layoutMode = "VERTICAL"; root.fills = []; root.resize(Math.round(panel.box.w), 900);
  page.appendChild(root); root.appendChild(sh); sh.layoutSizingHorizontal = "FILL"; sh.layoutSizingVertical = "FILL";
  const c = figma.createComponentFromNode(root); c.name = opts.name; c.description = opts.description || "";
  out.id = c.id;
  return out;
})
