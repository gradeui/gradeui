# THE REAL TOOLBAR — v12 direction (kill the approximation)

Ali's verdict on the v9–v11 shell chrome: "we are approximating — which
I do not like." Correct. The shell's vanilla bar (src/ui-toolbar.ts) is
a LOOKALIKE of the real header in preview-view/view.tsx — guessed
colours instead of Grade tokens, unicode glyphs instead of lucide
icons. Two sources of truth. INTERIM ONLY.

The de-approximation inverts the layering: the REAL header (the React
one in view.tsx — actual Grade components, tokens, Sun/Moon, the
expand control that already drives host display-mode) stays, UNSCALED,
and the Fit-scaling moves INSIDE the bundle's stage:

- view.tsx gains a `virtualWidth`/`virtualHeight` payload mode: the
  bundle document stays at panel width (header at 1:1), and the STAGE
  becomes an inner srcdoc iframe at the virtual size with the Fit
  transform around it — the same srcdoc-viewport trick, one level
  deeper. The renderer mounts into that inner document (copy the
  bundle's inlined CSS + fonts into it; mount React via a portal or a
  second root).
- The scaled tool then points at the SAME resource as preview_screen
  (payload differs: virtualWidth set). The shell template and
  ui-toolbar.ts RETIRE. One panel app, one toolbar, zero duplication.
- TOOLBAR VIEWPORT SELECTOR (this view only): with the source + theme
  already in-panel, switching device is purely client-side — the stage
  re-lays its inner srcdoc at the new virtual size (390/768/1280/
  responsive) and re-fits. Reuse the device-dropdown vocabulary the
  Studio canvas toolbar got in the 2026-06-10 de-clutter (same glyphs:
  Smartphone/Tablet/Monitor/MoveHorizontal). Instant responsive review
  inside the conversation, zero tool calls.
- Until then: v10/v11 ships the working approximation, declared as
  such. Don't polish the fake further.

# preview_screen_scaled — COMPLETE (v8, 2026-06-10, very late)

**v8 = the finished article.** One shell header (1:1, unscaled: name +
Fit readout + Open in tab), the screen edge-to-edge below it in the
bare renderer, Fit-scaled, desktop breakpoints, themed. The v7→v8 bug
was the bundle's tool-result handler cherry-picking structuredContent
fields and dropping `bare` — fixed in view.tsx with a keep-in-sync
comment. Remaining niceties live in the polish queue below (shell mode
toggle / fullscreen, viewport presets are FREE via width/height params).

# preview_screen_scaled — SHIPPED & WORKING (v6, 2026-06-10, late)

**"Holy shit it worked."** — the Density Bench rendered live, interactive,
Fit-scaled, Bright Green theme, desktop breakpoints, INSIDE the Claude
MCP panel. The architecture below is no longer a plan; it's the shipped
design. What proved out, in one line each:
- srcdoc iframe = real virtual viewport in-panel (srcdoc_probe, green).
- Renderer bundle (PREVIEW_VIEW_HTML) boots inside it; shell proxies the
  SEP handshake + tool-result down, owns sizing, forwards open-link up.
- Payload = JSX + theme input (few KB, constant-size). No Chromium, no
  PNG, no nested navigation — nothing for any host to refuse.
- v6 routing guard: child traffic must NOT reach the host listener
  (event.source check) or the host sees responses to ids it never sent.

**v7 — the double-chrome fix (first follow-up):** PREVIEW_VIEW_HTML is
a full panel app (own header/footer/mode toggles/sizing — the "944×708"
readout), so nesting it in the Fit-scaled srcdoc frame scales ITS chrome
down 57% alongside the screen, and its internal fit fights the shell's.
Two options, in preference order:
1. `bare` flag — teach the preview-view source (apps/docs/preview-view,
   the thing PREVIEW_VIEW_HTML is generated from) to hide all chrome and
   render the screen edge-to-edge when tool-result carries `bare: true`;
   the scaled tool adds that field; regenerate the bundle. One
   conditional + a rebuild; shell keeps its (unscaled) chrome as the one
   header.
2. A separate bare-renderer bundle build (studio-render-core without the
   panel shell) registered for the scaled view only — cleaner long-term,
   more build plumbing.

Polish queue: standard MCP-app header parity with preview_screen's
panel; dark-mode theme resolution bug (embed defaults to wrong theme in
dark — noted 2026-06-10); flip GRADE_SITE_URL back to production when
deploying; selectable trace text; consider retiring the v1–v4 nested-
navigation path to a capability probe.

# preview_screen_scaled v5 — in-panel renderer + Fit (the post-`kids:0` plan)

