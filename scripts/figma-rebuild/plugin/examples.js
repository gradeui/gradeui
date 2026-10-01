// Example layouts: page masters composed with their slots filled, overlays
// where the state has one, and numbered callouts naming the master behind
// each region. One call builds one example:
//   ex(api, { name, page: pageMasterId, variant?: {path, props}, drawer?: id, drawerVariant?, callouts: [[n, x, y, label]] , y })
(async () => {
  const PAGE = "Examples · Reviews";
  const get = (id) => figma.getNodeByIdAsync(id);
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }); await figma.loadFontAsync({ family: "Inter", style: "Regular" }); await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  let page = figma.root.children.find((p) => p.name === PAGE);
  if (!page) { page = figma.createPage(); page.name = PAGE; }
  await page.loadAsync();
  const ACCENT = { r: 0.43, g: 0.26, b: 0.93 };

  async function callout() {
    let c = page.findOne((n) => n.type === "COMPONENT" && n.name === "Callout");
    if (c) return c;
    c = figma.createComponent(); c.name = "Callout"; page.appendChild(c); c.x = -400; c.y = 0;
    c.layoutMode = "HORIZONTAL"; c.primaryAxisAlignItems = "CENTER"; c.counterAxisAlignItems = "CENTER"; c.resize(28, 28); c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "FIXED";
    c.cornerRadius = 14; c.fills = [{ type: "SOLID", color: ACCENT }]; c.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; c.strokeWeight = 2;
    c.effects = [{ type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.25 }, offset: { x: 0, y: 2 }, radius: 6, spread: 0, visible: true, blendMode: "NORMAL" }];
    const t = figma.createText(); t.fontName = { family: "Inter", style: "Bold" }; t.fontSize = 13; t.characters = "1"; t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; c.appendChild(t);
    const key = c.addComponentProperty("Number", "TEXT", "1"); t.componentPropertyReferences = { characters: key };
    c.description = "Numbered marker for example layouts; the legend beside the example says which master or slot it points at.";
    return c;
  }

  async function ex(api, o) {
    const C = await callout();
    const key = Object.keys(C.componentPropertyDefinitions)[0];
    let sec = page.children.find((n) => n.type === "SECTION" && n.name === o.section);
    if (!sec) { sec = figma.createSection(); sec.name = o.section; page.appendChild(sec); sec.x = 0; sec.y = o.sectionY || 0; sec.resizeWithoutConstraints(4000, 1400); }
    const f = figma.createFrame(); f.name = o.name; f.fills = []; f.clipsContent = false;
    sec.appendChild(f); f.x = o.x || 80; f.y = o.y || 160;
    const pg = (await get(o.page)).createInstance(); f.appendChild(pg); pg.x = 0; pg.y = 0;
    if (o.variant) {
      const target = pg.findOne((n) => n.type === "INSTANCE" && n.name === o.variant.name);
      if (target) { try { target.setProperties(o.variant.props); } catch (e) { o.err = String(e).slice(0, 80); } } else o.err = "no " + o.variant.name;
    }
    f.resize(pg.width, pg.height);
    if (o.drawer) {
      const scrim = figma.createRectangle(); scrim.name = "Scrim"; scrim.resize(pg.width, 900); scrim.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.5 }]; f.appendChild(scrim);
      const d = await get(o.drawer);
      const comp = d.type === "COMPONENT_SET" ? d.children.find((v) => v.name === o.drawerVariant) || d.defaultVariant : d;
      const di = comp.createInstance(); f.appendChild(di); di.x = pg.width - di.width; di.y = 0;
    }
    for (const [n, x, y] of o.callouts) { const m = C.createInstance(); m.setProperties({ [key]: String(n) }); f.appendChild(m); m.x = x - 14; m.y = y - 14; }
    // legend
    const lg = figma.createFrame(); lg.name = "Legend"; lg.layoutMode = "VERTICAL"; lg.itemSpacing = 14; lg.fills = []; lg.primaryAxisSizingMode = "AUTO"; lg.counterAxisSizingMode = "FIXED"; lg.resize(560, 100);
    sec.appendChild(lg); lg.x = f.x + f.width + 60; lg.y = f.y;
    const h = figma.createText(); h.fontName = { family: "Inter", style: "Semi Bold" }; h.fontSize = 22; h.characters = o.name; lg.appendChild(h);
    if (o.note) { const nt = figma.createText(); nt.fontName = { family: "Inter", style: "Regular" }; nt.fontSize = 14; nt.lineHeight = { unit: "PIXELS", value: 20 }; nt.characters = o.note; nt.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.38, b: 0.35 } }]; lg.appendChild(nt); nt.layoutSizingHorizontal = "FILL"; nt.textAutoResize = "HEIGHT"; }
    for (const [n, , , label] of o.callouts) {
      const row = figma.createFrame(); row.name = "Item " + n; row.layoutMode = "HORIZONTAL"; row.itemSpacing = 12; row.fills = []; row.counterAxisAlignItems = "MIN"; row.primaryAxisSizingMode = "FIXED"; row.counterAxisSizingMode = "AUTO";
      lg.appendChild(row); row.layoutSizingHorizontal = "FILL";
      const m = C.createInstance(); m.setProperties({ [key]: String(n) }); row.appendChild(m);
      const t = figma.createText(); t.fontName = { family: "Inter", style: "Regular" }; t.fontSize = 14; t.lineHeight = { unit: "PIXELS", value: 20 }; t.characters = label; row.appendChild(t); t.layoutSizingHorizontal = "FILL"; t.textAutoResize = "HEIGHT";
      const b = label.indexOf(" · ") > 0 ? label.indexOf(" · ") : label.indexOf(":");
      if (b > 0) t.setRangeFontName(0, b, { family: "Inter", style: "Semi Bold" });
    }
    const right = Math.max(lg.x + lg.width, f.x + f.width) + 80, bottom = Math.max(lg.y + lg.height, f.y + f.height) + 80;
    sec.resizeWithoutConstraints(Math.max(sec.width, right), Math.max(sec.height, bottom));
    return { id: f.id, err: o.err, legend: lg.id };
  }
  return { ex, page };
})
