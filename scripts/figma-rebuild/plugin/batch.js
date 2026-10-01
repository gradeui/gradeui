// Plugin-side: build a list of jobs into DS pages + sections, export PNGs.
(async (jobs, run, opts = {}) => {
  const B = eval(await (await fetch("http://localhost:9228/builder.js")).text());
  const api = await B({ base: "http://localhost:9228", noImport: true });
  const out = [];
  for (const j of jobs) {
    const t0 = Date.now();
    try {
      let page = figma.root.children.find((p) => p.name === j.page);
      if (!page) { page = figma.createPage(); page.name = j.page; }
      await page.loadAsync();
      let sec = page.children.find((n) => n.type === "SECTION" && n.name === j.section);
      if (!sec) { sec = figma.createSection(); sec.name = j.section; page.appendChild(sec); sec.x = j.sx; sec.y = 0; sec.resizeWithoutConstraints(1440, 1000); }
      for (const old of sec.children.filter((c) => c.name === j.state)) old.remove();
      const r = await api.build(`${run}/specs/${j.state}.json`, { page: j.page, name: j.state + "__tmp", x: 0, y: -5000, replace: false });
      const fr = await figma.getNodeByIdAsync(r.id);
      fr.name = j.state;
      sec.appendChild(fr);
      fr.x = 80; fr.y = j.y;
      const need = j.y + fr.height + 80;
      if (sec.height < need) sec.resizeWithoutConstraints(sec.width, need);
      let exp = null;
      if (!opts.noExport) exp = (await api.exportPng(fr.id, `${run}/figma/${j.state}.png`, 1)).status;
      out.push([j.state, Date.now() - t0, r.stats.nodes, Object.values(r.stats.instances).reduce((a, b) => a + b, 0), r.stats.errors.length, exp]);
      r.stats.nodes = 0; r.stats.instances = {}; r.stats.errors = []; r.stats.fallbacks = 0;
    } catch (e) { out.push([j.state, "ERR " + String(e).slice(0, 120)]); }
  }
  return out;
})
