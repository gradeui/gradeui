/**
 * The proposed components: what the proposal module (ds/) adds on top of
 * @brightlocal/ui-components, and why. Each is a candidate for the
 * package or for BrightLocal's own app layer.
 */
export interface ProposedComponent {
  name: string;
  module: string;
  summary: string;
  whenToUse: string;
  composes: string;
}

export const PROPOSED_COMPONENTS: ProposedComponent[] = [
  { name: "AppLayoutShell", module: "proposal-shell", summary: "The app shell: GlobalLayout with the padding cancelled, a sidebar frame and tone system, a sticky header band, and a look preset (Live Site, Subtle Depth, Heavy Depth).", whenToUse: "Every full-page screen with the app sidebar.", composes: "GlobalLayout, GlobalLayoutSidebar, GlobalLayoutContent, SidebarProvider" },
  { name: "ShellTweakerPanel", module: "proposal-shell", summary: "The Alt+T layout tweaker: every shell knob live, session-only, so a reviewer can try a look without an author.", whenToUse: "Prototype chrome only. Off for locked comparison screens.", composes: "Popover, Select, Switch" },
  { name: "ProposalSidebar", module: "proposal-nav", summary: "The navigation model v2: top-level rows are page links, a section's sub rows appear only while inside it, and links come from data (navLinks) rather than markup.", whenToUse: "Inside AppLayoutShell's sidebar slot on every screen.", composes: "Sidebar, SidebarMenu, SidebarMenuButton, SidebarMenuSub, SidebarSwitcher, SidebarAccountDropdown" },
  { name: "PageHeader", module: "proposal-page", summary: "The page header band: breadcrumbs bound to data, title, description, meta row, right-hand actions normalised to one size, and a utility slot for help.", whenToUse: "The header slot of every screen. Breadcrumb root is All Locations, then the location.", composes: "GlobalLayoutContentHeader, Breadcrumb, Button, Tooltip" },
  { name: "StatCard", module: "proposal-page", summary: "A compact metric tile: label, value, delta badge, tone, trend icon, info tooltip. Binds to data.metrics by key.", whenToUse: "Any small metric. Never hand-roll Card plus padding for stats.", composes: "Card, Badge, Tooltip" },
  { name: "HubStatCard", module: "proposal-page", summary: "A hub card with an icon, metric, delta and description that drills through to its area.", whenToUse: "Module cards on a hub or summary page.", composes: "Card, DrillArrow" },
  { name: "HubHeroCard", module: "proposal-page", summary: "A hero card with media, title, description and one or two CTAs.", whenToUse: "The lead card on a landing page.", composes: "Card, Button" },
  { name: "LocationCard", module: "proposal-page", summary: "One location in the All Locations grid: photo with a status pill, name, address, category and phone rows that self-skip when a field is missing. Clicking it carries its dataset into the session before navigating.", whenToUse: "The All Locations grid. Includes a LocationCardSkeleton with the same footprint.", composes: "Card, Badge, Skeleton" },
  { name: "DrillArrow", module: "proposal-page", summary: "The circular drill-down arrow every clickable card wears, flipping to its hover state when the card is hovered. Solid and glass (on-media) variants.", whenToUse: "Any card that navigates.", composes: "Button" },
  { name: "EmptyPrototypePage", module: "proposal-page", summary: "The coming-soon empty state with the mascot, a title and a description.", whenToUse: "Any area that exists in the nav but not yet in the prototype.", composes: "Illustrations (Globey)" },
  { name: "RankGrid", module: "proposal-page", summary: "The Local Search Grid visualisation, and only the visualisation: rows of ranks banded by the DS pin variants, pin size driven by zoom.", whenToUse: "The Local Search Grid page and the hub mini.", composes: "Pin variants" },
  { name: "ModuleScoreCard, InsightCard, AreaInsights", module: "proposal-insights", summary: "The Insights and Actions family: a module's score with its status band, one insight with its recommendation and actions, and the per-area list.", whenToUse: "Insights and Actions pages, and the hub cards that summarise them.", composes: "Card, Accordion, Badge, ScoreDonut" },
  { name: "ScoreDonut", module: "score-donut", summary: "The Location Score ring, coloured by band.", whenToUse: "Anywhere a 0 to 100 score is shown.", composes: "SVG" },
  { name: "MiniStat, MiniStatStrip", module: "mini-stat", summary: "The small insight tile from the Figma reference: sage surface, title and icon, big number with a green delta, muted caption.", whenToUse: "Rows of small insights on landing pages.", composes: "Tokens only" },
  { name: "ReviewFunnel", module: "review-funnel", summary: "The review request funnel (sent, opened, clicked, reviewed) on a Recharts funnel.", whenToUse: "Review Builder and Review Tracker.", composes: "Chart, Recharts FunnelChart" },
  { name: "SourceMark", module: "review-sources", summary: "The review source mark (Google, Facebook, TripAdvisor and the rest) with the capability model beside it: which sources can be replied to and auto-replied to.", whenToUse: "Any list of reviews or sources.", composes: "Icons (social family)" },
  { name: "FacetedFilterMenu, SingleSelectMenu, FacetPopover", module: "facet-menu", summary: "Faceted filtering for tables: a command-style popover per facet with checkboxes, counts and a clear action.", whenToUse: "Review Manager and Review Builder toolbars.", composes: "Popover, Command, Checkbox, Badge" },
  { name: "SideSheetHeader", module: "side-sheet-header", summary: "The header for a side sheet: title, description, close, and an optional action row that stays put while the body scrolls.", whenToUse: "The reply panel and any drawer opened from a table row.", composes: "Sheet, Button" },
  { name: "WizardShell, WizardSteps", module: "wizard-shell", summary: "A multi-step flow shell with a stepper, back and next actions and a review step.", whenToUse: "Campaign and showcase creation flows.", composes: "Card, Button, Progress" },
  { name: "Dropzone", module: "dropzone", summary: "A file drop target with the DS's dashed surface and an upload affordance.", whenToUse: "Any file upload (customer lists, logos).", composes: "Button, Icons" },
  { name: "FeedbackControl, FeedbackScore", module: "feedback-controls", summary: "The rating collectors used in review request previews: stars, thumbs, NPS.", whenToUse: "Campaign previews and the kiosk.", composes: "Rating, ToggleGroup" },
  { name: "PreviewFrame", module: "preview-frame", summary: "A device-shaped frame for previewing an email, SMS, kiosk or web page inside a screen.", whenToUse: "Campaign and showcase previews.", composes: "Tokens only" },
  { name: "GlossaryText, GlossaryTerm", module: "proposal-glossary", summary: "Inline jargon help: the first occurrence of a glossary term in a passage gets a tooltip definition.", whenToUse: "Descriptions and empty states that use product terms.", composes: "Tooltip" },
  { name: "ProposalDataProvider, useProposalData", module: "proposal-data", summary: "The data seam: one object drives the interface (account, user, location, metrics, insights, nav links). Named datasets patch over the defaults; personas pick a dataset.", whenToUse: "Wrap a screen to re-skin it; read it in any component.", composes: "React context" },
];
