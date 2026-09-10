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
    id: "togglegroupitem-datahook",
    title: "ToggleGroupItem does not forward dataHook",
    finding:
      "ToggleGroupItem accepts a dataHook prop and drops it, so the items inside a ToggleGroup carry no data-hook of their own. The group gets one, the items do not, which means a test or a capture script cannot address the thing it needs to press. Button has the same shape of problem with unknown data-* props.",
    workaround:
      'Address the item through its ariaLabel instead, as in [aria-label="Table view"] inside the group. That works because ariaLabel IS forwarded, but it couples the selector to a label written for screen readers, which may be reworded.',
    ask: "Forward dataHook from ToggleGroupItem the way ToggleGroup does, or spread unknown data-* props onto the rendered element.",
  },
  {
    id: "sidebar-width",
    title: "Sidebar width is not overridable",
    finding: "SidebarProvider sets --sidebar-width inline (224px when this was logged against 2.20.0; 2.27.0 ships 288px) and the live platform hardcodes the container width, so neither :root variables nor classes reach it. The proposal settled on 280px.",
    workaround: "A stylesheet rule at [data-slot=sidebar-provider] re-declares the variable with !important (app/custom.css), under the fixed and modified engines only.",
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
    id: "content-body-max-width",
    title: "Content body loses its max width when given a style",
    finding: "GlobalLayoutContentBody applies max-width: var(--content-max-width) as an inline style object, then spreads the caller's props after it. A screen that passes any style prop (the Tracker sets a sticky-offset variable) replaces that object, so the body runs full width while the header stays at 1024px.",
    workaround: "app/custom.css restates the max width from the stylesheet with !important.",
    ask: "Merge the caller's style over the max width instead of replacing it, or move the cap to a class.",
  },
  {
    id: "typography-utilities",
    title: "The fourteen Figma typography utilities are missing from the tokens",
    finding: "The DS Figma file defines fourteen typography/* text styles (text-display, text-heading-page, text-heading-section, text-heading-subsection, text-body and its sm, xs and tabular forms, text-label, text-label-sm, text-metric, text-code), each annotated with the code utility it ships as. @brightlocal/tokens 0.12.0 ships none of them, and GlobalLayoutContentHeader styles none of its children, so a page title has no DS-sanctioned class.",
    workaround: "app/custom.css defines all fourteen to the Figma spec, weights bound to the DS ramp variables; the de facto page header uses text-heading-page on an h1.",
    ask: "Ship the fourteen utilities in the tokens preset, and have GlobalLayoutContentHeader apply text-heading-page to a title slot.",
  },
  {
    id: "section-heading-face",
    title: "Section headings lose the brand face",
    finding: "The Figma typography set maps only text-display and text-heading-page to Poppins; text-heading-section and text-heading-subsection (card, dialog and sheet titles) are Inter. A product page then carries the display face once, in the page title, and reads less like BrightLocal than the current product does.",
    workaround: "Under the fixed and modified engines, text-heading-section and the DS card title take the display face. Pure de facto keeps Inter so the two can be compared.",
    ask: "Map text-heading-section to font-display in the tokens.",
  },
  {
    id: "ai-surface",
    title: "No surface or voice treatment for AI-generated content",
    finding: "The DS has no surface, badge or gradient for content written by an assistant, and no guidance on declaring it. The prototype's AI summary needed a distinct look (Ali: styled in its own specific way) plus a clear declaration that it is generated.",
    workaround: "A gradient built from DS tokens (green-50 to white to violet-100), an Insights badge, Globey from the illustrations package, and a one-line disclosure. All app-side.",
    ask: "Define an AI surface (background, badge, disclosure pattern) and the Insights badge as DS tokens and a component.",
  },
  {
    id: "page-header",
    title: "GlobalLayoutContentHeader has no breadcrumbs, utility slot or status row",
    finding: "The DS header gives a back link, title, subtitle and actions. It has no breadcrumbs (Breadcrumb is placed by hand), no help affordance slot, no last-updated row and no way to normalise CTA sizes, so page heights vary between screens.",
    workaround: "The proposal module's PageHeader adds all of those on top of the DS header, with breadcrumbs that bind the location from data and navigate by screen id.",
    ask: "Add breadcrumb, utility and meta slots to GlobalLayoutContentHeader, or bless a PageHeader compound.",
  },
];
