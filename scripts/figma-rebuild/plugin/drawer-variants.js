// RM / Drawer · Reply as a VARIANT SET, one variant per panel state the
// prototype has, composed from the masters (pager header, review details,
// quote, composer, actions) plus a DS Alert carrying the code's own copy.
// State data comes from lib/drawer-states.json (read off each state's spec).
(async (api, ids, which) => {
  const get = (id) => figma.getNodeByIdAsync(id);
  const S = await (await fetch("http://localhost:9228/lib/drawer-states.json")).json();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" }); await figma.loadFontAsync({ family: "Inter", style: "Medium" }); await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  const sheetSet = await api.lib("Sheet"), alertSet = await api.lib("Alert"), btnSet = await api.lib("Button"), sepSet = await api.lib("Separator");
  const detailRow = await get(ids.detailRow), stars = await get(ids.stars), status = await get(ids.status), social = await api.lib("SocialIcon");
  const pagerC = await get(ids.pager), quoteC = await get(ids.quote), composerC = await get(ids.composer);
  const VMAP = { primary: "Primary", default: "Primary", outline: "Outline", secondary: "Secondary", ghost: "Ghost", destructive: "Destructive" };
  const text = (s, style = "Regular", size = 14, color = [17, 20, 18]) => { const t = figma.createText(); t.fontName = { family: "Inter", style }; t.fontSize = size; t.lineHeight = { unit: "PIXELS", value: 20 }; t.characters = s; t.fills = [{ type: "SOLID", color: { r: color[0] / 255, g: color[1] / 255, b: color[2] / 255 } }]; return t; };
  const button = (label, variant, disabled) => {
    const v = btnSet.children.find((c) => c.name === `Variant=${VMAP[variant] || "Outline"}, State=${disabled ? "Disabled" : "Default"}, Size=default`) || btnSet.children[0];
    const b = v.createInstance(); const t = b.findOne((x) => x.type === "TEXT"); t.fontName = { family: "Inter", style: "Medium" }; t.characters = label;
    for (const ic of b.children.filter((x) => x.type === "INSTANCE")) ic.visible = false; b.name = "Button · " + label; return b;
  };
  const clear = (slot) => { for (const k of slot.children.slice()) { try { k.remove(); } catch (e) { k.visible = false; } } };
  const details = (d) => {
    const box = figma.createFrame(); box.name = "Review details"; box.layoutMode = "VERTICAL"; box.itemSpacing = 8; box.fills = []; box.primaryAxisSizingMode = "AUTO";
    const key = Object.keys(detailRow.componentPropertyDefinitions).find((k) => k.startsWith("Label#"));
    const src = (d.Source || ["Google"])[0];
    for (const label of ["Source", "Rating", "Date", "Status"]) {
      const i = detailRow.createInstance(); box.appendChild(i); i.layoutSizingHorizontal = "FILL";
      i.setProperties({ [key]: label });
      const slot = i.findOne((x) => x.type === "SLOT"); clear(slot);
      if (label === "Source") { const name = { "Apple Maps": "Apple" }[src] || src; const sv = social.children.find((c) => c.name === `Name=${name}, Colors=Original`); if (sv) { const s = sv.createInstance(); s.resize(16, 16); slot.appendChild(s); } slot.appendChild(text(src)); }
      if (label === "Rating") slot.appendChild(stars.children.find((c) => c.name === `Rating=${d.rating || 5}`).createInstance());
      if (label === "Date") slot.appendChild(text((d.Date || ["September 8, 2026"])[0]));
      if (label === "Status") slot.appendChild(status.children.find((c) => c.name === "Status=" + ((d.Status || ["Needs action"])[0])).createInstance());
    }
    return box;
  };
  const alert = (a) => {
    const v = alertSet.children.find((c) => c.name === `Variant=${a.variant === "destructive" ? "Destructive" : a.variant === "warning" ? "Warning" : a.variant === "success" ? "Success" : "Info"}`);
    const i = v.createInstance(); i.name = "Alert · " + a.title;
    const desc = a.buttons.reduce((s, b) => s.replace(b, "").trim(), a.desc || "");
    i.setProperties({ "Title Text#26:5": a.title, "Description Text#26:4": desc, "Title#17096:0": true, "Description#17096:3": !!desc, "Icon#17096:5": true, "Button#17096:7": a.buttons.length > 0 });
    if (a.buttons.length) { const b = i.findOne((x) => x.type === "INSTANCE" && x.name === "Button"); const t = b && b.findOne((x) => x.type === "TEXT"); if (t) { t.fontName = { family: "Inter", style: "Medium" }; t.characters = a.buttons[0]; } if (b) for (const ic of b.children.filter((x) => x.type === "INSTANCE")) ic.visible = false; }
    return i;
  };

  const made = [];
  for (const [vname, key, rating] of which) {
    const d = Object.assign({ rating: S[key].rating || rating }, S[key].details, { Status: S[key].details.Status || ["Needs action"] });
    const st = S[key];
    const sh = sheetSet.children.find((c) => c.name === "Breakpoint=md, Position=right").createInstance();
    sh.setProperties({ "Show Header#27228:10": false, "Show Footer#27228:1": st.footer.length > 0, "Show icon#29064:0": false });
    sh.fills = []; sh.resize(640, 900);
    const content = sh.findOne((x) => x.name === "_SheetContent"); content.layoutSizingHorizontal = "FILL"; content.layoutSizingVertical = "FILL";
    content.paddingTop = content.paddingBottom = content.paddingLeft = content.paddingRight = 0; content.itemSpacing = 0;
    const close = sh.findOne((x) => x.name === "Sheet / Close Icon"); if (close) close.visible = false;
    const body = sh.findOne((x) => x.type === "SLOT" && x.name === "Sheet Body"); const foot = sh.findOne((x) => x.type === "SLOT" && x.name === "Sheet Footer");
    body.paddingTop = body.paddingBottom = body.paddingLeft = body.paddingRight = 0; body.itemSpacing = 0; clear(foot); foot.paddingTop = foot.paddingBottom = 16; foot.paddingLeft = foot.paddingRight = 16;
    const pager = pagerC.createInstance(); body.appendChild(pager); pager.layoutSizingHorizontal = "FILL";
    const col = figma.createFrame(); col.name = "Panel body"; col.layoutMode = "VERTICAL"; col.itemSpacing = 16; col.fills = []; col.paddingTop = col.paddingBottom = col.paddingLeft = col.paddingRight = 16; col.primaryAxisSizingMode = "AUTO";
    if (vname === "Sent") {
      const msg = figma.createFrame(); msg.name = "Finished"; msg.layoutMode = "VERTICAL"; msg.fills = []; msg.itemSpacing = 8; msg.primaryAxisSizingMode = "AUTO"; msg.counterAxisAlignItems = "CENTER"; msg.paddingTop = 120;
      msg.appendChild(text("Reply sent", "Semi Bold", 18)); msg.appendChild(text("That was the last one. Nothing else is waiting for a reply.", "Regular", 14, [101, 117, 104]));
      col.appendChild(msg); msg.layoutSizingHorizontal = "FILL";
    } else {
      const parts = [details(d), sepSet.children.find((c) => /Horizontal/.test(c.name) && /Spacing=Default/.test(c.name)).createInstance(), quoteC.createInstance()];
      const al = st.alerts.map(alert);
      const aiAlert = st.alerts.length && /AI drafts/.test(st.alerts[0].title);
      if (!aiAlert) parts.push(...al);
      if (st.composer) parts.push(composerC.createInstance());
      if (aiAlert) parts.push(...al);
      for (const p of parts) { col.appendChild(p); try { p.layoutSizingHorizontal = "FILL"; } catch (e) {} }
    }
    body.appendChild(col); col.layoutSizingHorizontal = "FILL"; col.layoutSizingVertical = "FILL";
    if (st.footer.length) {
      const row = figma.createFrame(); row.name = "Actions"; row.layoutMode = "HORIZONTAL"; row.itemSpacing = 8; row.fills = []; row.primaryAxisAlignItems = "MAX"; row.primaryAxisSizingMode = "FIXED"; row.counterAxisSizingMode = "AUTO";
      for (const f of st.footer) row.appendChild(button(f.label, f.variant, f.disabled));
      foot.appendChild(row); row.layoutSizingHorizontal = "FILL";
    }
    const c = figma.createComponent(); c.name = `State=${vname}`; c.layoutMode = "VERTICAL"; c.resize(640, 900); c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "FIXED"; c.fills = [];
    c.appendChild(sh); sh.layoutSizingHorizontal = "FILL"; sh.layoutSizingVertical = "FILL";
    made.push(c.id);
  }
  return made;
})
