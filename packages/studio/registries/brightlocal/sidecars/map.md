---
name: MAP_STYLES
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/map"
subcomponents: [MapTypeId, MapLocationPin, MapGridPin, MapClusterPin, mapGridPinColorMap, clusterPinHexColors, createClusterPinSvg, createClusterPinElement, MapControlButton, MapLoadingState, MapErrorState, MapLegend, MapLegendItem, MapPopover, MapPopoverAnchor, MapPopoverContent, useMapStyles, useMapPopoverClick]
props:
  - MapStyleVariant? (default | muted)
  - MapGridPinVariant? (strong | moderate | weak | unranked | error)
  - variant? — TODO(review): type + one-line description from src
  - value? — TODO(review): type + one-line description from src
  - loading? — TODO(review): type + one-line description from src
  - animateIn? — TODO(review): type + one-line description from src
  - icon? — TODO(review): type + one-line description from src
  - iconOnly? — TODO(review): type + one-line description from src
  - onRetry? — TODO(review): type + one-line description from src
  - retryLoading? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Building a Google Maps integration with the BrightLocal Design System Displaying Local Search Grid rank pins on a map Clustering grouped map pins into a pie-chart summary Adding loading/error placeholder states for map containers Building map controls (zoom, locate) as floating overlays Adding a color-coded legend bar to map views Do NOT use for: non-map popovers (use Popover directly); non-map loading states (use Skeleton or Spinner).
aliases: [map pin, grid pin, cluster pin, map marker, map controls, map legend, map loading, map error, local search grid, map]
---

Vendor-agnostic map UI primitives: pins, tooltips, controls, legend, loading/error states.

## Guidance

Vendor-agnostic map UI components for the BrightLocal Design System.

**Pattern: Recipe, not a component.** The design system ships map UI primitives (pins, controls, loading/error states) but does **not** ship a Google Maps wrapper component. Your app owns the map provider, API key, and all Google Maps lifecycle logic. This follows the same approach used by [MUI](https://mui.com/material-ui/react-autocomplete/#google-maps-place), [Ant Design](https://ant.design/docs/react/recommendation), and other major design systems.

### Components

- **MapGridPin** — Circular numbered pin (`size-8`, 32 px) for grid/cluster markers. Semantic ranking variants: `strong` (green), `moderate` (yellow), `weak` (orange), `unranked` (red), `error` (warning icon). Supports a `loading` placeholder state that renders a neutral `bg-accent` circle. Renders as a non-focusable `div` for AdvancedMarkerElement compatibility
- **MapClusterPin** — Cluster pin (40 px) that visualises the ranking distribution of grouped map pins as a pie chart. Each colored sector is proportional to the number of pins with that ranking variant; the total count is displayed in the center. Colors are resolved from design-token CSS custom properties at runtime and match the MapGridPin palette. Use as a React component in stories/UI; for Google Maps integration with `@googlemaps/markerclusterer`, use `createClusterPinElement()` instead
- **MapLocationPin** — Teardrop-shaped SVG marker (38 × 46 px) with a circular icon area (`fill-sky-500`). Defaults to `Store` icon; pass any icon via the `icon` prop. Set `animateIn` for a spring-in entrance animation (`animate-pop-in`, respects `prefers-reduced-motion`). Falls back to the legacy numbered-circle pin when deprecated props (`value`, `variant`, `pulse`) are passed. `ariaLabel` defaults to `"Location"`
- **MapControlButton** — Floating circular icon button for map controls (zoom, locate). Wraps `Button` — uses `outline` variant in light mode and `secondary` in dark mode (switches automatically). Set `iconOnly={false}` for a pill-shaped button with text
- **MapLegend** — Pill-shaped legend bar. Built on a condensed Card (`variant="filled"`). Use with **MapLegendItem** for consistent dot + label entries. Pass `variant` to auto-match MapGridPin colors via the shared `mapGridPinColorMap`, or `color` for custom Tailwind bg class dots. `ariaLabel` defaults to `"Map legend"`
- **MapPopoverContent** — Popover content panel with map-specific defaults: compact sizing (`p-3`), max-width 273 px, `side="top"` placement, `sideOffset={4}`. Focus is **prevented** on open and close by default (keeps focus on the map surface). Override `onOpenAutoFocus`/`onCloseAutoFocus` if standard focus-return behaviour is needed. Close animation is suppressed (`animate-none` + instant opacity) for snappy pin switching. **Always use `List` components** (`List`, `Item`, `ItemContent`, `ItemTitle`, `ItemSubheader`) from `@brightlocal/ui-components/list` for popover content — do not use raw `div` elements
- **MapLoadingState** — Full-size loading placeholder with a theme-aware `MapBackground` image, `border border-border rounded-lg`, and a centered `children` slot for consumer content (e.g. loading spinners or grid pin skeletons). Sets `role="status"` and `ariaLabel` defaults to `"Loading map"`
- **MapErrorState** — Error state with Globey illustration, `title` (default: "We
/* …truncated */
