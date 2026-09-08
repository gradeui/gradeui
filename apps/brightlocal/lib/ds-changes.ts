/**
 * Proposed changes to @brightlocal/ui-components and @brightlocal/tokens,
 * lifted from the Studio registry's DS-AUDIT.md ledger (the findings log
 * for the upstream report). Each entry: what is wrong, how we work
 * around it here, and what BrightLocal should change.
 */
export interface DsChange {
  id: string;
  title: string;
  finding: string;
  workaround: string;
  ask: string;
}

export const DS_CHANGES: DsChange[] = [
  {
    id: "sidebar-width",
    title: "Sidebar width is not overridable",
    finding: "SidebarProvider sets --sidebar-width to 224px inline and the live platform hardcodes the container width, so neither :root variables nor classes reach it. 224px truncates nav labels.",
    workaround: "A stylesheet rule at [data-slot=sidebar-provider] re-declares the variable with !important (app/globals.css).",
    ask: "Accept a width prop or read a :root token.",
  },
  {
    id: "global-layout-padding",
    title: "GlobalLayout padding is a string literal",
    finding: "p-section-sm is baked into the inner div with no cn() merge, and ScrollArea hardcodes p-1 on its viewport. Neither is prop-overridable, which blocks sticky headers and edge-locked layouts. 2.27.0 moved the padding onto the content and made it responsive, which is the right direction.",
    workaround: "AppLayoutShell zeroes both with scoped important utilities and puts gutters back on the content wrapper.",
    ask: "Run the padding through cn(), or expose it as a prop or variant.",
  },
  {
    id: "sidebar-background",
    title: "The desktop Sidebar paints no background",
    finding: "bg-sidebar-background exists only in the mobile Sheet branch. On desktop the page background shows through, so re-pointing --sidebar-background recolours nothing.",
    workaround: "AppLayoutShell's sidebarTone paints the container directly and sets both the --sidebar-* and --color-sidebar-* variables.",
    ask: "Paint bg-sidebar-background on the desktop branch so the token themes the sidebar.",
  },
  {
    id: "card-max-width",
    title: "Card ships max-w-[400px] in its base classes",
    finding: "Any card meant to span a wider slot silently clamps. The deprecation message on the old maxWidth prop sanctions className max-width utilities as the fix.",
    workaround: "Every full-width card carries max-w-none.",
    ask: "Drop the base max-width, or make it a variant.",
  },
  {
    id: "card-surface",
    title: "Card surface is not white",
    finding: "The tokens map --card to neutral-100, one step below the neutral-50 page background, so a filled Card barely separates from the canvas and, with the transparent card border, has no edge either. Figma's cards are white.",
    workaround: "app/custom.css re-points --card to base white (neutral-900 in dark). The proposal shell did the same per look.",
    ask: "Map card-light to base white, or ship a card surface variant.",
  },
  {
    id: "card-border",
    title: "Card border token is transparent",
    finding: "--ds-colors-card-border-light maps to base-transparent, so the filled Card renders no visible border by default. Figma's card border is base/border (neutral-200), the semantic --border token.",
    workaround: "app/custom.css re-points --card-border to --border, so every Card gets the Figma edge without a per-screen class.",
    ask: "Point card-border at base/border, or document the transparent default.",
  },
  {
    id: "badge-variants",
    title: "Badge has no success, warning or info variants",
    finding: "The live product's Active badge restyles Badge with bg-success-background and text-success-foreground utilities, breaking the no-restyling rule out of necessity.",
    workaround: "That exact className is the one sanctioned exception until the variants ship.",
    ask: "Ship success, warning and info Badge variants.",
  },
  {
    id: "sidebar-separator",
    title: "SidebarSeparator has one fixed rhythm",
    finding: "The generic Separator paints the page border token, harsh inside a toned sidebar. SidebarSeparator is tone-aware but bakes my-5, airier than a tightened nav, and nothing steers composition toward it.",
    workaround: "The proposal sidebar uses SidebarSeparator with the margin overridden.",
    ask: "Give SidebarSeparator a spacing variant like Separator's, and point the Sidebar docs at it.",
  },
  {
    id: "nav-truncation",
    title: "Nav truncation is baked in",
    finding: "SidebarMenuButton and SidebarMenuSubButton hardcode truncation on the label span, and the bordered SidebarMenuSub bakes 40px of right padding per level. Deep or long labels get an ellipsis with no opt-out.",
    workaround: "The proposal nav overrides the truncation class and sub padding through the --gds-nav-* variables.",
    ask: "Make truncation opt-in and the sub-list padding a variant or token. Navigation labels should never truncate.",
  },
  {
    id: "sidebar-overflow-nudge",
    title: "SidebarContent shifts the nav when it overflows",
    finding: "SidebarContent adds pr-2 only when its nav overflows, so the whole nav moves 8px left the moment it becomes scrollable.",
    workaround: "None needed at the prototype's nav length; noted for long navs.",
    ask: "Reserve the gutter unconditionally, or use scrollbar-gutter: stable.",
  },
  {
    id: "chip-vs-badge",
    title: "Chip always renders a remove button",
    finding: "Chip has no non-dismissible mode. It is an input control (filters, selected values), never a status label. Using it as a badge gives every label a remove cross.",
    workaround: "Status labels use Badge; Chip is reserved for filter values.",
    ask: "Document the distinction, or add a static Chip mode.",
  },
  {
    id: "font-weight-ramp",
    title: "The font-weight ramp is shifted one step down",
    finding: "The theme sets normal to 300, medium to 400, semibold to 500 and bold to 600, so DS defaults like CardDescription's font-normal paint at 300, visibly thin in Inter at small sizes.",
    workaround: "Studio re-pointed the ramp to the standard scale for every proposal screen. This app runs the package's own ramp, so weights here are the DS's, and the difference is worth looking at side by side.",
    ask: "Ship the standard ramp: normal 400 through bold 700.",
  },
  {
    id: "bing-icon",
    title: "Bing is missing from the social icon set",
    finding: "@brightlocal/icons' social-media family has no Bing mark, yet the legacy platform ships one through its icon font. A Bing Places connection row cannot show its provider mark from the published package.",
    workaround: "The review sources module carries its own mark.",
    ask: "Port the legacy search-engine icons, Bing at minimum, into the social set.",
  },
  {
    id: "lsg-pin-overlap",
    title: "Local Search Grid pins overlap at low zoom",
    finding: "On the live platform, zooming out lets rank pins collide: pin size is fixed while the grid's geographic spacing shrinks.",
    workaround: "RankGrid derives pin size from zoom and clamps the map to min and max zoom bounds.",
    ask: "Same clamp and zoom-aware pin sizing on the live map.",
  },
  {
    id: "drill-arrow",
    title: "No drill-down arrow affordance component",
    finding: "Every clickable card in the proposal wears the same circular arrow that flips to its hover state when the card is hovered. The DS has no such component and Button has no icon size, so it was hand-rolled at every site before the proposal module exported one.",
    workaround: "The proposal module exports DrillArrow (solid and glass variants).",
    ask: "Publish a drill-down arrow component with solid and on-media looks, plus an icon Button size.",
  },
  {
    id: "page-header",
    title: "GlobalLayoutContentHeader has no breadcrumbs, utility slot or status row",
    finding: "The DS header gives a back link, title, subtitle and actions. It has no breadcrumbs (Breadcrumb is placed by hand), no help affordance slot, no last-updated row and no way to normalise CTA sizes, so page heights vary between screens.",
    workaround: "The proposal module's PageHeader adds all of those on top of the DS header, with breadcrumbs that bind the location from data and navigate by screen id.",
    ask: "Add breadcrumb, utility and meta slots to GlobalLayoutContentHeader, or bless a PageHeader compound.",
  },
];
