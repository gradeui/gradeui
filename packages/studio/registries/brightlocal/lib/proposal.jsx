// @brightlocal/proposal — the shared proposal module, now a BARREL
// (18 Jul): the components live in sibling files for editability —
//
//   proposal-data.jsx   the data seam (defaults, datasets, provider/hook)
//   proposal-shell.jsx  AppLayoutShell + ShellTweakerPanel + presets
//   proposal-nav.jsx    PROPOSAL_SECTIONS + ProposalSidebar (nav model v2)
//   proposal-page.jsx   PageHeader + StatCard/HubStatCard/HubHeroCard
//
// Screens keep importing "@brightlocal/proposal" — this file re-exports
// the lot, so nothing downstream changes. Edit a sibling, re-run
// `node scripts/generate-registry-lib.mjs`, every importing screen
// updates. Lib-to-lib imports resolve through the sandbox's memoized
// requireLib (order-free, cycle-guarded).

export * from "@brightlocal/proposal-data";
export * from "@brightlocal/proposal-shell";
export * from "@brightlocal/proposal-nav";
export * from "@brightlocal/proposal-page";