**Verdict from 2026-06-10 testing (this is settled — don't re-litigate):**
Claude desktop-family hosts REFUSE nested iframe navigation in MCP App
panels. `frame✓` (iframe onload) fires anyway on the refused empty frame —
it proves nothing. The v4 template's `kids:` probe (cross-origin-legal
`contentWindow.length`) is the honest discriminator and read `kids:0`
throughout. `frameDomains` in `_meta.ui.csp` did not unlock it. Meanwhile
the SAME embed URL renders perfectly when framed in a normal browser
(see `apps/docs/public/frame-sandbox-probe.html` — probe A and B both
paint, Fit-scaled, with the v2 sandbox attrs). The wall is the host, not
the embed. Keep the iframe path in the panel as a capability probe —
hosts that DO allow nesting (claude.ai web, per ui-template v6 notes)
get the true live embed for free.

**Step 0 — DONE, GREEN (2026-06-10, Cowork desktop):** `srcdoc_probe`
rendered "desktop ✓ 1280px viewport" in the panel — srcdoc iframes are
allowed, act as a REAL virtual viewport (media queries matched at
1280px inside a ~700px panel), and the Fit transform applied (57%).
Trace: `srcdoc-v1 · js✓ · fit:57% · srcdoc-load✓`. v5 is fully
green-lit; build it exactly as below. Original probe rationale kept
for posterity:

**Step 0 — verify the srcdoc assumption (5 minutes, before building):**
srcdoc is the load-bearing bet: the host refused NAVIGATION to an
external frame, and srcdoc has no navigation — but some CSP/sandbox
combinations still police it. Probe: a `-srcdoc-probe` template whose
stage is just `<iframe srcdoc="...">` sized 1280×800 containing a
media-query readout (`<span>` styled by `@media (min-width:1024px)` to
read "desktop ✓") plus a trace mark on its onload. If "desktop ✓" shows
in the panel, v5 is green across the board — a srcdoc frame IS a real
viewport at the size you set, which is the whole media-query story.
(Why not Shadow DOM: no viewport of its own — media queries inside
shadow trees evaluate against the document viewport. Why not
embed/object: same nested-browsing-context machinery the host already
refused, usually MORE restricted under CSP.)

**v5 design — render IN the panel, no nesting, no network:**

1. The tool returns `structuredContent: { appSource, themeDraftJson,
   name, width, height, mode }` — the JSX route, like preview_screen.
   A few KB; the payload problem stays dead (the megabyte was always
   the PNG, never the source).
2. The panel resource embeds the EXISTING self-contained renderer
   bundle (`PREVIEW_VIEW_HTML` from `./preview-view-html` — React +
   the @gradeui/ui vocabulary + sucrase, storage-safe, PROVEN
   interactive in this host today) inside an `srcdoc` iframe sized at
   the VIRTUAL resolution (1280×800 default). srcdoc needs no network
   and no origin — sandbox inheritance is irrelevant to it.
3. **Media queries stay honest** (the whole point vs naive div-scaling):
   the srcdoc iframe IS a real 1280px viewport; breakpoints evaluate at
   the virtual width, exactly like the canvas Fit view and the share
   view. The Fit transform (see v4 template's `applyFit()` — reuse it)
   wraps the iframe: scale = panelWidth / virtualWidth, stage height =
   virtualHeight × scale, re-fit on ResizeObserver.
4. **The shell is a postMessage proxy.** The bundle speaks SEP-1865
   JSON-RPC to `window.parent` — which is now the shell, not the host:
   - host → shell: forward `ui/notifications/tool-input` and
     `tool-result` DOWN into the srcdoc frame unchanged.
   - shell → host: forward the bundle's `ui/initialize` /
     `notifications` UP, EXCEPT `size-changed` — intercept it and emit
     the shell's own (post-Fit) size instead, or the host will size the
     panel to the unscaled 1280×800.
   - Keep the v3/v4 trace + boot ticks + `grade:embed-status` listener;
     the bundle could adopt the same beacons later.
5. Keep `ensureShareLink`/`embedUrl` in the tool result for "Open in
   tab" — the full-fat browser experience one click away.
6. Bump to `ui://gradeui-mcp/preview-scaled-v5` (hosts cache by URI).

**Files:** `src/ui-scaled-template.ts` (shell rewrite, ~150 lines),
`src/tools.ts` (`preview_screen_scaled` handler: add appSource +
themeDraftJson to structuredContent — read them the same way
preview_screen's handler does around line ~890), no embed-side changes
needed. The beacons added to `EmbedScreen` (2026-06-10) stay — they
serve the true-nesting hosts and the browser probe.

**Test loop:** rebuild mcp-server → restart connection → fresh
`preview_screen_scaled` call. Success = the bench rendering interactive
and Fit-scaled in the panel, trace reading `scaled-v5 … render✓ fit:57%`.
