// Import each [name, kind, key] and keep it alive with one instance on the
// "DS rebuild · library" page; record set/component ids in dsRebuildReg.
(async (items, ms) => {
  let page = figma.root.children.find((p) => p.name === "DS rebuild · library");
  if (!page) { page = figma.createPage(); page.name = "DS rebuild · library"; }
  await page.loadAsync();
  let holder = page.children.find((n) => n.name === "pinned library components");
  if (!holder) { holder = figma.createFrame(); holder.name = "pinned library components"; page.appendChild(holder); holder.layoutMode = "HORIZONTAL"; holder.layoutWrap = "WRAP"; holder.itemSpacing = 24; holder.counterAxisSpacing = 24; holder.paddingTop = holder.paddingLeft = holder.paddingRight = holder.paddingBottom = 40; holder.resize(4000, 100); holder.primaryAxisSizingMode = "FIXED"; holder.counterAxisSizingMode = "AUTO"; }
  const reg = JSON.parse(figma.root.getPluginData("dsRebuildReg") || "{}");
  const out = {};
  for (const [name, kind, key] of items) {
    const s = Date.now();
    try {
      const node = await Promise.race([kind === "SET" ? figma.importComponentSetByKeyAsync(key) : figma.importComponentByKeyAsync(key), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms || 8000))]);
      const comp = node.type === "COMPONENT_SET" ? (node.defaultVariant || node.children[0]) : node;
      if (!holder.findChild((c) => c.name === "pin · " + name)) { const i = comp.createInstance(); i.name = "pin · " + name; holder.appendChild(i); }
      reg[name] = node.id;
      out[name] = [node.id, Date.now() - s];
    } catch (e) { out[name] = ["ERR " + String(e).slice(0, 60), Date.now() - s]; }
  }
  figma.root.setPluginData("dsRebuildReg", JSON.stringify(reg));
  return out;
})
