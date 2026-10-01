// Plugin-side: import components by key and summarise their API.
(async (keys) => {
  const out = [];
  for (const [label, key, kind] of keys) {
    try {
      const node = await Promise.race([
        kind === "SET" ? figma.importComponentSetByKeyAsync(key) : figma.importComponentByKeyAsync(key),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
      ]);
      let defs = {};
      try { defs = node.componentPropertyDefinitions || {}; } catch (e) { defs = { ERR: { type: String(e).slice(0, 80) } }; }
      const props = Object.entries(defs).map(([k, d]) => {
        if (d.type === "VARIANT") return `${k}(V): ${(d.variantOptions || []).join("|")}`;
        if (d.type === "TEXT") return `${k}(T)='${String(d.defaultValue).slice(0, 30)}'`;
        if (d.type === "BOOLEAN") return `${k}(B)=${d.defaultValue}`;
        return `${k}(${d.type})`;
      });
      const sample = node.type === "COMPONENT_SET" ? (node.defaultVariant || node.children[0]) : node;
      const kids = (n, depth) => ("children" in n && depth > 0) ? n.children.slice(0, 12).map((c) => c.name + ":" + c.type + (depth > 1 && "children" in c && c.children.length ? "{" + kids(c, depth - 1).join(",") + "}" : "")) : [];
      out.push({ label, id: node.id, type: node.type, w: Math.round(sample.width), h: Math.round(sample.height), nVariants: node.type === "COMPONENT_SET" ? node.children.length : undefined, props, kids: kids(sample, 2) });
    } catch (e) { out.push({ label, err: String(e).slice(0, 120) }); }
  }
  return out;
})
