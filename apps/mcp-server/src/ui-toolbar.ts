/**
 * GRADE MCP-APP TOOLBAR — the ONE panel chrome, shared by every view.
 *
 * Single source of truth for the bar that sits at the top of Grade's
 * MCP App panels: pixel-G logo, screen name, a dim readout slot, and
 * the standard controls (light/dark, fullscreen, open in tab). Views
 * compose `GRADE_TOOLBAR_CSS` into their <style> and
 * `GRADE_TOOLBAR_HTML` at the top of #root, then wire behaviour onto
 * the STABLE IDS below. Markup and styles live here so every panel
 * looks identical; behaviour stays in each view (a scaled shell flips
 * mode by re-delivering tool-result; a poster panel swaps an image —
 * same buttons, different verbs).
 *
 * The id contract (do not rename — views wire onto these):
 *   #name      — screen name text
 *   #dim       — dim readout (e.g. "Fit · 57% of 1280px")
 *   #mode-btn  — light/dark toggle  (hidden until wired)
 *   #fs-btn    — fullscreen toggle  (hidden until wired)
 *   #open-btn  — open-in-tab        (hidden until wired)
 *
 * Adopters: preview_screen_scaled (v11+). Next: the poster panel
 * (ui-template.ts) and — once it goes bare-by-default — the standalone
 * preview bundle, whose React header this supersedes.
 *
 * The logo is verbatim from apps/docs/components/grade-logo.tsx
 * (fill=currentColor → inherits the bar's text colour). Keep in sync.
 */

export const GRADE_TOOLBAR_CSS = `
  .bar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; padding: 8px 2px 10px; font-size: 13px;
  }
  .bar .brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .bar .name { font-weight: 500; }
  .bar .dim { opacity: 0.6; margin-left: 8px; font-size: 12px; font-variant-numeric: tabular-nums; }
  .bar .actions { display: flex; gap: 6px; }
  .bar button {
    font: inherit; font-size: 12px; cursor: pointer;
    padding: 4px 10px; border-radius: 8px;
    border: 1px solid light-dark(rgba(0,0,0,0.15), rgba(255,255,255,0.18));
    background: transparent; color: inherit;
  }
  .bar button:hover { background: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.08)); }
`;

export const GRADE_TOOLBAR_HTML = `<div class="bar">
  <div class="brand">
    <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" role="img" aria-label="Grade" style="flex-shrink:0">
      <rect y="4" width="4" height="4"/><rect y="8" width="4" height="4"/><rect y="12" width="4" height="4"/><rect y="16" width="4" height="4"/><rect y="20" width="4" height="4"/><rect y="24" width="4" height="4"/>
      <rect x="4" y="28" width="4" height="4"/><rect x="8" y="28" width="4" height="4"/><rect x="12" y="28" width="4" height="4"/><rect x="16" y="28" width="4" height="4"/>
      <rect x="24" y="20" width="4" height="4"/><rect x="20" y="24" width="4" height="4"/>
      <path d="M20 28H24L22 30L20 32V28Z"/><path d="M24 24H28L26 26L24 28V24Z"/><path d="M4 4H8L6 6L4 8V4Z"/><path d="M22 22L24 20V24H20L22 22Z"/><path d="M2 2L4 0V4H0L2 2Z"/><path d="M18 26L20 24V28H16L18 26Z"/>
      <rect x="28" y="28" width="4" height="4"/><rect x="28" y="24" width="4" height="4"/><rect x="28" y="20" width="4" height="4"/><rect x="28" y="16" width="4" height="4"/><rect x="24" y="16" width="4" height="4"/>
      <path d="M24 4H28V8L26 6L24 4Z"/><path d="M0 28H4V32L2 30L0 28Z"/>
      <rect x="20" y="16" width="4" height="4"/><rect x="16" y="16" width="4" height="4"/><rect x="28" y="4" width="4" height="4"/>
      <path d="M28 0L30 2L32 4H28V0Z"/><path d="M4 24L6 26L8 28H4V24Z"/>
      <rect x="24" width="4" height="4"/><rect x="20" width="4" height="4"/><rect x="16" width="4" height="4"/><rect x="12" width="4" height="4"/><rect x="8" width="4" height="4"/><rect x="4" width="4" height="4"/>
    </svg>
    <span class="name" id="name">Grade screen</span><span class="dim" id="dim"></span>
  </div>
  <div class="actions">
    <button id="mode-btn" title="Toggle light/dark" aria-label="Toggle light/dark" hidden>☾</button>
    <button id="fs-btn" title="Toggle fullscreen" aria-label="Toggle fullscreen" hidden>⤢</button>
    <button id="open-btn" hidden>Open in tab</button>
  </div>
</div>`;
