// Plugin-side helpers for turning auto-layout builds (build.js buildAuto)
// into masters: components with text properties, exposed nested DS
// instances and real SLOTs. Fetched and eval'd like batch.js:
//
//   const M = eval(await (await fetch(".../lib/masters.js")).text());
//   const m = await M();
//
// Every helper takes node ids and returns ids, so a master is assembled over
// several small figma_execute calls (the bridge's 30s cap).
(async () => {
  const get = (id) => figma.getNodeByIdAsync(id);
  const byText = (root, re) => root.findOne((n) => n.type === "TEXT" && re.test(n.characters));
  const PAGE = "Masters · Reviews";

  async function page() {
    let p = figma.root.children.find((x) => x.name === PAGE);
    if (!p) { p = figma.createPage(); p.name = PAGE; }
    await p.loadAsync();
    return p;
  }

  // A section on the masters page, created once, stacked down the left.
  async function section(name, x, y, w = 2000, h = 1200) {
    const p = await page();
    let s = p.children.find((n) => n.type === "SECTION" && n.name === name);
    if (!s) { s = figma.createSection(); s.name = name; p.appendChild(s); s.x = x; s.y = y; s.resizeWithoutConstraints(w, h); }
    return s;
  }

  async function toComponent(id, name, description) {
    const n = await get(id);
    const c = figma.createComponentFromNode(n);
    c.name = name;
    if (description) c.description = description;
    return c.id;
  }

  // Bind text layers to TEXT properties: [{ re | name, prop }]
  async function textProps(compId, binds) {
    const c = await get(compId);
    const out = {};
    for (const b of binds) {
      const t = b.name ? c.findOne((n) => n.type === "TEXT" && n.name === b.name) : byText(c, b.re);
      if (!t) { out[b.prop] = "missing"; continue; }
      const key = c.addComponentProperty(b.prop, "TEXT", t.characters);
      t.componentPropertyReferences = Object.assign({}, t.componentPropertyReferences || {}, { characters: key });
      out[b.prop] = key;
    }
    return out;
  }

  // Let an instance's nested DS components be set from the instance panel.
  async function expose(compId, test) {
    const c = await get(compId);
    const hits = c.findAll((n) => n.type === "INSTANCE" && test(n) && n.parent !== c.parent);
    let k = 0;
    for (const h of hits) { try { h.isExposedInstance = true; k++; } catch (e) {} }
    return k;
  }

  // Turn a direct-child frame of a component into a SLOT of the same name,
  // keeping its layout, sizing and children (which become the defaults).
  async function slotify(compId, childName, slotName) {
    const c = await get(compId);
    const f = c.children.find((n) => n.name === childName);
    if (!f) return "no child " + childName;
    const slot = c.createSlot();
    slot.name = slotName || childName;
    const idx = c.children.indexOf(f);
    c.insertChild(idx, slot);
    for (const k of ["layoutMode", "itemSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "primaryAxisAlignItems", "counterAxisAlignItems", "layoutWrap", "counterAxisSpacing", "fills", "strokes", "cornerRadius", "clipsContent"]) {
      try { if (f[k] !== undefined && f[k] !== figma.mixed) slot[k] = f[k]; } catch (e) {}
    }
    for (const k of f.children.slice()) slot.appendChild(k);
    try { slot.layoutSizingHorizontal = f.layoutSizingHorizontal; slot.layoutSizingVertical = f.layoutSizingVertical; } catch (e) {}
    if (f.layoutSizingHorizontal === "FIXED") try { slot.resize(f.width, slot.height); } catch (e) {}
    f.remove();
    return slot.id;
  }

  // Caption + annotation helpers for the example layouts.
  async function label(parent, text, x, y, size = 20) {
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
    const t = figma.createText();
    t.fontName = { family: "Inter", style: "Semi Bold" }; t.fontSize = size; t.characters = text;
    t.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.22, b: 0.2 } }];
    parent.appendChild(t); t.x = x; t.y = y;
    return t.id;
  }
  async function note(parent, text, x, y, w = 600) {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    const t = figma.createText();
    t.fontName = { family: "Inter", style: "Regular" }; t.fontSize = 14; t.lineHeight = { unit: "PIXELS", value: 20 };
    t.characters = text; t.textAutoResize = "HEIGHT"; t.resize(w, t.height);
    t.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.38, b: 0.35 } }];
    parent.appendChild(t); t.x = x; t.y = y;
    return t.id;
  }
  function annotate(node, md) {
    try { node.annotations = [{ labelMarkdown: md }]; return true; } catch (e) { return String(e).slice(0, 80); }
  }

  return { get, page, section, toComponent, textProps, expose, slotify, label, note, annotate, byText };
})
