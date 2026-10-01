// Refresh a master IN PLACE from a newer spec: the component node (and so
// every instance in page masters and examples) stays; its contents and
// layout are swapped for a fresh auto-layout build.
//   content(api, compId, specPath, pick)   - a content master (frame-rooted)
//   drawer(api, compId, specPath, opts)     - a drawer master (Sheet inside)
(async () => {
  const get = (id) => figma.getNodeByIdAsync(id);
  const KEYS = ["layoutMode", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing", "primaryAxisAlignItems", "counterAxisAlignItems", "layoutWrap", "counterAxisSpacing", "fills", "strokes", "strokeWeight", "cornerRadius", "effects", "clipsContent", "primaryAxisSizingMode", "counterAxisSizingMode"];
  async function content(api, compId, specPath, pick) {
    const comp = await get(compId);
    const r = await api.buildAuto(specPath, pick, { page: "Masters · Reviews", name: "refresh-tmp" });
    if (!r.id) return r;
    const f = await get(r.id);
    for (const k of KEYS) { try { if (f[k] !== undefined && f[k] !== figma.mixed) comp[k] = f[k]; } catch (e) {} }
    for (const k of comp.children.slice()) k.remove();
    for (const k of f.children.slice()) comp.appendChild(k);
    try { comp.resize(f.width, f.height); comp.primaryAxisSizingMode = f.primaryAxisSizingMode; comp.counterAxisSizingMode = f.counterAxisSizingMode; } catch (e) {}
    f.remove();
    return { id: comp.id, w: comp.width, h: comp.height };
  }
  async function drawer(api, compId, specPath, opts) {
    const comp = await get(compId);
    const D = eval(await (await fetch("http://localhost:9228/lib/drawer.js")).text());
    const r = await D(api, specPath, Object.assign({ name: "refresh-tmp" }, opts));
    if (!r.id) return r;
    const fresh = await get(r.id);
    const sheet = fresh.children[0];
    for (const k of comp.children.slice()) k.remove();
    comp.appendChild(sheet);
    try { sheet.layoutSizingHorizontal = "FILL"; sheet.layoutSizingVertical = "FILL"; } catch (e) {}
    fresh.remove();
    return { id: comp.id };
  }
  return { content, drawer };
})
