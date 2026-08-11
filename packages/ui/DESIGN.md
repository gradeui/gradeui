<!-- GENERATED FILE — do not edit by hand.
     Source: foundations/*.md + components/ui/*.md
     Regenerate: pnpm -F @gradeui/ui generate:design -->
---
title: Grade Design System — read this first
audience: any AI agent or developer consuming @gradeui/ui
---

# Grade Design System (@gradeui/ui)

This package is **self-describing**. Everything an agent needs to generate correct
Grade UI ships inside the installed npm package — you do not need the source repo,
the website, or any external docs. Treat this document as the single comprehensive
design spec: read it before generating markup.

## The non-negotiable page scaffold

**A page is an ordered stack of `Section` bands, and every `Section` wraps a `Container`.**

```jsx
<Section scope="inverse" pad="xl">
  <Container maxW="lg">
    {/* content */}
  </Container>
</Section>
```

- `Section` = the full-width themeable band (colour `scope` + vertical `pad`). It is
  ALWAYS full width and never sets a max width.
- `Container` = the measure (centred `maxW` + gutters). For an edge-to-edge band use
  `<Container maxW="full">` — that is how you go full-bleed. **You never omit the Container.**
- This holds for app content regions too, not just marketing pages. `AppShell` is only
  the outer chrome; the regions inside it are still `Section` → `Container`.

**Never hand-roll** `<section className="py-20">` or `<div className="max-w-7xl mx-auto px-6">`.
That raw markup is exactly what `Section` + `Container` replace. Reaching for div-soup
instead of the primitives is the single most common mistake — don't make it.

## How the system is organised

1. **Foundations** (this folder / the sections below) — the *rules* that aren't components:
   themes, colour scopes, expressive accents, typography, spacing & layout.
2. **Components** — every component ships a sidecar (`when_to_use`, `composes_with`,
   `props`, worked examples + anti-patterns). The component reference follows the foundations.
3. **Machine-readable contracts** — `import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts"`
   gives programmatic prop schemas (zod), descriptions, aliases, and composition data.
4. **Theme engine** — `import { generateTheme, GradeThemeProvider } from "@gradeui/ui"`.
5. **Styles** — `import "@gradeui/ui/styles.css"` (precompiled) or wire the source
   `@gradeui/ui/styles/globals.css` into your own Tailwind v4 build.

## Token namespace

Runtime tokens live under `--gds-*` (CSS custom properties), `gds-*` (class prefix),
`--ramp-*` (per-step OKLCH colour ramps), and the active theme is set via the
`data-grade-theme` attribute on `<html>`.

---

# Foundations

The rules that aren't components.

---

---
foundation: themes
import: "@gradeui/ui"
apis: [generateTheme, themeToCSSVars, applyThemeToRoot, GradeThemeProvider, useGradeTheme, builtInThemes, GRADE_PRE_HYDRATION_SCRIPT]
attribute: data-grade-theme
---

# Themes

A Grade theme is a **deterministic `ThemeInput`** — a small, portable description
that the generator expands into the full CSS-variable token set. The same input
always produces the same tokens, so a theme is shareable and reproducible.

## The ThemeInput shape (what you set)

- **hues** — OKLCH hue anchors for the `neutral`, `primary`, and `accent` ramp families.
- **chroma / vibrancy** — colour intensity, backed by the real OKLCH `C` (not a multiplier).
- **intensity** — overall vibrancy of the expressive/accent layer.
- **typography** — font roles (`display` / `body` / `mono` / `accent`) + a modular `scale`.
  See the typography foundation.
- **spacing / density** — base spacing rhythm. See the spacing & layout foundation.

Everything is optional and sparse: an empty `ThemeInput` generates the default
Grade theme. Each ramp family expands to a 50–950 OKLCH ramp (`--ramp-*`), and the
semantic surface/action tokens reference those ramps.

## Applying a theme

```tsx
import { GradeThemeProvider } from "@gradeui/ui";
import "@gradeui/ui/styles.css";

export default function App({ children }) {
  return <GradeThemeProvider>{children}</GradeThemeProvider>;
}
```

- `GradeThemeProvider` / `useGradeTheme` — React provider + hook for the active theme + mode.
- `generateTheme(input)` → tokens; `themeToCSSVars(theme)` / `applyThemeToRoot(theme)` to
  apply them outside React.
- `builtInThemes` — the shipped starter themes.
- `GRADE_PRE_HYDRATION_SCRIPT` — inline in `<head>` to set `data-grade-theme` before paint
  (no flash of the wrong theme).

## Rules

- **Token-bound, never raw.** Generated UI references tokens (`bg-background`,
  `text-foreground`, `text-primary`, the `--gds-*` / `--ramp-*` vars), never literal hex.
  A value that can't be reached through a token can't be re-themed — so don't emit it.
- **Minimum extra tokens, maximum impact.** A handful of named roles re-skin every
  surface. Don't add a token per component per state; assign a role and let surfaces wear it.
- **Determinism is load-bearing.** The theme must stay a pure function of its input.

---

---
foundation: color-scopes
classes: [scope-default, scope-inverse, scope-brand, scope-accent, scope-muted, scope-card]
applies_via: "Section scope=... | className=\"scope-*\""
---

# Colour scopes

A **scope** is a Figma-style *variable mode* scoped to a subtree. It is the primary
way a band changes colour. Putting a `scope-*` class on an element (or `scope` on a
`Section`) re-points the **surface family** — `--background`, `--foreground`, `--card`,
`--popover`, `--muted`, `--muted-foreground`, `--border` — for everything inside it,
while leaving the **action colours** (`--primary` / `--accent` / `--secondary` /
`--destructive`) vivid so a CTA still pops.

Descendants keep using the ordinary tokens (`bg-background`, `text-foreground`,
`bg-card`); only what those tokens *resolve to* changes. This is why you re-tone a
whole band by setting one scope, never by hand-colouring children.

## The scopes

| scope     | what it is                                                        |
|-----------|------------------------------------------------------------------|
| `default` | the page surface (omit `scope` to get this)                      |
| `inverse` | dark band / light text — the marketing flip                     |
| `brand`   | brand-toned surface (remaps from the theme's existing tokens)   |
| `accent`  | accent-toned surface                                             |
| `muted`   | a quiet, low-contrast band                                       |
| `card`    | a raised card-toned band with a hairline top/bottom border      |

`brand` / `accent` / `muted` / `card` remap straight from existing theme tokens — no
new tokens. `inverse` reads two stable mirrors (`--bg-base` / `--fg-base`) so the
fg/bg swap can't form a custom-property cycle.

## Usage

```jsx
// Each distinct band gets its own Section + scope so it's independently themeable.
<Section scope="inverse" pad="xl"><Container maxW="lg">{/* hero */}</Container></Section>
<Section pad="lg"><Container maxW="xl">{/* default-surface features */}</Container></Section>
<Section scope="muted" pad="lg"><Container maxW="xl">{/* quiet logos strip */}</Container></Section>

// Or drop the class on any element:
<div className="scope-brand">{/* re-toned island */}</div>
```

## Rules

- One band, one scope. Don't mix ad-hoc background/text colours inside a scoped band —
  let the scope do the work so the band re-themes as a unit.
- Scopes are for **structural surfaces**. For a loud on-brand splash use the
  **expressive** layer (see that foundation), not a scope.

---

---
foundation: expressive
attributes: [data-expressive, data-expressive-tier]
tokens: [--gds-expressive-bg, --gds-expressive-fg, "--gds-expressive-accent{1..5}-{100,300,700,900}"]
---

# Expressive colours

Expressive colours are a **highlight layer**, not the base UI. They paint *sections* —
marketing banners (including banners inside an app), feature cards, promo strips,
editorial blocks — anywhere you want an on-brand splash that is deliberately louder
than the neutral product chrome.

They are **NOT** for base surfaces, body text, form controls, or anything structural.
The semantic layer (surfaces, actions, borders) and colour **scopes** own the product
UI. Expressive sits on top, scoped to a region. So: "make a promo banner" → reach for
expressive; "build a settings form" → do not.

## The model — 5 accent slots × 4 tiers

Five **positional** accent slots (`accent1` … `accent5`) — names are positions, not
hues, so a slot's colour can be retuned without renaming anything. Each slot resolves
to four bg+fg tiers, each pair legible by construction:

| tier         | background        | foreground        |
|--------------|-------------------|-------------------|
| `superlight` | `{accent}/100`    | `{accent}/900`    |
| `light`      | `{accent}/300`    | `{accent}/900`    |
| `dark`       | `{accent}/700`    | `{accent}/100`    |
| `superdark`  | `{accent}/900`    | `{accent}/100`    |

## Usage

Set the slot + tier on the region; paint with the expressive tokens:

```jsx
<Section pad="xl">
  <Container maxW="lg">
    <div data-expressive="accent3" data-expressive-tier="superdark"
         className="rounded-2xl p-10"
         style={{ background: "var(--gds-expressive-bg)", color: "var(--gds-expressive-fg)" }}>
      {/* promo content — bg + fg come as a legible pair */}
    </div>
  </Container>
</Section>
```

`data-expressive="accentN"` selects the slot; `data-expressive-tier` selects the tier;
`--gds-expressive-bg` / `--gds-expressive-fg` then resolve to that pair. Switch the slot
or tier → the whole region reskins, on-brand, contrast intact.

## Rules

- Expressive = louder-than-chrome highlight regions only. Never base surfaces or controls.
- Always use the **pair** (`bg` + `fg`) so contrast holds; don't pick a background without
  its paired foreground.
- The 5 accent ramps are rebrandable via `--gds-expressive-accent{N}-{100,300,700,900}`.

---

---
foundation: typography
font_roles: [display, body, mono, accent]
steps: [display, h1, h2, h3, h4, h5, h6, body, small, caption]
tokens: ["--text-display", "--text-h1..--text-h6", "--text-body", "--text-small", "--text-caption", "--text-label", "--text-overline", "--font-display", "--font-body", "--font-mono", "--font-accent"]
---

# Typography

Type is theme-owned and token-bound. A style never names a raw font family or a
`tracking-*` utility — it picks a **role** and rides the theme's scale, so it stays
portable and re-themeable.

## Font roles

- **display** — headings / large type (`--font-display`, `font-display` utility).
- **body** — the workhorse (`--font-body`).
- **mono** — code / tabular (`--font-mono`).
- **accent** — supplementary display face for eyebrows, pull quotes, stylised bits
  (`--font-accent`, `font-accent` utility); defaults to Instrument Serif, overridable.

## The step ladder

Named steps that screens actually use, each emitted as a `--text-*` token with its
companion line-height / letter-spacing / weight:

```
display · h1 · h2 · h3 · h4 · h5 · h6 · body · small · caption
```

Plus the supporting tokens `--text-label`, `--text-overline`, and the raw size ladder
(`--text-2xs … --text-7xl`). Size always comes from the modular scale; weight,
leading, and tracking cascade **base default → base style → step override**.

Base styles (the mixers each step inherits from): **Body / Header / Mono / Prose**.
`h*` steps inherit Header; the rest inherit Body. Prose is the typography of a
markdown/rich-text tree (the Tailwind `prose` surface) and reuses the base styles, so
restyling the Header base restyles both app headings and prose headings.

## Usage

Prefer the Section heading parts and semantic elements over hand-sized text:

```jsx
<Section pad="xl">
  <Container maxW="lg">
    <SectionEyebrow>New</SectionEyebrow>      {/* overline / accent */}
    <SectionTitle>Own the components.</SectionTitle>   {/* display / h1 */}
    <SectionSubtitle>Ship on your subscription.</SectionSubtitle>
  </Container>
</Section>
```

## Rules

- **Token-bound, never raw.** Reference roles and `--text-*` steps; don't emit literal
  `font-family`, px sizes, or `tracking-[...]` values.
- **Weight is per style**, not a single global heading knob.
- The modular scale can differ per breakpoint (mobile drops a step); only sizes change,
  leading/tracking/weight ride along.

---

---
foundation: spacing-layout
section_pad: [none, sm, md, lg, xl]
container_maxw: [sm, md, lg, xl, prose, full]
tokens: ["--spacing"]
---

# Spacing & layout

Layout rhythm comes from two primitives, not from ad-hoc padding/margins on bands.

## Section — vertical rhythm

`Section` owns the band's vertical padding via `pad` (responsive `py`):

| pad    | use                                   |
|--------|---------------------------------------|
| `none` | flush band (e.g. full-bleed media)    |
| `sm`   | tight                                 |
| `md`   | compact                               |
| `lg`   | **default** — standard band rhythm    |
| `xl`   | hero / statement band                 |

`Section` is always full width and never sets a max width — that is the Container's job.

## Container — the measure (horizontal)

`Container` centres content and sets gutters via `maxW`:

| maxW    | use                                            |
|---------|------------------------------------------------|
| `sm`    | narrow (focused CTA / form)                    |
| `md`    | medium                                         |
| `lg`    | **default** — standard content measure         |
| `xl`    | wide (feature grids, dense dashboards)         |
| `prose` | long-form reading measure (markdown / article) |
| `full`  | edge-to-edge — full-bleed bands STILL use this |

`Container grid` snaps children to a 12-column grid (`col-span-*` on children).

## Density

Base spacing scales from the theme's `--spacing` density token, so the whole system
re-pitches its rhythm from one knob. Spacing utilities derive from it — don't hardcode
absolute spacing that can't follow the density.

## Rules

- Bands get their vertical rhythm from `Section pad`, their measure from `Container maxW`.
- Full-bleed = `<Container maxW="full">`, **never** omitting the Container.
- Don't hand-roll `py-*` / `max-w-* mx-auto px-*` page wrappers — that's what these replace.

---

# Components

80 components. Each sidecar carries `when_to_use`, `props`, `composes_with`, and worked examples. Programmatic prop schemas are also importable from `@gradeui/ui/contracts`.

---

---
name: Accordion
import: "@gradeui/ui"
subcomponents: [AccordionItem, AccordionTrigger, AccordionContent]
props:
  - Accordion: type: "single" | "multiple" — single keeps one open at a time, multiple lets several be open at once
  - Accordion: collapsible?: boolean — only valid with type="single"; allows the open item to be toggled shut
  - Accordion: defaultValue?: string | string[] — initial open item(s)
  - Accordion: value?: string | string[] — controlled
  - Accordion: onValueChange?: (value: string | string[]) => void
  - AccordionItem: value: string — id used by the open-state machinery
  - AccordionTrigger: children: React.ReactNode — the row label users click to expand
  - AccordionContent: children: React.ReactNode — the body that animates in
when_to_use: Long-form content that would overwhelm if shown all at once — FAQs, settings groups, "what's included" sections, nested help. For tab-style peer views with one always visible, reach for Tabs. For a single show/hide reveal use Collapsible.
composes_with: [Card (as a faq inside a card body), Section primitives]
aliases: [accordion, faq, expand, collapse list, disclosure list, disclosure group, outline group, expandable list, sectionlist]
---

```jsx
<Accordion type="single" collapsible defaultValue="one">
  <AccordionItem value="one">
    <AccordionTrigger>What's included?</AccordionTrigger>
    <AccordionContent>Everything in the design system, plus Studio.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="two">
    <AccordionTrigger>Can I bring my own theme?</AccordionTrigger>
    <AccordionContent>Yes — three hues in, full theme out.</AccordionContent>
  </AccordionItem>
</Accordion>
```

---

---
name: AIChatComposer
import: "@gradeui/ui"
props:
  - value: string — controlled textarea value
  - onChange: (next: string) => void — fires for every textarea change
  - onSend: (text: string, attachments?: ChatAttachment[]) => void — fires when the user submits (Enter or click Send); composer validates that text or attachments exist before firing
  - isLoading?: boolean — disables the textarea + paperclip and swaps Send for Stop
  - onStop?: () => void — fires when the user clicks Stop; without this, Stop renders disabled
  - placeholder?: string
  - maxLength?: number — hard cap passed to the underlying `<textarea>`
  - showHint?: boolean — show the "Press Enter… · Paste images" hint below the card; default true, set false when the host renders its own footer
  - className?: string
when_to_use: The reusable "input card" for any chat surface — auto-growing textarea, image attachments via paperclip and clipboard paste, attachment chips with previews, Send/Stop toggle, controlled value. Drop in below any messages list. Use this when you want the input affordances of `<AIChat>` but you're rendering your own messages list / scrollarea / header (e.g. Studio's left-column chat, where SelectionChip and SettingsPanel sit between messages and composer). For the full canned chat block, use `<AIChat>` instead.
composes_with: [AIChat (uses this internally), Card (host above), ScrollArea (place messages above)]
aliases: [chat composer, chat input, prompt composer, message input]
---

```jsx
const [value, setValue] = useState("");

<AIChatComposer
  value={value}
  onChange={setValue}
  onSend={(text, attachments) => {
    // text is already trimmed; attachments is undefined when none.
    // The composer owns each attachment's previewUrl — don't revoke
    // it yourself, just hand the File objects off (e.g. upload, or
    // build multimodal message parts).
    sendToAssistant(text, attachments?.map((a) => a.file));
    setValue("");
  }}
  isLoading={isStreaming}
  onStop={() => stop()}
  placeholder="Describe a UI…"
/>
```

---

---
name: AIChat
import: "@gradeui/ui"
props:
  - messages?: ChatMessage[] — `{ id, role: "user" | "assistant", content, timestamp, thinking?, steps?, usage?, refs?, actions?, duration? }`; defaults to empty
  - onSendMessage?: (message: string, attachments?: ChatAttachment[]) => void — fires when the user submits via the default composer; ignored if `composerSlot` is set
  - isLoading?: boolean — shows a typing indicator at the bottom of the message list
  - placeholder?: string — composer placeholder text (ignored if `composerSlot` is set)
  - title?: string — header title; defaults to "AI Assistant"
  - titleIcon?: React.ReactNode — optional icon rendered before the title (e.g. `<Sparkles />`)
  - headerTokens?: number — optional session-level token total shown on the right of the header; rendered as "N tokens" with a small gauge icon when set
  - headerEnd?: React.ReactNode — optional arbitrary content appended after `headerTokens` on the right of the header
  - showUsage?: boolean — show the per-turn `usage` strip below the assistant bubble; default false
  - showRefs?: boolean — show the per-turn `refs` strip below the assistant bubble; default false
  - showActions?: boolean — render per-turn `actions` chips when a message has them; default true
  - showDuration?: boolean — render the per-turn wall-clock duration ("2.3s") below the assistant bubble when a message carries `duration`; default false
  - showThinking?: boolean — render the per-turn reasoning ("Thoughts") disclosure above the assistant prose when a message carries `thinking`; collapsed by default, click to expand; default false
  - showSteps?: boolean — render the per-turn step timeline above the assistant prose when a message carries `steps`; collapsed view shows the current running step (or "N steps completed"), click to expand the vertical timeline with status glyphs; default false
  - thinkingPhrase?: string — override the "Thinking" label in the loading indicator
  - suggestedPrompts?: { icon?: React.ReactNode; text: string }[] — empty-state quick prompts (ignored if `emptyStateSlot` is set)
  - emptyStateSlot?: React.ReactNode — replaces the default empty state entirely
  - errorSlot?: React.ReactNode — rendered after the messages list (typically an error banner)
  - composerAboveSlot?: React.ReactNode — rendered between the messages and the composer (selection chip, settings panel)
  - composerBelowSlot?: React.ReactNode — rendered below the composer (disclaimer, char counter)
  - composerSlot?: React.ReactNode — full override of the composer; when provided, `onSendMessage` + `placeholder` are unused
  - bare?: boolean — strip the outer card chrome (background, border, rounded corners) so the chat takes the surface of its container; default false (keeps the canned card look)
  - assistantBubble?: boolean — whether assistant messages render with a bubble (background + border + padding + rounded corners); default true. Set false for a Claude.ai-style chromeless transcript where assistant text sits on the surface and only user turns wear a bubble.
  - className?: string
when_to_use: A flexible chat block — header + scrollable message list + composer. Out of the box it looks like a polished "AI panel"; under it, every region is a slot so hosts can compose richer chat surfaces (e.g. Studio's left column with selection chip + settings panel above the composer, an error banner inline, per-message usage / refs / actions). Per-turn token usage, refs, and actions are optional and gated by `showUsage` / `showRefs` / `showActions` — leave them off for product-facing chats, turn them on for developer-facing ones where transparency matters. Composes with [[AIChatComposer]] (rendered internally; can be slotted in with custom props via `composerSlot`).
composes_with: [Card (host in a sidebar panel), Sheet (mobile drawer), Stack (place above other content), AIChatComposer (internal composer; slot to override)]
aliases: [ai chat, chat panel, chat block, llm chat, assistant panel, copilot chat, ai assistant]
---

```jsx
// Canned use — no slots, no metadata. Matches the original API.
<AIChat
  messages={messages}
  isLoading={loading}
  onSendMessage={(text, attachments) => send(text, attachments)}
/>
```

```jsx
// Developer-facing chat with per-turn usage + refs + a "Rendered in
// preview →" action on assistant turns. `headerTokens` shows a session
// running total. All optional — flip them via your own settings UI.
<AIChat
  title="Ask Grade AI"
  titleIcon={<Sparkles className="h-3 w-3" />}
  headerTokens={sessionTokenTotal}
  showUsage
  showRefs
  messages={messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: textFromParts(m.parts),
    timestamp: new Date(),
    usage: usageFromMetadata(m.metadata),
    refs: refsFromMetadata(m.metadata),
    actions: hasJsxBlock(m)
      ? [{ id: "preview", label: "Rendered in preview →", icon: <Code2 className="h-3 w-3" />, onClick: () => focusPreview() }]
      : undefined,
  }))}
  isLoading={isStreaming}
  thinkingPhrase={rotatingPhrase}
  composerAboveSlot={<><SelectionChip /><SettingsPanel /></>}
  composerBelowSlot={<InputFooter charCount={input.length} limit={1000} />}
  composerSlot={
    <AIChatComposer
      value={input}
      onChange={setInput}
      onSend={handleSend}
      isLoading={isStreaming}
      onStop={stop}
      maxLength={1000}
      showHint={false}
    />
  }
  errorSlot={error && <ErrorBanner error={error} />}
/>
```

---

---
name: AppShell
import: "@gradeui/ui"
role: layout
subcomponents: [AppShellHeader, AppShellNav, AppShellAside, AppShellMain, AppShellFooter]
props:
  - nav?: "none" | "top" | "side" | "three-pane" (default "none") — layout structure
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
when_to_use: |
  The top-level page scaffold for any app-like or marketing layout. Reach for AppShell
  instead of hand-rolling `grid grid-cols-[auto_1fr]` so the layout shape (top nav,
  side nav, three-pane Slack/Mail/Notion shape, constrained vs full-width main) is a
  prop the settings panel can mutate. Don't compose top-level layouts from raw grid
  templates — the four variants below cover most app shapes.

  Pick the `nav` variant from the source:
    nav="none"        — Single column. Marketing landing, login, splash.
    nav="top"         — Top bar + content. Reddit, Twitter chrome.
    nav="side"        — Left nav + content. Linear, Notion sidebar shape.
    nav="three-pane"  — **Narrow icon rail + Aside + Main.** The Slack /
                        WhatsApp / Mail / Plane / Discord / Notion-with-pages
                        shape. ANY time you see a vertical icon rail next to
                        a separate list/sidebar, this is the answer — don't
                        reach for raw `<div className="grid">` with three
                        column tracks.
composes_with: [Stack, Row, Card, Button, Separator, Sidebar, Toolbar, any page content]
aliases: [
  app shell, page shell, layout, app layout, dashboard shell, scaffold,
  navigation split view, navigationsplitview, split view layout,
  safe area view, safeareaview,
  three pane, three-pane, three column, three-column, master-detail-detail,
  rail and sidebar, icon rail, sidebar layout, mail shape, slack shape,
  notion shape, discord shape, whatsapp shape, plane shape
]
notes: |
  Five slots, all CSS-grid placed by `grid-area` so child order doesn't matter:

    AppShellHeader  — <header>; full-bleed across the top
    AppShellNav     — <nav>;    placement="top"|"side"|"none"
    AppShellAside   — <aside>;  middle column in three-pane
    AppShellMain    — <main>;   props: maxWidth ("full"|"container", default "full")
    AppShellFooter  — <footer>; full-bleed across the bottom

  Three-pane sizing: the Aside column reads `--gds-app-shell-aside` (default 320px).
  Override on the AppShell root to tighten or widen:
    style={{ "--gds-app-shell-aside": "245px" }}    // Plane-style
    style={{ "--gds-app-shell-aside": "380px" }}    // WhatsApp-style

  Nav rail in three-pane sizes to its content's intrinsic width (column track is
  `auto`). Add `w-[60px]` etc. to the AppShellNav child so the rail has a stable width.

  All slots support asChild and emit data-gds-part ("app-shell", "app-shell-nav",
  "app-shell-aside", "app-shell-main", "app-shell-header", "app-shell-footer").
  Pure structure — no collapse state, no context. Server-renders cleanly.
  For nav placement="side" + sticky=true (default) the nav gets h-screen + self-scroll,
  so long nav lists don't push main down.
---

```jsx
// nav="side" — classic dashboard: left nav + main.
<AppShell nav="side">
  <AppShellNav placement="side">
    <Sidebar>{/* sidebar items */}</Sidebar>
  </AppShellNav>
  <AppShellMain>
    <Stack gap="lg" className="p-6">
      {/* page content */}
    </Stack>
  </AppShellMain>
</AppShell>
```

```jsx
// nav="three-pane" — Slack / WhatsApp / Mail / Plane shape.
// Narrow icon rail + middle Aside + main content area. Override
// the Aside width via the CSS var on the root.
<AppShell nav="three-pane" style={{ "--gds-app-shell-aside": "260px" }}>
  <AppShellNav placement="side">
    {/* icon rail — stack of icon buttons, ~60px wide */}
    <Stack gap="sm" align="center" className="w-[60px] py-3">
      <RailButton icon={<Home/>} />
      <RailButton icon={<Inbox/>} />
      <RailButton icon={<Settings/>} />
    </Stack>
  </AppShellNav>
  <AppShellAside>
    {/* middle column — chat list, project list, mailbox list */}
    <Sidebar collapsible={false}>
      <SidebarHeader>…</SidebarHeader>
      <SidebarContent>…</SidebarContent>
    </Sidebar>
  </AppShellAside>
  <AppShellMain>
    {/* main content — active chat, active project page, etc. */}
  </AppShellMain>
</AppShell>
```

```jsx
// nav="top" — marketing / docs / settings layout.
<AppShell nav="top">
  <AppShellNav placement="top">
    <Toolbar leading={<Logo/>} trailing={<Avatar/>} />
  </AppShellNav>
  <AppShellMain maxWidth="container">
    <Stack gap="lg" className="py-8">
      {/* page content */}
    </Stack>
  </AppShellMain>
</AppShell>
```

```jsx
// nav="none" — single screen prototype, login, splash.
<AppShell nav="none">
  <AppShellMain maxWidth="container">
    {/* page content */}
  </AppShellMain>
</AppShell>
```

```jsx
// Full chrome — header + three-pane body + footer.
<AppShell nav="three-pane">
  <AppShellHeader>
    <Toolbar leading={<Logo/>} center={<Search/>} trailing={<Avatar/>} />
  </AppShellHeader>
  <AppShellNav placement="side">{/* icon rail */}</AppShellNav>
  <AppShellAside>{/* list pane */}</AppShellAside>
  <AppShellMain>{/* content */}</AppShellMain>
  <AppShellFooter>
    <Row justify="between" className="px-4 py-2 text-xs">© Brand · v1.0</Row>
  </AppShellFooter>
</AppShell>
```

## Anti-patterns

```jsx
// ❌ Hand-rolling a three-pane grid when AppShell nav="three-pane" exists.
//    You lose: the CSS-var Aside sizing knob, the rail's auto-width
//    column track, the grid-area routing that lets you add a Header
//    later without re-doing the grid.
<div className="grid h-screen" style={{ gridTemplateColumns: "60px 280px 1fr" }}>
  <Rail />
  <Sidebar />
  <Main />
</div>

// ✅ The Grade way.
<AppShell nav="three-pane" style={{ "--gds-app-shell-aside": "280px" }}>
  <AppShellNav placement="side"><Rail /></AppShellNav>
  <AppShellAside><Sidebar /></AppShellAside>
  <AppShellMain><Main /></AppShellMain>
</AppShell>
```

```jsx
// ❌ Stacking nav at the top + another nav on the side via raw grid.
//    Use AppShellHeader + nav="side" instead.
<div className="min-h-screen grid" style={{ gridTemplateRows: "auto 1fr" }}>
  <TopBar />
  <div className="grid" style={{ gridTemplateColumns: "260px 1fr" }}>
    <Sidebar />
    <Main />
  </div>
</div>

// ✅ Use AppShellHeader for the full-bleed top bar; pick nav based on
//    what's below it.
<AppShell nav="side">
  <AppShellHeader><Toolbar leading={<Logo/>} trailing={<Avatar/>} /></AppShellHeader>
  <AppShellNav placement="side"><Sidebar /></AppShellNav>
  <AppShellMain><Main /></AppShellMain>
</AppShell>
```

---

---
name: Avatar
import: "@gradeui/ui"
element: span
subcomponents: [AvatarImage, AvatarFallback]
sizes: [2xs, xs, sm, md, lg, xl]
props:
  - size? (2xs | xs | sm | md | lg | xl) — t-shirt scale, 20px → 80px; default md (40px). xs for chat message rows, sm for comments/dense threads, lg/xl for profile headers. Prefer this over h-*/w-* className utilities.
  - AvatarImage: src, alt
  - AvatarFallback: tone? (muted | primary | violet | amber | emerald | sky | rose | plum | lime) — tinted bg/text pair. Reach for explicit tones when each author needs a stable colour mapping (chat avatars, comment threads, member lists); default muted.
  - AvatarFallback: children — initials (or a small icon), rendered while the image loads or when it fails. Initials auto-scale with the avatar's size (~0.4 of the circle; md = 16px) — do NOT add text-* classes to correct their size.
when_to_use: User/entity identity for PEOPLE — profile pictures, author rows, member lists, account headers. Circular by default; the AvatarFallback initials read as a person's name. Always include AvatarFallback so load failure doesn't leave a gap.
composes_with: [Card (in CardHeader), Table cells, Badge (placed next to for status), Skeleton (loading state), Message (in the avatar slot)]
aliases: [profile picture, user image, account image, avatar, person glyph, user avatar, profile image, react native avatar]
notes: |
  Anti-patterns to avoid:

  - DO NOT pass `initials` as a prop on <Avatar> — that prop does not
    exist. Initials are the CHILDREN of <AvatarFallback>:
    `<Avatar><AvatarFallback>AL</AvatarFallback></Avatar>`.
  - DO NOT size with className utilities (h-7 w-7) — use the `size`
    prop so the scale stays on the t-shirt tokens.
  - DO NOT use Avatar for album art, posters, product photos, landscape
    images, or anything that isn't a person. Use <MediaSurface> with the
    appropriate `hint` ("album", "poster", "product", "landscape", etc.) —
    MediaSurface also renders initials-style fallbacks at small sizes
    derived from `alt`, so you don't lose the affordance.
  - DO NOT wrap Avatar inside MediaSurface to get an initials fallback.
    MediaSurface has that built in via `alt` + the size-tiered placeholder.
---

```jsx
<Avatar>
  <AvatarImage src="/ada.jpg" alt="Ada Lovelace" />
  <AvatarFallback>AL</AvatarFallback>
</Avatar>
```

```jsx
// Chat / comment rows — small size + stable per-author tone.
<Avatar size="xs">
  <AvatarFallback tone="violet">A</AvatarFallback>
</Avatar>
<Avatar size="sm">
  <AvatarFallback tone="amber">B</AvatarFallback>
</Avatar>
```

```jsx
// Profile header — large, with image + initials fallback.
<Avatar size="lg">
  <AvatarImage src="/ali.jpg" alt="Ali Driver" />
  <AvatarFallback tone="primary">AD</AvatarFallback>
</Avatar>
```

---

---
name: BackgroundFill
import: "@gradeui/ui"
props:
  - type: "none" | "solid" | "gradient" | "image" | "video" | "shader" — which paint to render (required)
  - color?: string — solid fill; a token name (`primary`, `card`, `muted`, `accent`, `secondary`, `destructive`, `background`, `transparent`) or any CSS colour
  - gradient?: { from?; via?; to?; angle?; shape?; at?; size? } — stops are token names or CSS colours. shape: "linear" (default, uses `angle`, default 135°) | "radial" (uses `at` — CSS position like "top" / "30% 20%", default "center" — and optional `size` like "45rem 50rem", default farthest-corner)
  - src?: string — image or video URL
  - fit?: "cover" | "contain" | "fill" | "none" — object-fit for image/video (default "cover")
  - position?: string — CSS object/background position (default "center")
  - repeat?: boolean — tile the image (background-repeat) instead of a single <img>
  - tileSize?: string — CSS background-size when repeating (e.g. "120px")
  - preset?: string — shader preset id (see ThreeScene)
  - fragmentShader?: string — custom GLSL (takes precedence over preset)
  - palette?: Partial<{ primary; secondary; accent; background }> — shader palette overrides; wrap tokens as `oklch(var(--token))`
  - postPreset?: string | PostPreset — shader post-FX
  - opacity?: number — layer opacity 0–1
  - blendMode?: CSS mix-blend-mode — blend against the frame behind it
  - radius?: "none" | "sm" | "md" | "lg" | "xl" — match the frame's radius so the paint clips cleanly
when_to_use: The background *paint* of a frame — a generative shader, image, video, gradient, repeating texture, or solid token rendered as a layer BEHIND the frame's content. Use it as the first child of a `relative` frame; it paints an `absolute inset-0`, `z-0`, `pointer-events-none` layer, so content carrying `relative z-10` sits on top. This is the canonical way to give any container a rich background — never drop a full-bleed `<ThreeScene>` or `<img>` as a free-standing sibling. For a sized, in-flow media element (a hero card, a thumbnail), use ThreeScene / MediaSurface / VideoPlayer directly instead.
composes_with: [AppShell, Card, Stack, Row, Grid (any relative container), ThreeScene (shader fill), MediaSurface]
aliases: [background, fill, frame fill, backdrop, surface fill, background image, background video, background gradient, background shader, texture, paint]
notes: |
  ## The fill model

  A background is a PROPERTY of a frame, not a node you select — exactly
  like a fill in Figma / Paper. Select the frame; its Fill controls drive
  this layer. BackgroundFill is the render boundary that makes that true.

  ### Required frame setup

  The parent frame must be `relative` (so the `absolute inset-0` layer
  anchors to it) and ideally `overflow-hidden` (so the paint clips to the
  frame's corners). Content that should sit ABOVE the fill needs its own
  stacking context — wrap it `relative z-10`:

    ```jsx
    <Card className="relative overflow-hidden">
      <BackgroundFill type="shader" preset="mesh" opacity={0.3} />
      <div className="relative z-10">…content…</div>
    </Card>
    ```

  ### Why a layer (and why pointer-events-none)

  A solid colour does not strictly need a layer — it could be the frame's
  own `background`. Every other paint (image, video, gradient, shader,
  tiled texture) needs real pixels, so it renders as an absolutely-
  positioned layer. The layer is `z-0` + `pointer-events-none` so it sits
  behind content and never intercepts clicks. It carries
  `data-gds-part="frame-fill"` + `aria-hidden` so Studio treats it as
  chrome (the frame is the selectable unit) and assistive tech skips it.

  ### Type cheat-sheet

    - solid    — `color` (token or CSS colour). Cheapest.
    - gradient — `gradient={{ from, via?, to, angle }}` for linear;
                 `gradient={{ shape: "radial", at: "top", from, to }}` for a radial
                 glow/wash. Tokens get wrapped in oklch() automatically.
    - image    — `src` + `fit` / `position`; set `repeat` (+ `tileSize`) for a tiled texture.
    - video    — `src` (autoplays muted + looped + inline).
    - shader   — `preset` OR `fragmentShader`, + `palette` / `postPreset`. Delegates to ThreeScene.

  Anti-patterns to avoid:

  - DO NOT build gradients with arbitrary-value Tailwind classes —
    `bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.50),white)]`
    renders NOTHING in the Studio preview (no runtime Tailwind compiler) and
    `theme(colors.*)` colours ignore the active Grade theme. Use
    `type="gradient"` with token stops instead — themeable, and it always renders.
  - DO NOT hand-roll `style={{ backgroundImage: "linear-gradient(…)" }}` on the
    frame itself when a BackgroundFill child does the same job — the fill layer
    keeps the paint selectable/editable as a Fill in Studio's inspector.

  `opacity` + `blendMode` apply to every type — the same two controls as
  the inspector's Blending section, so a loud shader/image can be dialled
  back to a subtle wash behind text.
---

```jsx
// Shader background behind a hero, dialled back so text stays readable.
<section className="relative overflow-hidden rounded-xl">
  <BackgroundFill
    type="shader"
    preset="mesh"
    palette={{
      primary: "oklch(var(--primary))",
      secondary: "oklch(var(--accent))",
      accent: "oklch(var(--primary))",
      background: "oklch(var(--foreground))",
    }}
    opacity={0.35}
  />
  <div className="relative z-10 p-12">
    <h1 className="text-4xl font-bold">Build at the speed of thought</h1>
  </div>
</section>
```

```jsx
// Gradient wash on a card.
<Card className="relative overflow-hidden">
  <BackgroundFill type="gradient" gradient={{ from: "primary", to: "accent", angle: 120 }} opacity={0.18} />
  <CardContent className="relative z-10">…</CardContent>
</Card>
```

```jsx
// Radial glow from the top of a hero — the token-true version of the
// classic `radial-gradient(45rem 50rem at top, indigo-50, white)` wash.
<section className="relative overflow-hidden">
  <BackgroundFill
    type="gradient"
    gradient={{ shape: "radial", at: "top", size: "45rem 50rem", from: "primary", to: "background" }}
    opacity={0.2}
  />
  <div className="relative z-10 py-24 text-center">…hero content…</div>
</section>
```

```jsx
// Image background, cover-fit, with a blend mode.
<div className="relative h-64 overflow-hidden rounded-lg">
  <BackgroundFill type="image" src="/hero.jpg" fit="cover" blendMode="multiply" />
  <div className="relative z-10 p-6 text-white">Featured</div>
</div>
```

```jsx
// Tiled texture.
<div className="relative overflow-hidden">
  <BackgroundFill type="image" src="/noise.png" repeat tileSize="160px" opacity={0.08} />
  <div className="relative z-10">…</div>
</div>
```

---

---
name: Badge
import: "@gradeui/ui"
element: div
variants: [default, secondary, destructive, outline, highlight, success, warning, info, success-soft, warning-soft, destructive-soft, info-soft, highlight-soft, success-outline, warning-outline, destructive-outline, info-outline]
props:
  - variant? (see list above)
  - rounded? (default | full) — "full" gives a pill shape
  - All native div HTML attrs
when_to_use: Compact status chips, counts, tags, pills. For higher-signal inline status → use Callout. For solid CTAs → Button. Soft/outline variants are quieter; solid variants are loud.
composes_with: [Card, Table (inside a cell), Avatar (next to it), anywhere inline]
aliases: [chip, tag, pill, label chip, badge, tag view, status pill, token, count badge]
---

```jsx
<Badge>New</Badge>
<Badge variant="success-soft" rounded="full">Active</Badge>
<Badge variant="destructive-outline">Blocked</Badge>
```

---

---
name: Banner
import: "@gradeui/ui"
variants: [default, info, success, warning, destructive, announcement]
props:
  - variant? (default | info | success | warning | destructive | announcement) — intent + tonal direction. `default` is a calm muted strip; `announcement` is a low-alpha brand tint for "new feature" messaging; status variants pick up the soft+deep token pairs.
  - surface? (solid | translucent | glass | glass-strong) — material applied over the variant tint. `glass` for banners that sit over imagery / generative backdrops.
  - align? (start | center | between) — justify behaviour of the inner flex row. Defaults to `between` so the action / dismiss button right-align.
  - sticky?: boolean — stick to the top of the scroll container.
  - dismissible?: boolean — render the trailing X close button. Pair with `onDismiss` to react.
  - onDismiss?: () => void
  - icon?: ReactNode — leading icon slot. NOT inferred from variant; pass what fits the message.
  - action?: ReactNode — trailing slot before dismiss. Usually a `<Button size="sm">` or `<a>`.
  - role?: string — overrides the automatic role mapping (warning/destructive → alert, others → status).
when_to_use: A full-width horizontal strip surfacing system-level state, announcements, or first-run guidance — "you're previewing a draft", "investigating incident", "new feature available", "send your design to Figma". Distinct from Callout (inline boxed message in the layout flow), Toast (transient floating notification), Dialog (modal interrupt). Banner is what lives at the TOP of an AppShellHeader, page, or panel.
composes_with: [AppShellHeader (most common host — banner sits ABOVE the header content), Button (in the action slot), Link (inside the content), Lucide icons (in the icon slot)]
aliases: [banner, notification banner, system banner, header banner, announcement bar, top bar, status bar, promo banner, incident banner, draft banner, first run banner, glass banner, sticky banner]
---

Banner is the "horizontal strip across the top of something" primitive. The shape difference from Callout matters: Callout is an inline boxed message inside layout flow; Banner is full-bleed and meant to anchor at the top of a page, panel, or AppShellHeader.

---

### Scenario 1 — First-run guidance (default)

A one-line hint surfaced the first time a user lands on a tab or screen. Calm muted tint, dismissible, lives above the main content.

```jsx
<Banner
  variant="default"
  dismissible
  onDismiss={dismiss}
  action={
    <a href={pluginUrl} target="_blank" rel="noreferrer" className="text-sm font-medium underline underline-offset-4">
      Get the Grade plugin →
    </a>
  }
>
  Send your design to Figma as live components.
</Banner>
```

This is the canonical replacement for the inline-style `FigmaIntroBanner` that motivated this primitive — same content, but the tint inherits properly from the active theme and the dismiss button gets the same focus-ring treatment as every other interactive element.

---

### Scenario 2 — Incident / warning banner at AppShellHeader top

You need to tell users something is going wrong without interrupting them. Banner with `variant="warning"` (or `destructive` if it's worse) sits at the very top of the AppShell.

```jsx
<AppShell>
  <Banner
    variant="warning"
    sticky
    icon={<AlertTriangle className="h-4 w-4" />}
    action={
      <Button asChild variant="outline" size="sm">
        <a href="/status">Status page</a>
      </Button>
    }
  >
    We're investigating an incident affecting search results. Comments and edits are unaffected.
  </Banner>
  <AppShellHeader>...</AppShellHeader>
  <AppShellMain>...</AppShellMain>
</AppShell>
```

`sticky` so it doesn't scroll away (incidents stay visible). `variant="warning"` gets `role="alert"` automatically — screen readers interrupt to announce it.

---

### Scenario 3 — Announcement banner (brand tint, low-key)

New feature announcement. You want to be noticed but not alarming. The `announcement` variant uses a low-alpha brand tint so the banner reads as "we have news" without competing with the page.

```jsx
<Banner
  variant="announcement"
  dismissible
  onDismiss={dismissAnnouncement}
  icon={<Sparkles className="h-4 w-4" />}
  action={
    <Button asChild size="sm">
      <a href="/components/code">See how →</a>
    </Button>
  }
>
  <strong className="font-medium">New —</strong> Code component lands with diff hero and scroll-triggered reveals.
</Banner>
```

---

### Scenario 4 — Glass banner over a hero image

The marketing site has a hero image and a top banner promoting an event. A solid banner would punch a stripe through the imagery. Glass keeps the image visible.

```jsx
<div className="relative h-screen" style={{ backgroundImage: "url(/hero/teams-shipping.jpg)", backgroundSize: "cover" }}>
  <Banner
    surface="glass"
    sticky
    align="center"
    action={
      <Button size="sm" variant="outline" asChild>
        <a href="/launchweek">Watch the launch →</a>
      </Button>
    }
  >
    GradeUI launch week kicks off 14 June.
  </Banner>
  ...
</div>
```

`surface="glass"` + the default `variant="default"` gives a frosted strip with `--surface-blur-glass` worth of blur. Pair with `align="center"` when the banner has no leading icon — keeps the message visually centered.

---

### Anti-patterns

**DO NOT roll a banner with inline styles or Tailwind soup.**

```jsx
{/* ❌ Wrong token names, no dismiss focus ring, no role mapping, no theme inheritance. */}
<div style={{ background: "oklch(var(--gds-primary) / 0.06)", color: "var(--gds-foreground)" }}>
  Send your design to Figma. <a>Get the Grade plugin →</a>
</div>

{/* ✅ */}
<Banner variant="announcement" dismissible onDismiss={dismiss} action={...}>
  Send your design to Figma.
</Banner>
```

The inline-style original this primitive replaced was effectively invisible because it reached for `--gds-primary` / `--gds-foreground` tokens that don't exist. The fallback values kicked in and the banner washed out completely. Banner exists so this category of mistake is impossible.

**DO NOT use Banner for inline form-level validation.** That's Callout's job — it's a boxed message inside the layout flow. Banner is full-bleed chrome.

**DO NOT use Banner for transient confirmation ("Saved").** That's Toast (Sonner). Banner is persistent until dismissed.

**DO NOT stack multiple Banners.** Two banners reading at the same time fight for attention. If you genuinely need two messages, surface the highest-priority one and queue the second for after the first is dismissed.

**DO NOT pass `role="alert"` on a calm `variant="info"` Banner.** The variant→role mapping is intentional. Info/success/announcement are polite; warning/destructive interrupt. Overriding makes assistive tech behaviour inconsistent with the visual signal.

---

---
name: Breadcrumb
import: "@gradeui/ui"
subcomponents: [BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis]
props:
  - Breadcrumb: aria-label? (defaults to "breadcrumb") — passed to the underlying <nav>
  - Breadcrumb: separator? — **tree-wide default** for every <BreadcrumbSeparator/> inside. Pass a string ("/", "›", "•"), a lucide icon (`<Slash/>`, `<ChevronRight/>`), or any ReactNode. Default: `<ChevronRight/>`. Set once on the root; every separator below picks it up via context.
  - BreadcrumbList: className? — the <ol> wrapper; usually no overrides needed
  - BreadcrumbItem: className? — wraps a single crumb (link or page)
  - BreadcrumbLink: href? — renders as <a> when set, <button> when not; asChild? wraps a custom element
  - BreadcrumbPage: className? — the current page; rendered as a non-interactive <span> with aria-current="page"
  - BreadcrumbSeparator: children? — per-instance override of the separator glyph. When set, beats the root's `separator` prop for this one slot. When not set, falls back to the root's `separator`, then to `<ChevronRight/>`.
  - BreadcrumbEllipsis: className? — collapsed middle crumbs marker, use between BreadcrumbItems
when_to_use: Reach for Breadcrumb whenever a screen sits inside a hierarchy and you want the path back to the top to be visible. Common spots: above page titles in admin/CMS screens, top of Settings detail pages, after a router redirect when the URL implies depth. Use the current page as a <BreadcrumbPage> (non-clickable) and prior levels as <BreadcrumbLink>. For a horizontal "top nav" of peer destinations use Side Menu or Tabs instead — Breadcrumb is strictly for hierarchical path.
composes_with: [AppShellMain, Card (in CardHeader), Dialog]
aliases: [breadcrumb, breadcrumbs, crumbs, path, page hierarchy, path bar, navigation trail, finder path]
---

```jsx
// Two-level path — Dashboard → current page.
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Settings</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

```jsx
// Slash-separated, finder / URL-style. Set once on the root and every
// <BreadcrumbSeparator/> below picks it up via context.
import { Slash } from "lucide-react";

<Breadcrumb separator={<Slash />}>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Article</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

```jsx
// Plain glyph — string children also work.
<Breadcrumb separator="›">…</Breadcrumb>
<Breadcrumb separator="/">…</Breadcrumb>
<Breadcrumb separator="•">…</Breadcrumb>
```

```jsx
// Per-instance override beats the root default. Useful for "different
// separator just before the current page" designs (e.g. an arrow that
// points at the leaf).
import { ArrowRight, ChevronRight } from "lucide-react";

<Breadcrumb separator={<ChevronRight />}>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbLink href="/team">Team</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator><ArrowRight /></BreadcrumbSeparator>
    <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

```jsx
// Deep path with collapsed middle — useful when the path is long.
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/projects/acme">Acme</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Billing</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

---
name: Button
import: "@gradeui/ui"
element: button
variants: [default, destructive, outline, secondary, ghost, link, raised]
sizes: [2xs, xs, sm, md, lg]
props:
  - variant? (default | destructive | outline | secondary | ghost | link | raised) — `raised` here is a back-compat alias (the raised TRAIT on a neutral key surface); prefer the `raised` prop
  - raised?: boolean — presence TRAIT: tactile elevation (bevel + drop + hover glow + pressed sink) layered onto ANY variant — raised primary, raised outline, etc. Glow tone reads --btn-glow → --accent-glow → --selected-glow; override per-button via style={{ "--btn-glow": "var(--warning)" }}
  - size? (2xs | xs | sm | md | lg) — t-shirt scale aligned with Tabs/ToggleGroup heights (2xs=h-5, xs=h-6, sm=h-7, md=h-8, lg=h-10). 2xs/xs are the dense tool-panel sizes (match Figma Button size=2xs/xs). `default` still works as an alias for `md`.
  - iconOnly?: boolean — squares the button at the current `size` height (w = h, no horizontal padding) for icon-only buttons; the icon child is centered. This is THE way to make a square icon button at any density (sm→28², 2xs→20²).
  - asChild?: boolean — renders as the child element (use to wrap <a>/<Link>)
  - disabled?: boolean
  - All native button HTML attrs (onClick, type, etc.)
when_to_use: Any clickable action. Use `iconOnly` for square icon-only buttons (at any size), variant="link" for inline links that should look like Button, the `raised` prop for high-commitment / weighty actions where the chrome can afford a tactile "physical key" treatment (composes with any variant; variant="raised" remains the neutral-key alias). A Button placed next to a TabsList of the same size lines up edge-to-edge without per-call overrides.
composes_with: [Dialog, DropdownMenu, Tooltip, Card (in CardFooter), Row, Form controls]
aliases: [button, push button, plain button, bordered button, destructive button, capsule button, link button, action button, cta, raised button, pill button, key button]
---

```jsx
<Button>Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button iconOnly variant="ghost"><Mail /></Button>
<Button size="sm" iconOnly variant="outline"><Plus /></Button>
```

```jsx
// Lined up next to a TabsList — same size = same height.
<Row gap="sm" align="center">
  <TabsList size="sm">
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="open">Open</TabsTrigger>
  </TabsList>
  <Button size="sm">New issue</Button>
</Row>
```

```jsx
// Raised TRAIT — tactile bevel + drop shadow + ambient hover glow,
// layered onto any variant (raised primary, raised outline, ...).
// Composed from the Presence elevation tokens (--elevation-3 rest,
// --elevation-hot hover, --elevation-pressed active). Tone is driven
// by --btn-glow, which defaults to --selected-glow (blue). Override
// per-button for "traffic light" semantics:
<Row gap="sm">
  <Button raised>Raised primary</Button>
  <Button variant="outline" raised>Raised outline</Button>
  <Button raised style={{ "--btn-glow": "var(--warning)" }}>
    Iterate
  </Button>
  <Button raised style={{ "--btn-glow": "var(--success)" }}>
    Ship it
  </Button>
</Row>
```

```jsx
// data-state="on" / aria-pressed="true" gives the held-down "key
// pressed" look — picks up the --selected blue stroke + heat-inner
// glow. Works as a Toggle/ToggleGroupItem child via asChild.
<Button raised data-state="on">Locked</Button>
```

```jsx
// Combine with Aura for AI-attention states. The three Aura styles
// (ring/gradient/shimmer) stack independently of the variant.
<Button raised className="gds-aura-ring">
  Studio is reviewing this
</Button>
```

---

---
name: Calendar
import: "@gradeui/ui"
subcomponents: [CalendarDayButton]
props:
  - mode?: "single" | "multiple" | "range" — picks one date, several dates, or a [from, to] range
  - selected?: Date | Date[] | { from: Date; to?: Date } — controlled selection; shape matches `mode`
  - onSelect?: (value) => void — fires with the new selection
  - month?: Date — controlled displayed month
  - defaultMonth?: Date — uncontrolled initial month
  - onMonthChange?: (date: Date) => void
  - numberOfMonths?: number (default 1) — render multiple months side by side, useful for range pickers
  - disabled?: Date | Date[] | { before?: Date; after?: Date } | (date: Date) => boolean
  - captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  - className?: string
when_to_use: An inline date grid — date-of-birth pickers in profile forms, scheduling screens with a month view, range selection in reporting filters. For a compact trigger-and-popover input, use DatePicker / DateRangePicker (which wrap Calendar internally). For one-off relative dates ("yesterday", "last week") use a Select instead.
composes_with: [Popover (DatePicker composes them), Card (inline scheduling card), Dialog (full-screen mobile date pick)]
aliases: [calendar, date grid, month view, scheduler grid, calendar view, multidate picker, react native calendars]
---

```jsx
// Single-date inline calendar.
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  captionLayout="dropdown"
/>
```

```jsx
// Two-month range picker — typical reporting filter shape.
<Calendar
  mode="range"
  numberOfMonths={2}
  selected={range}
  onSelect={setRange}
/>
```

---

---
name: Callout
import: "@gradeui/ui"
element: div
subcomponents: [CalloutTitle, CalloutDescription]
variants: [default, destructive, success, warning, info]
props:
  - variant? (default | destructive | success | warning | info) — semantic colouring; `default` is neutral
  - All native div HTML attrs
when_to_use: Inline, ambient, non-blocking status/feedback that sits inside the layout flow. Form-level validation summaries, settings-page notices, page-level banners. NOT a toast (use Sonner for transient). NOT a modal (use Dialog when the user must respond). Put an icon as first child — it's auto-positioned; CalloutTitle + CalloutDescription follow.
composes_with: [lucide-react icons as first child, Button (inside CalloutDescription), Card (as a section callout)]
aliases: [callout, banner, notice, inline alert, in-app notification, status banner, info banner, info callout, warning callout, success callout]
---

Renamed from `Alert` (May 2026). The old name implied modal/interruptive behaviour the component doesn't have — Apple HIG `Alert` is a modal, and `role="alert"` is assertive ARIA. Callout is honest about what it is: ambient, inline, non-blocking. For genuinely interruptive needs, reach for `<Dialog>`.

Variant tokens come from theme (`--destructive-soft`, `--success-deep`, etc.) so they restyle with the active Grade theme.

The icon slot sizes its direct `svg` child to 20px against a 32px text inset (Aug 2026): bare lucide icons default to 24px, which filled the inset and left no icon-to-title gap. Pass icons unsized; a size class on the icon itself loses to the slot. CalloutTitle sits at the description's text-sm size with font-semibold carrying the hierarchy.

```jsx
<Callout variant="warning">
  <AlertTriangle />
  <CalloutTitle>Low disk space</CalloutTitle>
  <CalloutDescription>2GB remaining on /dev/sda1.</CalloutDescription>
</Callout>
```

```jsx
// Ambient success notice — uses role="status" (polite) so screen
// readers don't interrupt the user. Warning/destructive get
// role="alert" (assertive) instead.
<Callout variant="success">
  <CheckCircle2 />
  <CalloutTitle>Profile updated</CalloutTitle>
  <CalloutDescription>Your changes are live.</CalloutDescription>
</Callout>
```

### Anti-patterns

DO NOT use `<Callout>` for interruptive or blocking messages. If the user must respond before continuing, use `<Dialog>` — the modal primitive that Apple HIG calls "Alert" and React Native exposes as `Alert.alert()`. Callout is ambient by design.

DO NOT pass `role="alert"` when the variant is `info` / `success` / `default` — the component already routes those to `role="status"` (polite), and overriding makes screen readers interrupt for non-urgent content.

DO NOT reach for `variant="warning"` to convey "this is just notable / FYI" — that's what `variant="info"` is for. Warning is for things that could go wrong if ignored; info is for ambient context.

The previous `variant="highlight"` (yellow) was dropped in the Alert → Callout rename — it overlapped `warning` semantically without offering a distinct intent. Use `warning` for amber attention and `info` for neutral attention.

---

---
name: Card
import: "@gradeui/ui"
element: div
subcomponents: [CardHeader, CardTitle, CardDescription, CardContent, CardFooter]
props:
  - surface? (solid | translucent | glass | glass-strong) — what the card surface is *made of*. `solid` is the default opaque `bg-card`. `translucent` is ~82% opacity for menu sheets. `glass` is ~58% opacity + 14px blur + edge highlight for floating panels. `glass-strong` is ~42% + 24px blur for full-page overlays. Composes with `shadow-elevation-*` (depth) and `gds-aura-*` (state signal).
  - Each subcomponent accepts native div HTML attrs (className, etc.)
when_to_use: Grouped content with a distinct surface — settings panels, dashboard tiles, list-of-cards layouts, marketing hero containers, AI suggestion overlays. Pair CardHeader (title + description) with CardContent and optional CardFooter (actions). Reach for `surface="glass"` whenever the card sits over a busy backdrop (gradient mesh, dot grid, generative art, image hero).
composes_with: [Button (in CardFooter), Badge, Separator, Avatar, Code, MediaSurface, any form controls]
aliases: [card, group box, groupbox, panel, tile, surface, glass card, frosted card, floating panel, hero card, ai suggestion card, dashboard tile, settings panel]
---

Card is the most common host for the **Presence** system (PRESENCE.md). Three independent axes layer on top of every card:

- **Surface** — what it's made of (`surface` prop: solid / translucent / glass / glass-strong)
- **Elevation** — how high it sits (`shadow-elevation-1..5` utility)
- **Aura** — what it's radiating (`gds-aura-ring`, `gds-aura-gradient`, `gds-aura-shimmer`)

The four scenarios below are the canonical recipes. Match the scenario to the screen you're building.

---

### Scenario 1 — Settings panel (default opaque)

You want a grouped content surface on a normal page: a settings panel, a list-of-cards tile, a dashboard widget. The page background is calm; the card just needs to sit cleanly on it.

```jsx
<Card>
  <CardHeader>
    <CardTitle>Billing</CardTitle>
    <CardDescription>Manage your subscription.</CardDescription>
  </CardHeader>
  <CardContent>
    <Stack gap="md">
      <Row justify="between">
        <span className="text-sm">Plan</span>
        <Badge>Pro</Badge>
      </Row>
      <Row justify="between">
        <span className="text-sm">Renews</span>
        <span className="text-sm text-muted-foreground">12 Jun 2026</span>
      </Row>
    </Stack>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Cancel plan</Button>
    <Button>Update payment</Button>
  </CardFooter>
</Card>
```

No `surface` prop — the default `solid` is the right answer for almost every in-page card. Reach for glass only when there's something behind worth blurring.

---

### Scenario 2 — Glass card over a busy backdrop (marketing hero)

You're building a marketing hero. There's a gradient mesh, a dot grid, generative art, or a hero image behind the card. The card should read as **floating chrome** — translucent enough to let the backdrop breathe through, but with a defined edge so the content stays legible.

```jsx
<SectionBlock background="gradient" padding="xl">
  <Grid cols="2" gap="md">
    <Card surface="glass" className="shadow-elevation-4">
      <CardHeader>
        <CardTitle>v0 — sidebar component</CardTitle>
        <CardDescription>~300 lines</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Code source={v0Code} language="tsx" bare className="p-4 text-xs max-h-72" />
      </CardContent>
    </Card>

    <Card surface="glass" className="shadow-elevation-4 gds-aura-ring">
      <CardHeader>
        <CardTitle>GradeUI — sidebar component</CardTitle>
        <CardDescription>6 lines</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Code source={gradeCode} language="tsx" bare className="p-4 text-xs max-h-72" />
      </CardContent>
    </Card>
  </Grid>
</SectionBlock>
```

`surface="glass"` does five things at once: 58% opacity `bg-card`, 14px backdrop blur, an inner edge highlight (the "wet" rim that gives glass its boundary), a faint border, and it drops the base `bg-card` so the alpha actually shows. Layering `shadow-elevation-4` adds the floating-popover drop shadow; `gds-aura-ring` makes the second card pulse with a blue halo to signal "this is the recommended path".

---

### Scenario 3 — Translucent menu sheet (floating chrome with structure)

You want a floating panel — a command palette, a notification drawer, an AI suggestion overlay — that's visibly distinct from the canvas but doesn't need full glass blur. Translucent is for "I want presence without drama".

```jsx
<Card surface="translucent" className="shadow-elevation-5 w-80">
  <CardHeader>
    <CardTitle>Suggested action</CardTitle>
    <CardDescription>Studio noticed a layout opportunity.</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm">
      Three buttons in your toolbar would line up edge-to-edge with the
      tabs below if their size matched. Apply <code>size="sm"</code>?
    </p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost" size="sm">Dismiss</Button>
    <Button size="sm">Apply</Button>
  </CardFooter>
</Card>
```

82% opacity is enough to feel layered but not enough to need backdrop blur — works equally well over a busy or a calm background. `shadow-elevation-5` (dialog tier) plus `translucent` is the "floating but not glass" signature.

---

### Scenario 4 — AI is generating (aura + surface composition)

You want to signal that Studio (or any AI agent) is actively working on this card. Aura is the right axis for state signals. It composes with any surface.

```jsx
<Card
  surface="glass"
  className="shadow-elevation-4 gds-aura-ring gds-aura-shimmer"
  style={{ "--aura-color": "var(--selected-glow)" }}
>
  <CardHeader>
    <CardTitle>Generating layout</CardTitle>
    <CardDescription>About 4 seconds remaining.</CardDescription>
  </CardHeader>
  <CardContent>
    <Stack gap="xs">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </Stack>
  </CardContent>
</Card>
```

Ring (pulsing halo) + shimmer (diagonal sweep) together = "actively generating". For "Studio is reviewing this", use ring alone. For "ready to ship", swap tone to `--success`. The skeletons inside are the content's own loading state — orthogonal to the card-level aura.

---

### Scenario 5 — Glass-strong for a full-page overlay backdrop

`surface="glass-strong"` is tuned for a different job than the other three: it's the **backdrop** behind a modal sheet, not the modal itself. Heavy blur (24px), 42% opacity. Use it to de-emphasise the page underneath while keeping it readable.

```jsx
<Card surface="glass-strong" className="fixed inset-4 z-50">
  <CardContent className="grid place-items-center h-full">
    <Stack gap="md" align="center">
      <Spinner />
      <span className="text-lg">Saving your theme…</span>
    </Stack>
  </CardContent>
</Card>
```

Almost always wrong for in-flow content — at 42% opacity the card reads as washed out. If you find yourself reaching for glass-strong for a regular card, you probably want `glass`.

---

### Anti-patterns

**DO NOT roll glass by hand with Tailwind utilities.** The wrong path:

```jsx
{/* ❌ Tailwind soup — misses edge highlight, locks blur to a fixed step,
    bypasses theme tuning, no Studio inspector knob. */}
<Card className="overflow-hidden border-border bg-card/40 backdrop-blur-md">
```

The right path:

```jsx
{/* ✅ Theme-aware bg, tuned blur, edge highlight, knob-discoverable. */}
<Card surface="glass">
```

This is the single most common mistake. The model reaches for `bg-card/40 backdrop-blur-md` because every other DS leaves glass at the utility layer. Ours doesn't.

**DO NOT layer a solid `bg-card` className over `surface="glass"`.** The opaque fill defeats the blur. Card already drops `bg-card` when `surface` is set to anything other than `solid` — don't undo that by tacking `bg-card` back on via className. If you want a tinted glass, override `--card` on the element:

```jsx
<Card surface="glass" style={{ "--card": "0.99 0.04 250" }}>
  ...
</Card>
```

**DO NOT use `surface="glass"` over a solid background.** Glass needs something behind it to blur. Over plain `bg-background` it reads as a slightly washed-out card and you pay for backdrop-filter for no gain. If the page is calm, use `solid`.

**DO NOT use `surface="glass-strong"` for in-flow content.** It's a full-page overlay material. At 42% opacity, regular cards read as washed out. Reach for `glass`.

**DO NOT skip CardHeader if the card has a title.** The header is the semantic anchor for the title + description pair. Inline `<h3>` inside CardContent breaks the visual rhythm and harms screen-reader navigation.

---

---
name: Carousel
import: "@gradeui/ui"
subcomponents: [Carousel.Slide, Carousel.VideoSlide, Carousel.Dots, Carousel.Arrows]
props:
  - Carousel: loop?: boolean — wrap last → first (default true)
  - Carousel: align?: "start" | "center" | "end" — slide alignment (default start)
  - Carousel: slidesPerView?: number — how many slides visible at once (default 1)
  - Carousel: autoplay?: boolean | { delay?: number; pauseOnHover?: boolean; pauseWhenOffscreen?: boolean } — true for defaults (5s, hover/offscreen aware)
  - Carousel: draggable?: boolean — drag-to-swipe (default true)
  - Carousel: onSlideChange?: (index: number) => void
  - Carousel.Slide: duration?: number — per-slide autoplay duration in ms; overrides the carousel default for this slide only
  - Carousel.VideoSlide: src: string — video URL
  - Carousel.VideoSlide: poster?: string — image shown until the slide is active
  - Carousel.VideoSlide: alt?: string — accessible label for the video
  - Carousel.VideoSlide: loop?: boolean — default true (the chosen video-default behaviour)
  - Carousel.VideoSlide: controls?: boolean — default false (chosen default = no controls)
  - Carousel.VideoSlide: fit?: "cover" | "contain" — object-fit (default cover)
  - Carousel.VideoSlide: duration?: number — same as Carousel.Slide; overrides autoplay timing for THIS slide
  - Carousel.Dots: position?: "below" | "overlay"
  - Carousel.Arrows: position?: "overlay" | "outside"
when_to_use: Anywhere a horizontal stack of slides cycles automatically or on user input — marketing hero rotations, featured rails on a TV / streaming app, onboarding tours, image galleries, product carousels, testimonial cycles. Mixed video + still slides are a first-class case; the VideoSlide handles muted-autoplay + poster swap on activation.
composes_with: [MediaSurface, Card, Stack, Row]
aliases: [carousel, slideshow, slider, hero rotation, image gallery, featured row, swipe deck, paged view, page tabview, page view, swiper, react native swiper, page control]
---

```jsx
<Carousel autoplay={{ delay: 6000 }} loop>
  <Carousel.Slide duration={15000}>
    <MediaSurface aspect="wide" hint="poster" alt="Featured: Severance S2" />
  </Carousel.Slide>

  <Carousel.VideoSlide
    src="/trailers/the-studio.mp4"
    poster="/posters/the-studio.jpg"
    alt="The Studio — official trailer"
  />

  <Carousel.Slide>
    <MediaSurface aspect="wide" hint="poster" alt="Coming soon: Foundation S3" />
  </Carousel.Slide>

  <Carousel.Arrows />
  <Carousel.Dots position="overlay" />
</Carousel>
```

### Anti-patterns

DO NOT confuse `<Carousel>` with `<Slider>`. `Slider` is the range input (a draggable thumb on a track) — the colloquial "slider" you'd put on a marketing page is a `Carousel`. When the user says "add a slider", check whether they want a range control or a slideshow before reaching for either.

DO NOT pass real `<img>` or `<video>` tags directly as `Carousel.Slide` children when the slide is meant to be a hero media tile. Use `<MediaSurface>` (still slots) or `<Carousel.VideoSlide>` (video slots) so themes, aspect ratios, and the future image-generation pipeline stay consistent. Raw `<img>` inside a slide is fine for fully-authored content (logo strips, certificates), but for "media that might get regenerated" the surface primitive is mandatory.

DO NOT set very short `duration` values (sub-2000ms) on still slides — the autoplay timer ignores the request implicitly when the carousel is paused (hover, offscreen) but very fast cycles read as broken to users. 5-15 seconds per slide is the natural range.

DO NOT mount the autoplay timer inside individual slides via `setInterval` and forget to clean up — use `<Carousel.Slide duration>` instead. The carousel root owns the single timer; per-slide overrides feed into it through a context-shared ref.

---

---
name: ChartContainer
import: "@gradeui/ui"
subcomponents: [ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle]
notes: ChartContainer wraps a Recharts chart — bring your own Bar/Line/Area/Pie/Radar from "recharts" and place it inside. The wrapper threads design-system tokens through Recharts' style props and provides a styled tooltip + legend.
props:
  - ChartContainer: config: ChartConfig — `{ [seriesKey]: { label: string; color?: string; theme?: { light: string; dark: string } } }`; the keys here are the names you reference in your Recharts <Bar dataKey="…" /> calls
  - ChartContainer: id?: string — used for the inlined <style> tag
  - ChartContainer: children: React.ReactNode — typically a single Recharts ResponsiveContainer or chart
  - ChartTooltip: content?: ReactNode — pair with `content={<ChartTooltipContent />}`; passes through to Recharts <Tooltip>
  - ChartTooltip: cursor?: boolean — the hover crosshair/highlight; Recharts passthrough
  - ChartTooltipContent: indicator? "dot" | "line" | "dashed"; hideLabel?, hideIndicator?, nameKey?, labelKey?
  - ChartLegend: content?: ReactNode — pair with `content={<ChartLegendContent />}`; passes through to Recharts <Legend>
  - ChartLegendContent: nameKey?: string — config key override, mirrors ChartTooltipContent
when_to_use: Reporting dashboards, single-purpose analytics cards (revenue, conversions, active users), or anywhere you'd otherwise hand-roll a Recharts setup. Bring the actual chart type from `recharts` — ChartContainer doesn't pick the chart shape for you, it themes whatever you nest. For sparkline-style decorative trends consider just rendering a small SVG line directly; ChartContainer is overkill for non-interactive ornament.
composes_with: [Card (chart-in-a-card pattern), Tabs (multi-metric switcher), Recharts components (Bar, Line, Area, Pie, Radar from "recharts")]
aliases: [chart, charts, graph, bar chart, line chart, area chart, recharts, analytics chart, swift chart, swiftui chart, victory chart, victory native]
---

```jsx
// Revenue-by-month bar chart inside a Card.
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { month: "Jan", revenue: 12400 },
  { month: "Feb", revenue: 14210 },
  { month: "Mar", revenue: 15880 },
  { month: "Apr", revenue: 17050 },
];

const config = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

<Card>
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer config={config} className="h-64">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  </CardContent>
</Card>
```

---

---
name: CheckboxCard
import: "@gradeui/ui"
props:
  - checked? / defaultChecked? / onCheckedChange? — standard checkbox state
  - label?: ReactNode — title line
  - description?: ReactNode — secondary line
  - aside?: ReactNode — slot before the indicator (a Badge, price, hint)
  - hideIndicator?: boolean — hide the check; selection shown by the card border + background
  - indicatorPosition?: "leading" | "trailing" — default trailing
  - children?: ReactNode — arbitrary static content instead of label/description
when_to_use: Multi-select where each option is a whole selectable card (add-ons, feature toggles, opt-ins). The whole card is the control, so focus and the checked state live on the card surface. Standalone (not in a group). Static content only — never nest an interactive control inside. For a plain checkbox + label row use Field instead.
composes_with: [Badge (in aside), MediaSurface (custom children), Stack / Grid (laying out several)]
aliases: [checkbox card, selectable card, multi-select card, add-on card, feature card, opt-in card]
---

```jsx
<div className="grid gap-3">
  <CheckboxCard label="Priority support" description="24/7 response within an hour" defaultChecked />
  <CheckboxCard label="Extended warranty" description="3 years parts and labour" />
</div>
```

Indicator on the leading edge, with a Badge in the `aside` slot:

```jsx
<CheckboxCard
  indicatorPosition="leading"
  label="Priority support"
  description="24/7 response within an hour"
  aside={<Badge variant="info-soft">Popular</Badge>}
  defaultChecked
/>
```

No visible tick (selection reads from the card border + background), in a two-up grid:

```jsx
<div className="grid grid-cols-2 gap-3">
  <CheckboxCard hideIndicator label="Email" description="Weekly digest" defaultChecked />
  <CheckboxCard hideIndicator label="SMS" description="Critical alerts only" />
</div>
```

---

---
name: Checkbox
import: "@gradeui/ui"
element: button
props:
  - checked?: boolean | "indeterminate"
  - onCheckedChange?: (checked: boolean) => void
  - defaultChecked?: boolean
  - disabled?: boolean
  - id?: string — bind a Label's htmlFor to this
  - name?: string — form field name, posted via the hidden input
  - value?: string — form value when checked (default "on")
  - required?: boolean — marks the hidden form input required
when_to_use: Binary on/off tied to a list (select multiple, agree to terms). Single on/off that controls a setting is better with Switch. For a label + description row, wrap in Field. When each option should be a whole selectable card (label + description, selected state on the card surface), use CheckboxCard.
composes_with: [Label (via htmlFor), Field (label + description row), CheckboxCard (whole-card selectable option), Card, Form rows, Table (for row selection)]
aliases: [checkbox, tickbox, tick box, check, multi-select item]
---

```jsx
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">I agree to the terms</Label>
</div>
```

---

---
name: Code
import: "@gradeui/ui"
variants: []
props:
  - source: string — the code to render
  - language? (tsx | jsx | ts | js | html | css | json | bash | md | py | go | rust) — Prism language id; defaults to `tsx`
  - highlight? — 1-indexed line number, array of numbers, or array of `[start, end]` ranges to emphasise
  - diff? — `{ added?: number[]; removed?: number[] }` — 1-indexed lines for diff hero / changelog mode
  - reveal? (none | lines | typewriter | diff) — entrance animation; defaults to `none`
  - trigger? (mount | inView | manual) — what kicks the reveal off; defaults to `mount`
  - play?: boolean — for `trigger="manual"`, set true to play
  - speed? (slow | normal | fast) — animation feel preset. `normal` (default) maps to the canonical 50ms/22ms staggers + 180ms pre-delay. Pick a feel; don't tune individual numbers unless you have to.
  - delay?: number — explicit delay before reveal starts (ms) — overrides the `speed` preset
  - stagger?: number — explicit per-line stagger for `lines`/`diff`, per-token for `typewriter` (ms) — overrides the `speed` preset
  - prompt?: string — string prepended to each line. Use for terminal emulation: `prompt="$ "` for bash, `prompt="> "` for PowerShell, `prompt=">>> "` for Python REPL. Prompt characters render in muted token colour, don't pick up the typewriter stagger, and are hidden from screen readers.
  - showLineNumbers?: boolean
  - filename?: string — optional label rendered in the header chrome
  - wrap?: boolean — wrap long lines instead of horizontal scroll
  - bare?: boolean — drop chrome (border, header, padding) — for inline use
  - size? (xs | sm | md) — type-scale preset. `xs` (12px) for dense changelog cards / inline blocks; `sm` (14px, default) for marketing heroes and docs; `md` (16px) for focal-point displays.
  - height? (auto | number | string) — container sizing. `auto` (default) grows with content. Number = pixels (`300` → `300px`). String passes through as CSS (`"20rem"`, `"50vh"`).
  - maxLines?: number — cap the visible line count at exactly N line-heights. Wins over `height`. Inherits the current size's line-height automatically.
when_to_use: Read-only code surface for marketing heroes, docs, changelog entries, AI-output displays. Use `diff` for the "diff hero" pattern (before/after side-by-side or stacked). Use `reveal="lines"` with `trigger="inView"` for scroll-driven marketing pages. Use `reveal="typewriter"` for AI-output / chat-style displays. Use `bare` for inline code inside prose. NOT a code editor — for editable code, reach for an external editor primitive (CodeMirror / Monaco).
composes_with: [SectionBlock, Card, Tabs (for multi-file examples), Carousel (slide-to-slide code progression)]
aliases: [code block, code, code snippet, code surface, syntax highlighted code, diff hero, diff view, diff block, changelog code, before after code, scroll-triggered code, typewriter code]
---

Token palette is driven by `--gds-code-*` CSS variables in `styles/globals.css`. The component itself is presentation-agnostic: prism renders tokens, the variables colour them, motion handles the reveal. Override per-instance via inline `style` to retune one block without touching the theme.

The engine is `prism-react-renderer` (already used by Studio's CodeView). Sync, ~6kb, render-prop API — no async hydration flash, no bundle bloat from lang files.

```jsx
// Plain block.
<Code language="tsx" source={`function greet(name) {
  return \`Hello, \${name}\`;
}`} />
```

```jsx
// Line highlight — emphasis lines accept a number, an array, or
// [start, end] ranges. Composes cleanly with diff (diff colours win).
<Code
  language="tsx"
  highlight={[2, [4, 6]]}
  source={`<Button>Save</Button>
<Button variant="raised">Ship it</Button>
<Button variant="raised" style={{ "--btn-glow": "var(--warning)" }}>
  Iterate
</Button>`}
/>
```

```jsx
// Diff hero — the marketing "before / after" pattern. Added lines get
// the success-tinted bg + `+` gutter; removed lines get destructive-
// tinted bg + `-` gutter. `showLineNumbers` is opt-in.
<Code
  language="tsx"
  filename="button.tsx"
  diff={{ removed: [1], added: [2, 3, 4] }}
  source={`<button className="px-4 py-2 rounded-md bg-blue-600 text-white shadow-md">
<Button variant="raised">
  Ship it
</Button>`}
/>
```

```jsx
// Scroll-triggered reveal — marketing hero. The block waits until the
// reader scrolls it into view, then staggers each line in. `once: true`
// is baked in: the reveal doesn't replay when the user scrolls away
// and back.
<Code
  language="tsx"
  reveal="lines"
  trigger="inView"
  stagger={50}
  source={`<AppShell nav="three-pane">
  <AppShellHeader>...</AppShellHeader>
  <AppShellNav>...</AppShellNav>
  <AppShellAside>...</AppShellAside>
  <AppShellMain>...</AppShellMain>
</AppShell>`}
/>
```

```jsx
// Typewriter — token-by-token reveal. Good for AI-output displays
// and "watch it generate" demos. Whitespace tokens are free (no
// delay) so leading indent doesn't feel like dead time. `speed`
// keeps it ergonomic — pick "slow" / "normal" / "fast" instead of
// tuning stagger by hand.
<Code
  language="tsx"
  reveal="typewriter"
  trigger="inView"
  speed="normal"
  source={`const theme = await ai.generate({
  brand: "Acme",
  mood: "calm",
});`}
/>
```

```jsx
// Terminal emulation — `prompt` prepends a static prompt string to
// each line. Combine with `reveal="typewriter"` for a scripted CLI
// session feel. Prompt chars are chrome (muted, aria-hidden, no
// animation), so the typewriter only stages the actual command.
<Code
  language="bash"
  prompt="$ "
  reveal="typewriter"
  trigger="inView"
  speed="slow"
  source={`pnpm add @gradeui/ui
pnpm gradeui init
pnpm dev`}
/>
```

### Anti-patterns

DO NOT use `<Code>` as a code editor. It's read-only by design — the prism renderer doesn't take input. For editable code, compose your own surface around CodeMirror or Monaco.

DO NOT reach for a separate library to render code elsewhere in the app — Studio's CodeView, docs blocks, and marketing heroes should all share this primitive so the token palette stays single-source.

DO NOT pass `highlight` AND `diff` for the same line — diff wins, and the highlight emphasis is silently dropped. Use one signal per line.

DO NOT use `reveal="typewriter"` for long blocks (50+ lines). It works but feels laboured; use `reveal="lines"` instead.

DO NOT override the prism `theme` prop — the component intentionally hides it. Restyle via the `--gds-code-*` CSS variables so every Code block in the app shifts together with the active theme.

---

---
name: Collapsible
import: "@gradeui/ui"
subcomponents: [CollapsibleTrigger, CollapsibleContent]
props:
  - Collapsible: open?: boolean — controlled open state
  - Collapsible: defaultOpen?: boolean — uncontrolled initial state
  - Collapsible: onOpenChange?: (open: boolean) => void
  - CollapsibleTrigger: children: React.ReactNode — the clickable header (often a Button asChild)
  - CollapsibleContent: children: React.ReactNode — the content that animates in/out
when_to_use: A single show/hide reveal — "Show advanced settings" rows, expandable inline help, "More details" sections inside cards. For multiple rows of expandable content where one-at-a-time matters, reach for Accordion. For a separate panel that floats above content, use Popover.
composes_with: [Button (as the trigger, asChild), Card (expandable settings group), Row (header + chevron)]
aliases: [collapsible, expand, show more, disclosure, advanced settings, disclosure group, expandable section, expandable view, show hide]
---

```jsx
<Collapsible defaultOpen={false}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" size="sm">
      Advanced settings <ChevronDown />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-2 pt-2">
    <Label htmlFor="cors">CORS origins</Label>
    <Input id="cors" placeholder="https://example.com" />
  </CollapsibleContent>
</Collapsible>
```

---

---
name: ColorPicker
import: "@gradeui/ui"
props:
  - value?: string | null — a Grade colour token NAME ("action/primary"), the literal "transparent", or null when nothing is picked
  - onValueChange?: (value: string | null) => void — fired with the next value (token name, "transparent", or null)
  - tokens?: { group, tokens }[] — token families offered in the list; defaults to the Grade semantic set (surface / action / status)
  - searchable?: boolean — show the search input (default true)
  - triggerVariant? (default | inline) — default = form-control surface (swatch + name); inline = just a clickable swatch for inspector / fill-row use
  - placeholder?: string — trigger text when nothing is selected
  - searchPlaceholder?: string — search-input placeholder
  - emptyMessage?: string — shown when search returns no rows
  - allowTransparent?: boolean — include a Transparent option at the top (default true)
  - align? (start | center | end) — popover alignment (default start)
  - disabled?: boolean — lock to a read-only display of the current value
when_to_use: The token-led single-select colour picker — the focused "pick one colour token" sibling of FillPicker's solid tab. Use it anywhere a value is ONE Grade colour token (a fill colour, a border colour, an accent override) rather than a full paint. Composes Popover + Command exactly like Combobox, but each row is a Swatch + the token's short name, grouped by family and searchable. triggerVariant="inline" reduces the trigger to a single clickable swatch — reach for that inside inspectors and the FillSection fill rows. For a full paint (gradient / image / shader) use FillPicker; for a list of fills use FillSection; for a multi-stop gradient use GradientEditor.
composes_with: [Popover, Command, Swatch, FillSection, GradientEditor, Field, PropertyList]
aliases: [color picker, colour picker, token picker, colour token picker, color token picker, swatch picker, paint colour, fill colour picker, accent picker, colour dropdown]
---

```jsx
// Token-led colour field.
<ColorPicker value={color} onValueChange={setColor} />
```

```jsx
// Inline swatch trigger — the inspector / fill-row affordance.
<ColorPicker
  triggerVariant="inline"
  value={stopColor}
  onValueChange={setStopColor}
  aria-label="Stop colour"
/>
```

---

---
name: Combobox
import: "@gradeui/ui"
props:
  - Combobox: the root (Base UI Combobox.Root). Pass items={array} for filtering, value/defaultValue + onValueChange for selection, and multiple to enable chips.
  - ComboboxInput: the field (built on InputGroup). showTrigger?=true (chevron button), showClear?=false (clear button). Spreads Base UI Input props.
  - ComboboxContent: the popover surface. side/align/sideOffset/alignOffset/anchor for positioning.
  - ComboboxList: scroll container. Accepts a render function child `(item) => <ComboboxItem/>` when items are provided on the root.
  - ComboboxItem: a row. value={item}; shows a check when selected.
  - ComboboxGroup / ComboboxLabel: grouped sections with a heading.
  - ComboboxEmpty: shown when the filter returns nothing.
  - ComboboxSeparator: divider row.
  - ComboboxChips / ComboboxChip / ComboboxChipsInput: multiple-select chips (only with multiple on the root).
  - ComboboxValue / ComboboxTrigger / ComboboxClear: lower-level parts (used internally by ComboboxInput).
  - useComboboxAnchor: ref hook to anchor the content to a custom element (e.g. a chips row).
when_to_use: A searchable picker with type-to-filter. Single-select by default (value shows in the input); add multiple for tag-style chips. For a single chip that opens the popover (the Studio token-field pattern), keep it single-select and render your own chip in an InputGroupAddon — the built-in ComboboxChips is multiple-only. For a small fixed list without search use Select; for a free-form command palette use Command.
composes_with: [InputGroup, Button, Field, Badge, Avatar, PropertyList, Table]
aliases: [combobox, autocomplete, searchable select, single select, multi select, tag input, chips input, picker, status picker, assignee picker, token select, command select]
---

```jsx
<Combobox items={frameworks}>
  <ComboboxInput placeholder="Search framework…" />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

```jsx
// Multiple selection with chips
<Combobox items={labels} multiple>
  <ComboboxChips>
    <ComboboxChip />
    <ComboboxChipsInput placeholder="Add labels…" />
  </ComboboxChips>
  <ComboboxContent>
    <ComboboxList>
      {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

---

---
name: Command
import: "@gradeui/ui"
subcomponents: [CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut, CommandDialog]
props:
  - Command: value?: string — controlled active item value
  - Command: onValueChange?: (value: string) => void
  - CommandInput: placeholder?: string
  - CommandList: children: React.ReactNode — wraps groups and empty state
  - CommandEmpty: children: React.ReactNode — fallback when no items match
  - CommandGroup: heading?: string
  - CommandItem: value?: string — used for filter matching and selection emit
  - CommandItem: onSelect?: (value: string) => void
  - CommandItem: disabled?: boolean
  - CommandShortcut: children: React.ReactNode — right-aligned keyboard hint (⌘K, ⌥F)
  - CommandDialog: open, onOpenChange — when you want the command palette mounted in a modal (cmd+k pattern)
when_to_use: A searchable list of actions or destinations — global ⌘K palettes, "jump to" inputs, account switchers with filter. Wrap in CommandDialog when it should pop over the entire app on a hotkey. For straight forms with filter, prefer a Select with a search input. For free-text autocomplete tied to a single value, prefer Combobox built on Popover + Command.
composes_with: [Dialog (CommandDialog wraps it), Popover (inline combobox), Tooltip]
aliases: [command palette, command menu, cmd k, quick switcher, action menu, spotlight, spotlight search, quick open, fuzzy finder]
---

```jsx
// Global ⌘K palette — toggled with a keydown listener at the app root.
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command…" />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Navigate">
      <CommandItem onSelect={() => router.push("/docs")}>
        <Book /> Docs <CommandShortcut>⌘D</CommandShortcut>
      </CommandItem>
      <CommandItem onSelect={() => router.push("/studio")}>
        <Sparkles /> Studio <CommandShortcut>⌘S</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

---

---
name: Composer
import: "@gradeui/ui"
props:
  - placeholder?: string
  - initialText?: string — plain text content to seed on mount
  - initialJson?: string — Lexical state JSON (from a previous onSubmit round-trip)
  - formats?: ComposerFormat[] | false — available formats (defaults to bold/italic/underline/strikethrough/code/h1/h2/blockquote/ul/ol); pass false for plain text only
  - toolbar?: boolean | "top" — show the formatting toolbar above the editor; default false
  - triggers?: ComposerTriggerConfig[] — mention/slash configs, eg. `[{ char: "@", items: people }, { char: "/", items: commands }]`
  - attachments?: boolean | ComposerAttachmentConfig — enable image paste + paperclip when true/object; default off
  - onSubmit?: (content: ComposerContent, attachments?: ComposerAttachment[]) => void
  - isLoading?: boolean — disables editor, swaps default Send for Stop
  - onStop?: () => void
  - maxLength?: number
  - autoFocus?: boolean
  - submitOnEnter?: boolean — default true (Shift-Enter still inserts newline)
  - leftActions?: ReactNode — override the default paperclip
  - rightActions?: ReactNode — override the default Send/Stop
  - hideSend?: boolean — hide the default Send without replacing it
  - steps?: ComposerStep[] — scripted demo sequence
  - trigger?: DemoTrigger — "mount" | "inView" | "manual"; default "mount"
  - play?: boolean — for trigger="manual"
  - speed?: DemoSpeed — "slow" | "normal" | "fast"; default "normal"
  - loop?: boolean
  - loopDelay?: number — ms between loop iterations, default 2000
  - readOnly?: boolean — disables editing AND focusability; programmatic playback still works; use for marketing demos so the script doesn't steal focus
  - bare?: boolean — strip the card chrome
  - className?: string
when_to_use: |
  THE PRIMITIVE for any text composition surface — Slack / Discord /
  Teams chat input, AI chat / copilot prompt box, comment thread input,
  GitHub / Linear / Jira comment box, Reddit / Twitter reply box,
  Notion / Linear document body, email composer, post body, anywhere
  a user types text and submits.

  CONCRETE TEST — if you find yourself writing a `<textarea>` (or
  `<Input>` styled tall) with a row of `<Bold>` / `<Italic>` /
  `<Paperclip>` / `<Send>` buttons below or beside it, STOP. That is
  `<Composer>`. Use it.

  Common shapes:
    Chat input with formatting + attachments + send
      → <Composer formats={["bold","italic","code"]} toolbar attachments />
    AI prompt box with paperclip + send
      → <AIChatComposer />  (preset wrapping Composer)
    Comment / reply input
      → <ComposerReply triggers={[{char:"@", items: people}]} />
    Document body editor
      → <Composer toolbar formats={[...]} bare />

  Built on Lexical for rich text, mentions, slash commands. The
  `attachments` prop wires image paste + paperclip + chip preview row
  with object URL lifecycle handled internally — don't roll that
  plumbing yourself. The `triggers` prop wires @mentions and /slash
  commands with a typeahead popover. The `formats` array picks which
  toolbar buttons render when `toolbar` is on.

  Shares the lib/demo step vocabulary with <Code> so scripted
  typing/format/mention demos animate in the same rhythm as your
  terminal demos.
composes_with: [AIChatComposer (preset wrapping this with paperclip + send + attachments), ComposerReply (preset for comment threads), AIChat (uses AIChatComposer internally), Card (host above for reply boxes), Avatar (in leftActions slot for "your" avatar next to the input)]
aliases: [
  composer, message input, message bar, rich text editor, rich text input,
  mention input, slash input, text editor, prompt input, comment composer,
  comment input, reply input, reply box,
  chat input, chat box, chat input bar, chat composer, chat field,
  slack input, slack composer, slack message box, discord input,
  discord composer, teams chat input, message composer, post composer,
  textarea with toolbar, formatting input, formatted text input,
  message field, send message input, write a message, compose message
]
---

```jsx
// Plain text chat-style composer
<Composer
  placeholder="Ask anything…"
  onSubmit={(content) => send(content.text)}
  formats={false}
/>

// Comment composer with mentions
<Composer
  placeholder="Add a comment…"
  triggers={[{ char: "@", items: teamMembers }]}
  onSubmit={(content) => postComment(content.text, content.mentions)}
  submitOnEnter={false}
  formats={["bold", "italic", "code"]}
  toolbar
/>

// AI chat composer with attachments, mentions AND slash commands
<Composer
  placeholder="Describe a UI, or paste a screenshot…"
  triggers={[
    { char: "@", items: docs },
    { char: "/", items: commands, stripTrigger: true },
  ]}
  attachments
  onSubmit={(content, atts) => {
    sendToAssistant(content.text, content.mentions, atts?.map(a => a.file));
  }}
  isLoading={isStreaming}
  onStop={stop}
/>

// Marketing demo — scripted playback
<Composer
  placeholder="Type a message…"
  triggers={[{ char: "@", items: [{ id: "1", value: "alice" }] }]}
  steps={[
    { type: "type", text: "Hey " },
    { type: "mention", trigger: "@", value: "alice", query: "ali" },
    { type: "type", text: ", check out " },
    { type: "select", text: "check out" },
    { type: "format", format: "italic" },
    { type: "wait", ms: 800 },
    { type: "submit" },
  ]}
  trigger="inView"
  speed="normal"
  loop
/>
```

## Demo step vocabulary

Shares `type` / `wait` / `clear` with `<Code>` (driven by the same `useScriptedDemo` hook). Adds Composer-specific verbs:

- `{ type: "mention", trigger, value, query? }` — insert a mention/slash token. Pass `query` to show the typeahead in flight, then resolve to `value`.
- `{ type: "format", format }` — apply a format to the current selection.
- `{ type: "select", text }` — select a substring (precondition for `format`).
- `{ type: "newline" }` — insert a paragraph break.
- `{ type: "submit" }` — fire `onSubmit`.

## Imperative handle

```tsx
const ref = useRef<ComposerHandle>(null);
ref.current?.focus();
ref.current?.clear();
ref.current?.insert("…");
ref.current?.restart();       // replay scripted steps from the start
ref.current?.restart(3000);   // replay after a 3s delay
ref.current?.getContent();    // { text, json, mentions }
ref.current?.getEditor();     // underlying Lexical editor (escape hatch)
```

## Themes

All colours read from CSS variables (`--gds-composer-*` palette in `globals.css`). The mention pills, toolbar buttons, attachment chips, and editor surface all rebrand with the active gradeui theme without component changes.

## Anti-patterns

```jsx
// ❌ Rolling a chat / Slack / Discord input as <textarea> + manual
//    toolbar buttons + Send button. This is the EXACT shape Composer
//    exists to consolidate — caught in the wild on a "Slack clone"
//    generation where the model assembled this inline.
//    Loses: attachment intake + object URL lifecycle, mention popover,
//    slash commands, action-row slots, the Lexical state graph for
//    rich content round-trip, the scripted-demo step machine.
<div className="border rounded-xl bg-card">
  <textarea
    placeholder="Message #general"
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
    rows={3}
    className="w-full bg-transparent p-3 resize-none focus:outline-none"
  />
  <Row justify="between" align="center" className="px-3 py-2 border-t">
    <Row gap="xs">
      <Button size="icon" variant="ghost"><Bold /></Button>
      <Button size="icon" variant="ghost"><Italic /></Button>
      <Button size="icon" variant="ghost"><List /></Button>
      <Button size="icon" variant="ghost"><Smile /></Button>
      <Button size="icon" variant="ghost"><Paperclip /></Button>
    </Row>
    <Button onClick={handleSend}>Send</Button>
  </Row>
</div>

// ✅ The Grade way. Same shape, every affordance free.
<Composer
  placeholder="Message #general"
  formats={["bold", "italic", "code", "ul"]}
  toolbar
  attachments
  triggers={[{ char: "@", items: teamMembers }]}
  onSubmit={(content, atts) => handleSend(content.text, atts)}
/>
```

```jsx
// ❌ Reaching for <Input> (single-line) for a multi-line chat / reply
//    surface. Input is for one-line text fields. Use Composer for any
//    surface where the user might type more than one line — chat,
//    comments, post bodies.
<Input
  placeholder="Reply to thread…"
  value={reply}
  onChange={(e) => setReply(e.target.value)}
/>
<Button onClick={postReply}>Reply</Button>

// ✅ ComposerReply preset has the right defaults for a reply box.
<ComposerReply
  placeholder="Reply to thread…"
  triggers={[{ char: "@", items: people }]}
  onSubmit={(content) => postReply(content.text)}
/>
```

```jsx
// ❌ Importing TipTap, Lexical, Slate, or any other editor framework
//    directly into a scaffold. Composer already wraps Lexical and
//    handles all the plumbing.
import { useEditor, EditorContent } from "@tiptap/react";
const editor = useEditor({ extensions: [StarterKit, ...] });
<EditorContent editor={editor} />

// ✅ Use Composer. Same capability, integrated with the design system.
<Composer toolbar formats={["bold", "italic", "h1", "h2", "blockquote", "ul", "ol"]} />
```

---

---
name: DataView
import: "@gradeui/ui"
props:
  - data: T[] — the rows
  - columns: { key, header, type?, options?, cell?, role?, sortable?, pinned?, width?, align?, hideable?, defaultHidden? }[] — the schema; one list drives table, cards, and grid
  - getRowId?: (row, i) => string — defaults to row.id
  - view? / defaultView? / onViewChange?: "table" | "cards" | "grid" — controlled or uncontrolled view
  - views?: ("table" | "cards" | "grid")[] — allowed views; one entry = single view, no toggle
  - activeId? / defaultActiveId? / onActiveChange?: string | null — the selected row; click emits it
  - sorting? / defaultSorting? / onSortingChange? — TanStack SortingState
  - columnVisibility? / defaultColumnVisibility? / onColumnVisibilityChange? — which fields show
  - stickyHeader?: boolean — freeze the header row on scroll
  - toolbar?: boolean — render the built-in columns menu + view toggle above the view
  - renderCard?: (row, { active }) => ReactNode — override card / grid tiles
  - emptyMessage?: ReactNode
when_to_use: One dataset, drawn as a table, a list of cards, or a grid — without re-typing the TanStack boilerplate (sortable headers, flexRender, selection, view switch) on every page. Hand it data + a columns schema; columns declare a `type` (badge/tags/number/currency/percent/date/boolean/url/text) that DataView renders, with a `cell` override for bespoke cells (avatars, relations). The view toggle can live anywhere — `useDataView()` holds the state so a `<DataViewToggle>` or `<DataViewColumns>` in a page header drives a `<DataView>` lower down. Mark a column `pinned="left"` (with a `width`) for a fixed column and `stickyHeader` to freeze the header. For a single record's fields use PropertyList; for the raw table primitive use Table.
composes_with: [Table, Card, Badge, Avatar, ToggleGroup, DropdownMenu, PropertyList, Combobox]
aliases: [data view, data table, datatable, data grid, dataview, table view, card view, grid view, list view, gallery, records list, master list, tanstack table, sortable table, column visibility, pinned column, frozen column, sticky header, view switcher]
---

```jsx
const dv = useDataView({ defaultView: "table", defaultActiveId: rows[0].id });

// The toggle / columns menu can live anywhere — they just read dv.
<Row justify="between">
  <h1>Alerts</h1>
  <Row gap="sm">
    <DataView.Columns columns={columns} visibility={dv.columnVisibility} onVisibilityChange={dv.setColumnVisibility} />
    <DataView.Toggle value={dv.view} onChange={dv.setView} views={dv.views} />
  </Row>
</Row>

<DataView
  data={rows}
  columns={columns}
  view={dv.view}
  activeId={dv.activeId}
  onActiveChange={dv.setActiveId}
  sorting={dv.sorting}
  onSortingChange={dv.setSorting}
  columnVisibility={dv.columnVisibility}
  onColumnVisibilityChange={dv.setColumnVisibility}
  stickyHeader
/>
```

```jsx
// Self-contained: built-in toolbar, single column pinned, table only.
<DataView
  data={rows}
  toolbar
  columns={[
    { key: "name", header: "Name", role: "title", pinned: "left", width: 220 },
    { key: "status", header: "Status", type: "badge", options: statusOptions, sortable: true },
    { key: "arr", header: "ARR", type: "currency", align: "end", sortable: true },
  ]}
/>
```

---

---
name: DatePicker
import: "@gradeui/ui"
props:
  - value?: Date (single) | DateRange (range)
  - onChange?: (value) => void — called on select or clear
  - placeholder?: string — trigger label when empty (default "Pick a date" / "Pick a date range")
  - disabled?: boolean
  - format?: string — date-fns format token for the trigger label (default "PPP" single, "LLL dd, y" range)
  - align?: "start" | "center" | "end" — popover align (default "start")
  - side?: "top" | "right" | "bottom" | "left" — popover side
  - captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  - className?: string — on the trigger button
  - contentClassName?: string — on the PopoverContent
  - icon?: ReactNode — replaces the default CalendarIcon
  - numberOfMonths?: number — DateRangePicker only, default 2
when_to_use: Any date or date-range entry. Use DatePicker for a single date (DOB, due date, booking). Use DateRangePicker for a span (report period, stay dates, filter window). Prefer these over <Input type="date"> — consistent theming, keyboard nav, a11y, and no browser-native UI drift.
composes_with: [Label, Form, Card (in CardContent), Button (form submit)]
subcomponents: [DateRangePicker]
aliases: [datepicker, calendar input, date field, date range, datepickerios, react native date picker, calendar input field, date field control]
---

```jsx
// Single date
<div className="grid gap-1.5">
  <Label htmlFor="dob">Date of birth</Label>
  <DatePicker
    value={date}
    onChange={setDate}
    placeholder="Select your birthday"
  />
</div>
```

```jsx
// Date range
<DateRangePicker
  value={range}
  onChange={setRange}
  numberOfMonths={2}
/>
```

```jsx
// With presets — pair with Button shortcuts
<div className="flex items-center gap-2">
  <DatePicker value={date} onChange={setDate} />
  <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>Today</Button>
</div>
```

Built internally from Popover + Button + Calendar. If you need a custom trigger or different popover positioning, compose the primitives directly — Calendar and Popover are exported from the same barrel.

---

---
name: Dialog
import: "@gradeui/ui"
subcomponents: [DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose]
props:
  - Dialog: open?, onOpenChange? — Radix controlled/uncontrolled pattern
  - DialogTrigger: asChild? (wrap a Button)
  - DialogContent: surface? (solid | translucent | glass | glass-strong) — what the modal panel is *made of*. Defaults to `solid` (opaque `bg-background`). `glass` lets the page show through softly — pairs with rich backdrops or AI-suggestion modals.
  - DialogContent: accepts native div HTML attrs
  - DialogFooter: used for action rows
when_to_use: Modal interruptions — confirmations, focused forms, detail views, AI suggestion sheets. Dialog is the right primitive for Apple HIG / React Native "Alert" (modal) semantics. For non-blocking inline messaging use Callout; for transient notifications use Toaster (Sonner). Always include DialogTitle (a11y requirement).
composes_with: [Button (as DialogTrigger asChild, and inside DialogFooter), Input/Textarea/Select inside DialogContent, Code (for changelog / diff modals), MediaSurface (for image / preview modals)]
aliases: [modal, popup, overlay, alert, system alert, alert dialog, modal dialog, confirm dialog, react native modal, rn alert, glass modal, frosted modal, ai suggestion modal]
---

DialogContent sits at elevation-5 (the dialog tier). The Presence axes still apply: `surface` picks the material, `gds-aura-*` adds radiating state, the overlay scrim handles dimming the page.

**Responsive shape.** Below `sm` the panel is a full-screen sheet whose padding clears the device safe areas, and its content scrolls. From `sm` up it is a centred card (`max-w-lg`, capped at 85% of the viewport height). Pass a `max-w-*` in `className` to change the desktop width; you rarely need to touch the mobile behaviour. The panel enters with a fade and a slight scale from its own centre.

---

### Scenario 1 — Destructive confirmation (default opaque)

You're confirming a destructive action: delete, discard, revoke. Keep the dialog opaque — the user should focus on the decision, not the page behind it. The raised Button + tonal `--btn-glow` keeps the destructive action visually heavy without going red-everywhere.

```jsx
<Dialog>
  <DialogTrigger asChild><Button variant="outline">Delete project</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete project?</DialogTitle>
      <DialogDescription>
        This will remove the project, its screens, and all comments. This cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="raised" style={{ "--btn-glow": "var(--destructive)" }}>
        Delete forever
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

No `surface` prop — `solid` is the right answer for high-stakes confirmations. The opacity reinforces "stop and decide".

---

### Scenario 2 — Glass modal over a rich canvas (creative-tool aesthetic)

You're building a creative tool — Studio, a presentation builder, a photo editor. The canvas behind the dialog is visually rich (a layout in progress, an image, generative art). A solid dialog cuts a hole through the work. Glass keeps the work visible while focusing attention.

```jsx
<Dialog>
  <DialogTrigger asChild><Button>Add a comment</Button></DialogTrigger>
  <DialogContent surface="glass" className="shadow-elevation-5">
    <DialogHeader>
      <DialogTitle>Comment on Hero section</DialogTitle>
      <DialogDescription>
        Visible to your team and to Studio when it next regenerates this screen.
      </DialogDescription>
    </DialogHeader>
    <Textarea placeholder="What should change about this section?" />
    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button>Post comment</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

`surface="glass"` is the canvas-tool signature. The user keeps spatial awareness of what they were just looking at; the dialog feels like a layer above the work, not a separate page.

---

### Scenario 3 — AI suggestion sheet (translucent + aura)

Studio is offering a suggestion. It shouldn't feel as heavy as a destructive confirmation — it's a recommendation, not a demand. Translucent (no blur) is lighter than glass; the aura ring announces "this is from an AI agent".

```jsx
<Dialog open={hasSuggestion}>
  <DialogContent
    surface="translucent"
    className="shadow-elevation-5 gds-aura-ring"
    style={{ "--aura-color": "var(--selected-glow)" }}
  >
    <DialogHeader>
      <DialogTitle>Three buttons could align</DialogTitle>
      <DialogDescription>
        Toolbar buttons match TabsList height when size="sm". Apply across all three?
      </DialogDescription>
    </DialogHeader>

    <Card surface="glass" className="shadow-elevation-2">
      <CardContent>
        <Code source={suggestedDiff} language="tsx" diff={{ added: [2, 3, 4] }} bare />
      </CardContent>
    </Card>

    <DialogFooter>
      <Button variant="ghost">Dismiss</Button>
      <Button>Apply suggestion</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Three Presence axes layered: `surface="translucent"` (material), `shadow-elevation-5` (depth), `gds-aura-ring` (state signal). The inner Card uses `surface="glass"` for a different reason — to read as a nested floating preview rather than a flat content block.

---

### Anti-patterns

**DO NOT use `surface="glass"` for destructive confirmations.** Glass implies "the page is still alive behind this" — users will be less decisive. Opaque is the right material for high-stakes choices.

**DO NOT roll glass by hand on DialogContent.**

```jsx
{/* ❌ Misses edge highlight, no theme tuning, no inspector knob. */}
<DialogContent className="bg-background/50 backdrop-blur-md">

{/* ✅ */}
<DialogContent surface="glass">
```

**DO NOT skip DialogTitle.** Screen readers announce the title on open — without it the dialog reads as "[unlabeled dialog]". If the design has no visible title, wrap a visually-hidden title:

```jsx
<DialogHeader>
  <DialogTitle className="sr-only">Image preview</DialogTitle>
</DialogHeader>
```

**DO NOT use Dialog for ambient messaging.** Toast for transient ("Saved"), Callout for inline ("3 unread comments"), Dialog only when the user MUST respond before continuing.

---

---
name: DropdownMenu
import: "@gradeui/ui"
subcomponents: [DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent]
props:
  - DropdownMenu: open?, defaultOpen?, onOpenChange?, modal? (default true)
  - DropdownMenuTrigger: asChild?: boolean — usually wraps a Button
  - DropdownMenuContent: align? "start" | "center" | "end"; side? "top" | "right" | "bottom" | "left"; sideOffset? number
  - DropdownMenuContent: surface? (solid | translucent | glass | glass-strong) — what the menu surface is *made of*. `solid` (default) is `bg-popover`. `translucent` matches Apple HIG / iOS menu sheets. `glass` for menus floating over rich canvases.
  - DropdownMenuContent: size? "default" | "sm" | "xs" — menu density; cascades to every item (Item, Checkbox, Radio, SubTrigger, Label) via context so a compact trigger gets a compact menu. Use "xs" in dense tool panels.
  - DropdownMenuSubContent: surface? (solid | translucent | glass | glass-strong) — same axis applied to nested submenu surfaces
  - DropdownMenuSubContent: size? "default" | "sm" | "xs" — match the parent content's size down the tree
  - DropdownMenuItem: onSelect?, disabled?, asChild?, inset?
  - DropdownMenuCheckboxItem: checked?: boolean — controlled checked state
  - DropdownMenuCheckboxItem: onCheckedChange?: (checked: boolean) => void
  - DropdownMenuCheckboxItem: disabled?: boolean
  - DropdownMenuRadioGroup: value?: string — the selected radio item
  - DropdownMenuRadioGroup: onValueChange?: (value: string) => void
  - DropdownMenuRadioItem: value: string — what the group emits when picked
  - DropdownMenuRadioItem: disabled?: boolean
  - DropdownMenuSub / DropdownMenuSubTrigger / DropdownMenuSubContent: nested menu — sub-trigger shows children, sub-content holds the deeper items
  - DropdownMenuSub: open?, defaultOpen?, onOpenChange? — nested-menu open state (Radix passthrough); pass `open` to compose a pre-opened submenu in static screens and captures
  - DropdownMenuShortcut: children — right-aligned kbd hint
when_to_use: A small action menu attached to a trigger — overflow "…" buttons on cards, user-avatar menus in headers, "Insert" menus in editors. For a full searchable list, use Command. For ONE primary action plus a secondary, use a Button next to a smaller ghost Button instead of a dropdown.
composes_with: [Button (as trigger asChild), Avatar (user menu), Card (overflow on a tile), Tooltip (on the trigger)]
aliases: [dropdown, dropdown menu, overflow menu, kebab menu, more menu, action menu, context-style menu, menu, pull-down menu, pulldown menu, context menu, popup menu, actions menu, glass menu, frosted menu, ios menu, hig menu]
---

DropdownMenuContent sits at elevation-4. Pick the material from the scenarios below — the `surface` prop is the discoverable lever.

---

### Scenario 1 — Overflow menu on a row/card (default opaque)

The canonical "…" menu attached to a row or card. The content behind is a list — readability of the menu items matters more than seeing what's underneath.

```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Open menu">
      <MoreHorizontal />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={onDuplicate}>
      <Copy /> Duplicate
      <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={onShare}>
      <Share2 /> Share
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={onDelete} className="text-destructive">
      <Trash /> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

`solid` is the right default. Menu items are read-targets — give them a clean opaque background.

---

### Scenario 2 — Translucent menu (iOS / Apple HIG)

You want the iOS-native menu feel: light translucency that picks up the colour of whatever's beneath without committing to a full blur. The Apple HIG canonical material for context menus.

```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreVertical /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
    surface="translucent"
    className="shadow-elevation-4"
    align="end"
  >
    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
    <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
      <DropdownMenuRadioItem value="recent">Most recent</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="alpha">A–Z</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

82% opacity. The background tints the menu without demanding the user filter it out.

---

### Scenario 3 — Glass menu in a canvas tool

Studio's layer-context menu, an image editor's right-click, a slide-tool insert menu. The canvas behind is the work. Glass lets the menu float without cutting a hole through the work.

```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><Plus /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
    surface="glass"
    className="shadow-elevation-4 w-56"
    align="start"
  >
    <DropdownMenuLabel>Insert</DropdownMenuLabel>
    <DropdownMenuItem><LayoutTemplate /> Layout</DropdownMenuItem>
    <DropdownMenuItem><Image /> Media</DropdownMenuItem>
    <DropdownMenuItem><Code2 /> Code block</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
      <DropdownMenuSubTrigger><Sparkles /> AI suggestion</DropdownMenuSubTrigger>
      <DropdownMenuSubContent surface="glass" className="shadow-elevation-4">
        <DropdownMenuItem>Layout variant</DropdownMenuItem>
        <DropdownMenuItem>Tone shift</DropdownMenuItem>
        <DropdownMenuItem>Density pass</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>
```

Pass `surface="glass"` to BOTH the root content AND the sub-content — submenus default to `solid` so a glass parent with an opaque child looks broken. Match the surface consistently down the menu tree.

---

### Anti-patterns

**DO NOT roll glass by hand on DropdownMenuContent.**

```jsx
{/* ❌ Misses the iOS-native edge highlight + theme blur tuning. */}
<DropdownMenuContent className="bg-popover/55 backdrop-blur-md">

{/* ✅ */}
<DropdownMenuContent surface="glass">
```

**DO NOT mix surfaces between content and sub-content.** A glass root with a solid submenu (or vice-versa) reads as two materials competing for attention. Pick one for the whole tree.

**DO NOT use DropdownMenu for searchable lists.** Past ~7 items the menu becomes a scrollable list and the right primitive is Command (a search-first list inside a Popover or Dialog).

**DO NOT put long-form text in menu items.** Items are action labels — verbs. If you need help text, that's a Popover surface, not a menu.

---

---
name: Field
import: "@gradeui/ui"
element: div
subelements:
  - FieldLabel: label
  - FieldSet: fieldset
  - FieldLegend: legend
subcomponents: [FieldLabel, FieldTitle, FieldDescription, FieldContent, FieldTrailing, FieldGroup, FieldSet, FieldLegend, FieldSeparator, FieldError]
props:
  - orientation?: "vertical" | "horizontal" | "responsive" — vertical (default): label on top, control, then description (Input/Select/Textarea fields); horizontal: control + text in a row, placement follows DOM order (control first = checkbox row; control after text = settings row); responsive: vertical then horizontal at @md (needs a Field.Group ancestor)
  - layout?: "option" | "setting" — DEPRECATED alias; option → horizontal control-leading, setting → horizontal control-trailing. Prefer orientation
  - children: one control (Checkbox / RadioGroupItem / Switch / Input / Select / Textarea) + Field.Label (or Field.Title) + Field.Description? + Field.Trailing? + Field.Content? — id + aria-describedby auto-wired
  - "data-invalid / data-disabled": set on <Field> to cascade error / disabled styling to label + description (via the group/field selector)
when_to_use: The form-field wrapper. Default vertical for Input/Select/Textarea (label on top). horizontal for a checkbox/radio row (control first) or a settings row (label left, Switch right). Stack fields with Field.Group; group a related set with Field.Set + Field.Legend; divide with Field.Separator; surface validation with Field.Error; use Field.Title for a non-label heading. For a selectable CARD where the whole surface is the control, use RadioCard / CheckboxCard / SwitchCard instead.
composes_with: [Input, Select, Textarea, Checkbox, RadioGroup, RadioGroupItem, Switch, Badge (inside Field.Trailing), Field.Group, Field.Set, Field.Legend, Field.Separator, Field.Error, Field.Content, Field.Title]
aliases: [field, form field, control row, label and description, input field, vertical field, two line checkbox, option row, setting row, toggle row, field group, fieldset, field legend, field error, orientation]
---

```jsx
<Field>
  <Checkbox value="terms" />
  <Field.Label>Accept terms</Field.Label>
  <Field.Description>You agree to the privacy policy.</Field.Description>
</Field>
```

```jsx
<Field layout="setting">
  <Field.Label>Email notifications</Field.Label>
  <Field.Description>Weekly digest of activity.</Field.Description>
  <Switch defaultChecked />
</Field>
```

---

---
name: FillPicker
import: "@gradeui/ui"
subcomponents: [FillSection]
props:
  - value: FillValue — current paint ({ type, color?, gradient?, src?, fit?, repeat?, tileSize?, preset?, palette?, postPreset?, opacity? }) (required)
  - onChange: (value: FillValue) => void — called on any change (required)
  - FillSection: value — FillValue[] — the ordered list of fills to stack as rows
  - FillSection: onChange — (value: FillValue[]) => void — fired with the next list on add / edit / remove / visibility toggle
  - FillSection: title?: string — section heading (default "Fills")
when_to_use: Grade's paint picker — the control for choosing a frame's background fill, modelled on Figma's fill popover. A fill-type icon row (solid · gradient · image · pattern · video · shader) switches the panel below; a global opacity sits at the foot. Emits a FillValue that maps 1:1 onto BackgroundFill props. This is a Studio/inspector chrome control — pair it with BackgroundFill, which renders the chosen paint. Not for app content. Use the FillSection subcomponent to edit a LIST of fills (the Figma "Fill" inspector section): each row is a Solid/Gradient/Image toggle, the matching value control (ColorPicker / GradientEditor popover / image URL), an opacity %, a visibility eye, and a remove button, with an add button in the header.
composes_with: [BackgroundFill (renders the FillValue), Popover (host it in a popover), ColorPicker (the solid value), GradientEditor (the gradient value), ShaderPresetPicker (the shader tab), the inspector Fill section]
aliases: [fill picker, paint picker, background picker, fill chooser, fill popover, fill section, fill list, fills inspector, paint section]
notes: |
  Grade is token-led, so the solid + gradient tabs lead with theme-token
  swatches (`primary`, `accent`, `secondary`, `muted`, `card`,
  `background`, `destructive`, `transparent`) rather than a freeform HSV
  square. The "pattern" tab is sugar for an image fill with `repeat` on.

  The `FillValue` is the shared data shape: store it on a frame and feed
  it straight to `<BackgroundFill {...value} />`. Solid colour can be a
  className (`bg-<token>`) instead of a layer; every other type renders
  as a `<BackgroundFill>` child of the frame.
---

```jsx
const [fill, setFill] = useState({ type: "shader", preset: "mesh", opacity: 0.35 });

<Popover>
  <PopoverTrigger asChild><button>Fill</button></PopoverTrigger>
  <PopoverContent className="w-[320px] p-3">
    <FillPicker value={fill} onChange={setFill} />
  </PopoverContent>
</Popover>

<div className="relative overflow-hidden">
  <BackgroundFill {...fill} />
  <div className="relative z-10">…content…</div>
</div>
```

---

---
name: Flex
import: "@gradeui/ui"
role: layout
props:
  - direction?: "row" | "col" | "row-reverse" | "col-reverse" (default "row") — main-axis direction
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "none") — gap between children
  - align?: "start" | "center" | "end" | "stretch" | "baseline" (default "stretch") — cross-axis alignment
  - justify?: "start" | "center" | "end" | "between" | "around" | "evenly" (default "start") — main-axis distribution
  - wrap?: "nowrap" | "wrap" | "wrap-reverse" (default "nowrap") — wrap behaviour when children overflow
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
when_to_use: The unopinionated flexbox primitive — reach for Flex when Stack, Row, or Grid don't quite fit. Specifically when you need reverse direction (`row-reverse` / `col-reverse`), CSS defaults instead of Row's baked-in `items-center gap-md`, or baseline alignment. Otherwise prefer Stack / Row / Grid — they're easier to read and tuned for the 95% case. Flex is the escape hatch, not the default.
composes_with: [any content component]
aliases: [flex, flexbox, flex container, hstack, vstack, horizontal, vertical, generic container, layout view]
---

```jsx
// Reverse direction — last child appears first (e.g. timestamp before avatar).
<Flex direction="row-reverse" gap="sm" align="center">
  <Avatar />
  <span>2m ago</span>
</Flex>
```

```jsx
// CSS-default Flex — no rhythm baked in, opt into each axis deliberately.
<Flex direction="col" justify="between" className="h-full">
  <Header />
  <Footer />
</Flex>
```

```jsx
// Baseline alignment for icon + text where the caps line should line up.
<Flex gap="sm" align="baseline">
  <Icon />
  <h2 className="text-2xl">Heading</h2>
</Flex>
```

---

# GradeLoader

The branded indeterminate loader — the Grade G-arrow mark with a diagonal
shimmer sweeping through it. Use it for EVERY "working, unknown duration"
moment instead of a generic spinner: fetching, compiling, warming a shader,
waiting on AI.

props:
  - size?: "sm" | "md" | "lg" | "xl" | number — mark size (16/24/32/48px). Default "md".
  - label?: string — accessible status text; shown visually with showLabel. Default "Loading…"; pass "" to silence.
  - showLabel?: boolean — render the label as a caption under the mark. Default false.

when_to_use:
  - Indeterminate waits: data fetching, AI generation in flight, preview compiling, media/shader warm-up, route transitions.
  - Centered in an empty panel/card region while its content loads (pair with size="lg" + showLabel).
  - NOT for determinate progress — use Progress when you can show a fraction.
  - NOT a skeleton — use Skeleton when the layout shape is known and content is imminent.

composes_with:
  - Card / panel bodies (centered placeholder state)
  - Button (size="sm" inline while an action is pending)
  - Motion scene boundaries / media surfaces while heavy content warms
  - EmptyState (loading precursor before empty/error variants)

aliases: loader, spinner, loading indicator, busy, indeterminate, grade mark loader, branded spinner

notes:
  - Paints with currentColor — set text colour on a parent (`text-muted-foreground`, `text-white` over footage).
  - The shimmer highlights with oklch(var(--brand-1)) when brand pops are present; degrades to currentColor.
  - prefers-reduced-motion swaps the sweep for a gentle opacity pulse.
  - Announces via role="status"; the label is always available to screen readers.

---

---
name: GradientEditor
import: "@gradeui/ui"
props:
  - value: { type, angle?, stops } — the structured gradient (type linear/radial/angular, optional angle in deg, ordered stops). NOT a CSS string — render the string via gradientToCss(value).
  - onChange: (value) => void — fired with the next structured gradient on any edit
when_to_use: Edit a multi-stop CSS gradient with token-led stops. A type Select (Linear / Radial / Angular) with reverse + rotate actions, a live full-width preview bar (a Swatch type="gradient"), then a Stops list where each stop is a position %, a colour (ColorPicker token or raw), an opacity %, and a remove button; an add button appends a stop. Token stops resolve to oklch(var(--<token>)) so the preview re-voices with the theme. Emits the structured GradientValue (kept editable + serialisable); the caller turns it into CSS with the exported gradientToCss(value). Use inside a Popover from a FillSection gradient row, or standalone in a theme builder. For a single solid colour use ColorPicker; for a full paint (solid / gradient / image / shader) use FillPicker.
composes_with: [Select, Button, Input, ColorPicker, Swatch, Popover, FillSection]
aliases: [gradient editor, gradient picker, gradient builder, css gradient editor, stop editor, gradient stops, linear gradient editor, conic gradient editor]
---

```jsx
<GradientEditor
  value={{
    type: "linear",
    angle: 90,
    stops: [
      { id: "a", position: 0, token: "action/primary", opacity: 1 },
      { id: "b", position: 100, token: "action/accent", opacity: 1 },
    ],
  }}
  onChange={setGradient}
/>
```

```jsx
// Render the CSS string for a background.
import { gradientToCss } from "@gradeui/ui";
<div style={{ background: gradientToCss(gradient) }} />
```

---

---
name: Grid
import: "@gradeui/ui"
role: layout
props:
  - cols?: "1" | "2" | "3" | "4" | "5" | "6" | "12" (default "3") — desktop column count; each value has a baked-in responsive ladder (e.g. "4" → 1 col mobile, 2 tablet, 4 desktop)
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "md") — gap between grid cells (same scale as Stack/Row)
  - align?: "start" | "center" | "end" | "stretch" (default "stretch") — cross-axis alignment of cells
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
when_to_use: 2D layouts where Stack (vertical) and Row (horizontal) don't fit — stat-card grids, feature tiles, pricing columns, photo grids. Reach for Grid over hand-rolled `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4` so the column count is a prop the settings panel can mutate and the responsive ladder stays consistent across designs.
composes_with: [Card, Stack (inside each cell), Row, Button, any content component]
aliases: [grid, tiles, cards grid, stat grid, columns, feature grid, grid view, lazy v grid, lazyvgrid, lazy h grid, lazyhgrid, tile grid, masonry]
notes: |
  `cols` values and their responsive ladders:
    "1"  → grid-cols-1 (single column at all breakpoints)
    "2"  → grid-cols-1 md:grid-cols-2
    "3"  → grid-cols-1 sm:grid-cols-2 md:grid-cols-3
    "4"  → grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  (the canonical stat-card grid)
    "5"  → grid-cols-1 sm:grid-cols-2 lg:grid-cols-5
    "6"  → grid-cols-2 sm:grid-cols-3 lg:grid-cols-6
    "12" → grid-cols-4 md:grid-cols-6 lg:grid-cols-12
  Prefer Grid over bespoke Tailwind grid classes — "gap-md" etc. are NOT real Tailwind classes (the gap scale is numeric: gap-4, gap-6) so hand-rolled grids often end up with zero gap.
---

```jsx
// Stat-card grid — the canonical 4-up.
<Grid cols="4" gap="md">
  <Card>…</Card>
  <Card>…</Card>
  <Card>…</Card>
  <Card>…</Card>
</Grid>
```

```jsx
// Three-column feature grid with larger gaps.
<Grid cols="3" gap="lg">
  <FeatureCard />
  <FeatureCard />
  <FeatureCard />
</Grid>
```

---

---
name: HoverCard
import: "@gradeui/ui"
subcomponents: [HoverCardTrigger, HoverCardContent]
props:
  - HoverCard: open?, defaultOpen?, onOpenChange?, openDelay? (default 700), closeDelay? (default 300)
  - HoverCardTrigger: asChild?: boolean — usually a Link or Button
  - HoverCardContent: side?, align?, sideOffset?, alignOffset?, className?
  - HoverCardContent: surface? (solid | translucent | glass | glass-strong) — what the preview surface is *made of*. `solid` (default) is `bg-popover`. `glass` for hover previews over rich content (a media feed, a layout canvas).
when_to_use: Rich preview content surfaced on hover — user profile mini-cards on @-mentions, link previews, definition popups, layer-thumbnail peeks. Pointer-only by design (no touch-friendly trigger); pair with a click target for touch devices, or fall back to Popover. NEVER use HoverCard for critical info — if the user can't reach it via keyboard or touch, it might as well not exist for accessibility.
composes_with: [Avatar (user preview), Card (richer content), Link (the trigger), MediaSurface (link/layer previews), Code (snippet previews)]
aliases: [hover card, hover preview, mention preview, profile peek, link preview, rich tooltip, link preview card, profile hover, peek card, glass preview, frosted preview]
---

HoverCardContent sits at elevation-4. The surface choice depends entirely on what's behind the trigger.

---

### Scenario 1 — User mention preview (default opaque)

The trigger is inline text in a comment thread, document, or feed. The reader's eye is on the prose; the hover-card needs to feel like a small contained card popping up next to the link. Opaque is correct.

```jsx
<HoverCard>
  <HoverCardTrigger asChild>
    <a href="/u/elena" className="font-medium underline">@elena</a>
  </HoverCardTrigger>
  <HoverCardContent className="w-72">
    <Row gap="sm" align="start">
      <Avatar>
        <AvatarImage src="/avatars/elena.png" />
        <AvatarFallback>EO</AvatarFallback>
      </Avatar>
      <Stack gap="xs">
        <span className="font-semibold">Elena Okafor</span>
        <span className="text-sm text-muted-foreground">
          Design lead · Joined Mar 2025
        </span>
        <span className="text-sm">Currently focused on the layout-quality skill suite.</span>
      </Stack>
    </Row>
  </HoverCardContent>
</HoverCard>
```

---

### Scenario 2 — Glass layer preview in a canvas tool

You're hovering a layer name in the Studio layer list. The canvas alongside shows the actual layer in context. A glass hover-card carrying a thumbnail of the layer keeps the canvas visible AND gives the preview presence.

```jsx
<HoverCard openDelay={300}>
  <HoverCardTrigger asChild>
    <button className="text-sm hover:underline">Hero card · v0</button>
  </HoverCardTrigger>
  <HoverCardContent
    surface="glass"
    className="w-80 shadow-elevation-4"
    side="right"
    align="start"
  >
    <Stack gap="sm">
      <MediaSurface
        aspect="video"
        source={{ kind: "image", src: "/previews/hero-v0.png" }}
        alt="Hero card v0 thumbnail"
      />
      <Stack gap="xs">
        <span className="text-sm font-medium">Hero card · v0</span>
        <span className="text-xs text-muted-foreground">Last edited 2m ago by Elena</span>
      </Stack>
    </Stack>
  </HoverCardContent>
</HoverCard>
```

Tighter `openDelay` (300ms vs the default 700) because the user is scanning a list — they want previews to come up faster.

---

### Scenario 3 — Code snippet preview (translucent)

You're showing a hover preview of a code reference (a function name in docs, a symbol in a comment). Translucent lets the page peek through without committing to glass blur — feels lighter for a quick read.

```jsx
<HoverCard>
  <HoverCardTrigger asChild>
    <code className="font-mono text-sm rounded bg-muted px-1.5 py-0.5">surfaceBg()</code>
  </HoverCardTrigger>
  <HoverCardContent
    surface="translucent"
    className="w-96 shadow-elevation-4 p-0"
  >
    <Stack gap="xs" className="p-4 pb-2">
      <span className="text-sm font-medium">surfaceBg(surface, defaultBgClass)</span>
      <span className="text-xs text-muted-foreground">@gradeui/ui · lib/surface</span>
    </Stack>
    <Code
      source={`function surfaceBg(surface, defaultBgClass) {
  return surface === "solid" ? defaultBgClass : "";
}`}
      language="ts"
      bare
      className="text-xs p-4"
    />
  </HoverCardContent>
</HoverCard>
```

---

### Anti-patterns

**DO NOT use HoverCard on touch devices for critical info.** There's no hover on touch — the preview is unreachable. Either provide a click fallback or use Popover.

**DO NOT roll glass by hand on HoverCardContent.**

```jsx
{/* ❌ */}
<HoverCardContent className="bg-popover/60 backdrop-blur-md">

{/* ✅ */}
<HoverCardContent surface="glass">
```

**DO NOT use HoverCard for tooltips.** Tooltips are tiny, label-only, and dismiss instantly. HoverCard is for rich content with delay. If the content is a few words, reach for Tooltip.

**DO NOT use HoverCard as a primary navigation surface.** It dismisses on pointer-out — if the user has to traverse a path to reach a button inside, the preview will close before they get there.

---

---
name: InputGroup
import: "@gradeui/ui"
element: div
subelements:
  - InputGroupInput: input
  - InputGroupTextarea: textarea
  - InputGroupButton: button
  - InputGroupText: span
subcomponents: [InputGroupInput, InputGroupTextarea, InputGroupAddon, InputGroupButton, InputGroupText]
props:
  - InputGroup: <div> — the bordered wrapper. role=group. Focus/error styles react to the inner control via :has().
  - InputGroup: size?: "lg" | "default" | "sm" — group height (h-11 / h-9 / h-8). Shared with the control inside, so `<InputGroup size="lg">` sizes the whole field; an explicit size on InputGroupInput still wins.
  - InputGroupInput: <input> props — the text control (data-slot=input-group-control). Borderless, fills the group.
  - InputGroupTextarea: <textarea> props — multiline control; the group grows to fit.
  - InputGroupAddon: align?: "inline-start" | "inline-end" | "block-start" | "block-end" — a slot for icons / text / buttons. inline = beside the control; block = stacked above/below (toolbars, textareas).
  - InputGroupButton: variant?=ghost; size?: "xs" | "sm" | "icon-xs" | "icon-sm" — a compact button sized for addons (wraps Button).
  - InputGroupText: <span> props — inline label/affix text (prefixes, suffixes, units).
when_to_use: Compose an input with leading/trailing icons, text affixes, buttons, or a toolbar inside one bordered field. Put controls in InputGroupInput / InputGroupTextarea and decorations in InputGroupAddon. For a plain field with a label + description, use Field instead.
composes_with: [Input, Textarea, Button, Field, Label, Kbd, Tooltip]
aliases: [input group, input with icon, input addon, prefix suffix input, search input, input affix, text field with button, leading icon input, trailing button input]
---

```jsx
<InputGroup>
  <InputGroupAddon>
    <SearchIcon />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search…" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton>Go</InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

```jsx
<InputGroup>
  <InputGroupAddon><InputGroupText>https://</InputGroupText></InputGroupAddon>
  <InputGroupInput placeholder="yoursite.com" />
</InputGroup>
```

---

---
name: Input
import: "@gradeui/ui"
element: input
props:
  - type?: string (text | email | password | number | search | url | tel | date)
  - placeholder?: string — hint text shown while the input is empty. Model it explicitly (not just a native passthrough) so generated screens carry placeholders and the validator accepts them.
  - size?: "lg" | "default" | "sm" | "xs" | "2xs" — control density. `lg` (h-11, stays 16px text) for a prominent single-value field like an amount in a dialog; `default` (h-9) for forms; `sm` (h-8), `xs` (h-7) and `2xs` (h-6) for dense tool panels like the inspector. NOTE: pre-unification scale — see Figma parity audit; due to migrate to the t-shirt scale (xs 24 | sm 28 | md 32 | lg 40, default→md).
  - startSlot?: ReactNode — adornment rendered inside the leading edge (icon, prefix, currency symbol). Non-interactive by default so clicks focus the input.
  - endSlot?: ReactNode — adornment rendered inside the trailing edge (unit like "px", a clear button, a stepper). Same pointer rules as startSlot.
  - All native input HTML attrs (value, onChange, placeholder, disabled, required)
when_to_use: Any single-line text entry. Always pair with a Label for accessibility. Use startSlot/endSlot for icons, prefixes and units instead of hand-positioning absolute children; use size="sm"/"xs" in dense tool panels.
composes_with: [Label, Form, Card (in CardContent), Button (form submit)]
aliases: [text field, textbox, textfield, form field, text input, secure field, search field, url field, number field, textinput, text input field, react native textinput, unit input, input with icon]
---

```jsx
<div className="grid gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

Slots — a leading icon and a trailing unit, no manual positioning:

```jsx
<Input
  size="sm"
  type="number"
  placeholder="0"
  startSlot={<Ruler className="size-4" />}
  endSlot={<span className="text-xs text-muted-foreground">px</span>}
/>
```

Sizes — `default` for forms, `sm` / `xs` for dense panels:

```jsx
<div className="grid gap-2">
  <Input size="default" placeholder="Default (h-9)" />
  <Input size="sm" placeholder="Small (h-8)" />
  <Input size="xs" placeholder="Extra small (h-7)" />
</div>
```

---

---
name: Label
import: "@gradeui/ui"
element: label
props:
  - htmlFor?: string — binds to the input's id
  - size?: "default" | "sm" | "xs" — text size, mirrors Input/Select/Textarea so a field and its label scale together. default = text-sm; xs = 11px for dense tool panels.
  - All native label HTML attrs
when_to_use: Every Input / Textarea / Checkbox / Switch / RadioGroup. Always use htmlFor so clicking the label focuses the control. Match `size` to the field it labels (size="xs" label over a size="xs" input).
composes_with: [Input, Textarea, Checkbox, Switch, RadioGroup, Select]
aliases: [label, form label, field label, caption]
---

```jsx
<Label htmlFor="name">Full name</Label>
<Input id="name" />
```

---

---
name: Logo
import: "@gradeui/ui"
subcomponents: []
props:
  - sources?: LogoSources — artwork keyed by lockup then appearance: { square?: { light?, dark?, mono? }, horizontal?: {...}, icon?: {...} }. Each slot is any node (inline <svg>, <img>, component). OMIT ENTIRELY and the GRADE MARK renders (the square G-arrow, painted with currentColor so it sits correctly on any surface). A bare <Logo /> is always correct branding.
  - size? ("sm" | "md" | "lg" | "xl") — height of the mark: 20 / 28 / 40 / 56px (a raw pixel number also works). Width is intrinsic (square/icon 1:1, horizontal keeps its ratio). Default "md"; use "sm" in dense rails and toolbars.
  - lockup? ("square" | "horizontal" | "icon") — which shape to show; falls back to the next-best available artwork. Default "horizontal".
  - mode? ("light" | "dark") — the background the logo SITS ON, selecting light/dark artwork. Explicit, not theme-coupled. Default "light".
  - mono?: boolean — render the single-colour treatment; inherits currentColor from the parent. Default false.
  - label?: string — accessible name (aria-label + role="img"); pair with decorative when the brand name is already beside it.
  - decorative?: boolean — aria-hidden, no role; use when text nearby names the brand.
  - href?: string — renders the logo as a link (logo-links-home).
  - lockup?: "square" | "horizontal" | "icon" (default "horizontal")
  - mode?: "light" | "dark" (default "light") — the background the logo sits on
  - mono?: boolean (default false) — use the single-colour artwork (inherits currentColor)
  - size?: "sm" | "md" | "lg" | "xl" | number (default "md") — height; width is intrinsic
  - label?: string — accessible name (brand name); becomes aria-label + role="img"
  - decorative?: boolean — aria-hidden when the name is already nearby
  - href?: string — renders the logo as a link (logo-links-home)
  - className?: string
when_to_use: ALWAYS use <Logo> wherever a screen carries a brand mark —
  app-shell headers, sidenav headers, toolbars, footers, sign-in pages, hero
  navs, splash states, Motion network-bug overlays. NEVER fake a brand with
  placeholder text, initials in a circle, a generic lucide icon, or a bare
  <img>. When the user hasn't named a brand or supplied artwork, render a
  bare <Logo /> — it defaults to the GRADE mark (the square G-arrow), which
  is the intended branding for unbranded screens. When the user names their
  own brand, pass their artwork via `sources` (with a `label`). Built-in
  variations — square for tight spaces, horizontal lockup for headers,
  monochrome for busy/inverted surfaces — all switchable by prop.
composes_with: [AppShell, AppShellHeader, Sidebar, SidebarHeader, Toolbar, MotionOverlay, Row, Stack]
aliases: [logo, brand, brandmark, wordmark, lockup, brand logo, app logo, logotype, grade mark, g arrow]
---

```jsx
// THE DEFAULT — no brand named, no artwork supplied: the Grade mark.
// Size it and set the surrounding text colour; nothing else needed.
<Row gap="sm" align="center" className="text-foreground">
  <Logo lockup="square" size="sm" decorative />
  <span className="text-sm font-semibold">Grade</span>
</Row>
```

```jsx
// A branded screen: supply the brand's own artwork per slot.
<Logo
  lockup="horizontal"
  mode="dark"
  size="md"
  label="Acme"
  sources={{
    square: { light: <AcmeSquare />, dark: <AcmeSquareWhite /> },
    horizontal: { light: <AcmeWide />, dark: <AcmeWideWhite /> },
    icon: { mono: <AcmeGlyph /> },
  }}
/>
```

```jsx
// In a Motion's broadcast layer — the network bug is a Logo, not a div.
<MotionOverlay zone="top-right">
  <span className="text-white">
    <Logo lockup="square" size="sm" label="Grade" />
  </span>
</MotionOverlay>
```

### Anti-patterns

DO NOT fake a brand mark with initials in a circle, placeholder text like
"LOGO", or a generic lucide icon — `<Logo />` with no props IS the correct
unbranded default (it renders the Grade mark).

DO NOT drop a bare `<img src="logo.png">` in a toolbar/sidenav/footer when you
want light/dark or square/horizontal switching — use `<Logo>` so the variant
is a prop.

DO NOT invert a colour logo with a CSS filter to fake a dark version — supply
the brand's real `dark` artwork in the `sources` slot.

DO NOT set both `label` and `decorative` — `decorative` hides the logo from
assistive tech; `label` names it. Pick one (name it unless the brand name is
already in the DOM right beside it).

DO NOT hardcode a width — `size` sets the height and the artwork keeps its own
aspect ratio (square/icon are 1:1, horizontal stays wide).

---

---
name: Map
import: "@gradeui/ui"
subcomponents: [MapMarker]
aliases: [map, maps, mapbox, maplibre, google maps, geo, location, latlng, coordinates, marker, pin, airbnb, listings, fleet, real estate, logistics, map view, mapkit, mapview, react native maps, rn maps]
props:
  - Map: provider — "maplibre" (default, free, no key) | "mapbox" (needs accessToken) | "google" (needs apiKey). Switching is one prop change.
  - Map: center — `[lng, lat]` tuple. ALWAYS lng first. Required.
  - Map: zoom — number, 0–22. Required.
  - Map: bounds — `[[swLng, swLat], [neLng, neLat]]`. When set, takes precedence over center+zoom.
  - Map: appearance — "light" | "dark" | "satellite" | "auto" (default "auto", follows GradeThemeProvider mode).
  - Map: hoveredId — controlled string id, pairs with onHoveredIdChange. The matching MapMarker gets `data-gds-state="hovered"` automatically. This is how you build list ↔ map two-way sync.
  - Map: onHoveredIdChange — `(id: string | null) => void`. The other half of the controlled hover pair: fires when the pointer enters/leaves a marker so the sibling list can highlight in step. Without this entry in the contract, screens using the documented two-way sync fail save validation.
  - Map: interactive — false freezes pan/zoom, useful for static cards.
  - Map: tools — "auto" (default, zoom buttons follow `interactive`) | "zoom" (force zoom buttons) | "none" (chrome-free map; attribution always stays — license). One vocabulary across all providers.
  - Map: toolsPosition — "top-left" (default) | "top-right" | "bottom-left" | "bottom-right". Corner the tools dock to; use when a search bar or legend sits over the default corner.
  - Map: onLoad(handle) / onError(error) — handle exposes flyTo, panTo, fitBounds, getCenter, getZoom, getBounds, instance.
  - Map: tilerKey? — MapLibre only (provider="maplibre"). Optional everywhere: omit on `gradeui.com`/`localhost` and the referrer-locked demo key is used; set it only when embedding off-domain. The contract never requires it.
  - Map: accessToken? — Mapbox only. Pass it whenever provider="mapbox" — the component itself enforces this at runtime (throws a clear `provider="mapbox" requires an accessToken prop` error via onError if missing). It is OPTIONAL in the contract on purpose, so the validator never demands it from maplibre/google maps.
  - Map: apiKey? — Google only. Pass it whenever provider="google" — the component enforces it at runtime (throws `provider="google" requires an apiKey prop` via onError if missing). OPTIONAL in the contract on purpose, so it's never demanded from maplibre/mapbox.
  - MapMarker: id — string. Required. Stable marker id; pair with Map's `hoveredId` for list↔map hover sync.
  - MapMarker: at — `[lng, lat]` tuple. Required. THE coordinate prop. ALWAYS lng first. The prop is literally named `at` — it is NOT `lngLat`, `coordinates`, `position`, `latLng`, `center`, or separate `lng`/`lat` props. Passing any other name leaves the marker coord `undefined`, and MapLibre throws on mount, crashing the WHOLE screen in every renderer. When in doubt, copy the `airbnb-listings` scaffold: `<MapMarker id={l.id} at={l.coords}>`.
  - MapMarker: anchor — "center" | "bottom" (default "bottom", pin tip sits on the coord). Only these two values.
  - MapMarker: onClick — handler called with `({ id, coords, native })` on marker click.
  - MapMarker: children — DOM rendered as the marker (Badge, Card, Avatar, or any element). Inherits `--gds-*` tokens.
when_to_use: Any layout that needs a real map — listings (real estate, Airbnb-style), fleet/logistics dashboards, store locators, anywhere a user picks a location from a viewport. Reach for the controlled `hoveredId` prop when a sibling list and the map need to highlight each other.
composes_with: [Card (as marker content), Badge, Avatar, Button, Row, Stack, Skeleton]
---

Default — zero config, MapLibre + MapTiler demo tiles. Works on `gradeui.com` and `localhost` with no setup:

```jsx
<Map center={[-122.42, 37.78]} zoom={12}>
  <MapMarker id="hq" at={[-122.42, 37.78]}>
    <Badge>HQ</Badge>
  </MapMarker>
</Map>
```

Two-way list ↔ map hover sync — the canonical pattern. ALWAYS use the controlled `hoveredId` prop, do NOT call `mapRef.current.flyTo` on every list-item hover yourself:

```jsx
const [hoveredId, setHoveredId] = useState(null);

<Row>
  <Stack>
    {listings.map(l => (
      <Card
        key={l.id}
        onMouseEnter={() => setHoveredId(l.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <CardHeader><CardTitle>{l.title}</CardTitle></CardHeader>
        <CardContent>${l.price}/night</CardContent>
      </Card>
    ))}
  </Stack>

  <Map
    center={[-122.42, 37.78]}
    zoom={12}
    hoveredId={hoveredId}
    onHoveredIdChange={setHoveredId}
  >
    {listings.map(l => (
      <MapMarker key={l.id} id={l.id} at={l.coords}>
        <Badge>${l.price}</Badge>
      </MapMarker>
    ))}
  </Map>
</Row>
```

Provider swap — one line:

```jsx
<Map provider="mapbox" accessToken={env.MAPBOX_TOKEN} center={[-0.1, 51.5]} zoom={11} />
<Map provider="google" apiKey={env.GOOGLE_MAPS_KEY} center={[-0.1, 51.5]} zoom={11} />
```

The contract is deliberately provider-AGNOSTIC. `tilerKey`, `accessToken`, and `apiKey` are all OPTIONAL in the contract so any valid provider config validates — a maplibre map needs no key on-domain, a mapbox map carries `accessToken`, a google map carries `apiKey`, and none of them trip a `missing-required` error for a key another provider uses. The knowledge of which key a provider needs lives in the component/adapter at runtime, not the static contract: maplibre falls back to the referrer-locked demo key; mapbox throws `provider="mapbox" requires an accessToken prop`; google throws `provider="google" requires an apiKey prop` — each surfaced via `onError({ code: "api-key-missing" })`. Maintainers: do NOT re-mark these credentials required in the contract — that's the bug that blanket-required all three and broke on-domain maplibre maps.

ANTI-PATTERNS — don't do these:

- DO NOT name the marker coordinate prop anything other than `at`. It is `<MapMarker id="…" at={[lng, lat]} />` — NOT `lngLat`, `coordinates`, `position`, `latLng`, or `center`. A wrong name passes JSX validation (the validator only checks `<Map>`'s contract, not subcomponent prop names) but registers an `undefined` coord, so MapLibre throws on mount and the whole screen fails to render.
- DO NOT pass `{ lat, lng }` objects. Coordinates are ALWAYS `[lng, lat]` tuples. Google's adapter handles the object conversion internally.
- DO NOT hand-roll an iframe with a Google Maps embed URL. Use `<Map provider="google" apiKey={...}>`.
- DO NOT use `useRef` + `mapRef.current.flyTo(id)` on list-hover when `hoveredId` already does it controlled.
- DO NOT call `setStyle` or reach for `mapboxgl.Marker` directly — use `appearance` and `<MapMarker>`. The escape hatch (`mapRef.current.instance`) is for things the wrapper genuinely doesn't expose (3D extrusions, drawing tools, heatmaps).
- DO NOT render >500 markers without clustering. The component warns in dev. For larger datasets, drop to `.instance` and use the provider's clustering layer.

Markers are DOM — children inherit `--gds-*` tokens. Drop a `<Card>`, `<Badge>`, `<Avatar>`, or anything else inside `<MapMarker>` and it themes correctly.

Stacking inside a marker follows normal DOM order on every provider — you do NOT need `z-index` hacks to layer content (e.g. a count label sitting on top of an inline pin-shield `<svg>`). The DS neutralizes Leaflet's vendor rule that sets `z-index: 200` on map `<svg>` elements (via `[data-gds-part="map-marker-content"] svg { z-index: auto }` in `globals.css`); without it, an inline SVG would paint above later siblings on Leaflet (the default provider) but not on Mapbox/MapLibre/Google, making the same marker markup look provider-dependent. If you nest an inline SVG behind text in a marker, just rely on source order.

For a floating text label over busy tiles, add the `gds-map-label` class — it applies a mode-aware halo (`--gds-map-label-halo`: white stroke on light tiles, near-black on dark) so the label never washes out. Don't hard-code a white `-webkit-text-stroke`.

Note: `<Map>` carries no border-radius or border of its own — it's an unopinionated primitive (the container clips with `overflow: hidden`). Round or frame it from the call site with `className` (e.g. `rounded-xl border`).

---

---
name: MediaSurface
import: "@gradeui/ui"
props:
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" — when omitted, derived from `hint` (album/product/food → square, portrait/poster → portrait, landscape → wide, video/audio/embed/generic → video)
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "none") — driven by `--gds-media-radius` CSS var. Square by default so a slot mounted flush at the top of a Card lets the Card clip it; set `lg`/`xl` for a standalone rounded image
  - border?: boolean (default false)
  - loading?: boolean — renders the muted skeleton overlay
  - hint?: "album" | "portrait" | "landscape" | "poster" | "product" | "food" | "video" | "audio" | "embed" | "3d" | "generic" (default "generic") — picks the placeholder glyph + the default aspect + the future generation provider
  - alt?: string — becomes the eventual `<img alt>`; also drives the placeholder caption and small-tier initials
  - instanceId?: string — stable per-instance id stamped as `data-gds-instance-id`. Use when rendering MediaSurfaces from a data array (`.map(item => <MediaSurface instanceId={item.id} …/>)`): it's how Studio's selection + Fill flows tell one card apart from its siblings and patch only that entry's data
  - source?: { kind, …per-kind fields } — structured metadata for the generation pipeline. Shapes per kind — album: { artist, title, year? } · poster: { title, year? } · portrait: { name?, role? } · landscape: { location?, mood? } · product: { name?, brand? } · food: { dish?, cuisine? } · generic: { prompt } · video/audio/embed/3d: no fields
  - src?: string — when set, renders an `<img>` filling the slot via object-cover; the wrapper keeps its chrome
  - glyph?: ReactNode — per-instance override of the hint-derived placeholder glyph (escape hatch for unusual slots)
  - overlay?: ReactNode — decorative layer rendered ABOVE the media/placeholder (play buttons, hover gradients, corner badges, progress bars). Does NOT suppress the placeholder — use this for decoration, use `children` for replacement
  - emptyState?: "auto" | "icon" | "none" | ReactNode — "auto" (default) renders the size-tiered placeholder; "icon" is a legacy alias; "none" disables; a node fully overrides
  - className?: string
  - children?: ReactNode — escape hatch for putting a custom `<video>`, `<canvas>`, Rive runtime, etc. inside. When supplied, the placeholder is suppressed
when_to_use: The canonical media slot for ALL non-person imagery — album art, posters, hero images, landscape photos, video and 3D containers. Pass `hint` + `alt` + (optionally) `source` so the empty-state placeholder is meaningful and the generation pipeline can later fill the slot with a real image. Use directly for declarative slots; the higher-level VideoPlayer / RivePlayer / ThreeScene wrap this for runtime-heavy media.
composes_with: [Card (as the image slot), CardBlock, MediaBlock, VideoPlayer, RivePlayer, ThreeScene]
aliases: [media, image slot, media slot, image placeholder, cover, thumbnail, poster slot, image, image view, image well, imagebackground, asyncimage, react native image, fastimage]
notes: |
  Anti-patterns to avoid:

  - DO NOT wrap <Avatar> inside <MediaSurface> to get a 2-letter initials
    fallback. That conflates two primitives. Set `alt` + `hint` on
    MediaSurface directly — the placeholder already renders initials at
    small sizes derived from `alt`.
  - DO NOT use <Avatar> for album art, posters, products, food, landscapes,
    etc. Avatar is for PEOPLE only (circular, social context). Use
    MediaSurface with the appropriate `hint`.
  - DO NOT inline manual gradient backgrounds (`bg-gradient-to-br …`) on
    MediaSurface as a "placeholder vibe" — the empty-state placeholder is
    already styled via `--gds-media-placeholder-bg/-fg` and themes with
    the rest of the design system.

  When you have a real image URL, pass it as `src=`. The wrapper keeps its
  aspect/radius/border chrome and fills with object-cover.
---

```jsx
{/* Empty placeholder — model emits this before generation has filled the slot */}
<MediaSurface
  hint="album"
  alt="Travelling Without Moving — Jamiroquai"
  source={{ kind: "album", artist: "Jamiroquai", title: "Travelling Without Moving" }}
  radius="md"
/>

{/* Filled — same component, now with a src */}
<MediaSurface
  hint="album"
  alt="Travelling Without Moving — Jamiroquai"
  src="https://coverartarchive.org/release/.../front-500.jpg"
  radius="md"
/>

{/* Video container — children escape hatch */}
<MediaSurface aspect="video" radius="lg">
  <video src="/intro.mp4" controls className="absolute inset-0 h-full w-full" />
</MediaSurface>
```

---

---
name: Message
import: "@gradeui/ui"
props:
  - author: string — display name of the message author
  - timestamp?: ReactNode — string ("11:24", "2 hours ago") or any node for custom formatting
  - avatar?: ReactNode — slot for any `<Avatar>` composition; omit for grouped messages from the same author
  - badge?: ReactNode — small chip(s) next to the author name (OP, Bot, Admin, role tag)
  - edited?: boolean | string — renders "(edited)" hint next to timestamp; pass a string to customise ("(edited 2 minutes ago)")
  - pinned?: boolean — renders a pin glyph + "Pinned" label above the header row for sticky / pinned messages
  - actions?: ReactNode — end-of-header slot, typically hover-revealed icon buttons (reply / react / more)
  - reactions?: ReactNode — slot below the body, typically a Row of reaction chips (emoji + count)
  - threadCount?: number — renders a "N replies" link affordance below the body
  - onThreadClick?: () => void — handler for the threadCount affordance
  - align?: "start" | "end" — `start` (default) puts the avatar on the left; `end` mirrors for "your messages" in DM threads
  - density?: "default" | "compact" — `default` is the canonical chat / channel-feed rhythm; `compact` tightens text sizes + gaps for dense side panels (Studio comments, activity feeds). Pair with `Avatar size="xs"` for the tightest stack.
  - children: ReactNode — body content (plain text or rich nodes)
  - className?: string
when_to_use: |
  The canonical "avatar + author + timestamp + body" row. THE PRIMITIVE
  for any chat surface, comment thread, post-reply, activity log, or
  notification feed that follows the people-and-text shape.

  CONCRETE TEST — if you find yourself composing an `<Avatar>` followed
  by a `<Row>` of author name + timestamp, with a `<p>` or `<span>`
  body below, STOP. That is `<Message>`. Reach for it directly.

  Slack-style channel feed, Discord messages, Teams chat, Linear /
  GitHub / Jira comments, Reddit replies, Twitter/X posts in a thread,
  Notion comment sidebars, in-app activity logs, notification rows —
  every one of these IS `<Message>`. Do not roll the layout inline.

  For non-people activity (system events, log lines, status pings) use
  Callout or a plain Row instead — Message implies a human author.
composes_with: [Avatar (in the avatar slot — pair with AvatarFallback tone="..." for stable per-author colour), Badge (in the badge slot for role / OP / bot tags), Button (in actions, typically size="icon" + variant="ghost"), Stack (host multiple Messages in a thread), Card (wrap a Stack of Messages for a comment-thread block)]
aliases: [
  message, chat message, comment, post, reply, activity row, notification row,
  thread row, channel message, dm message, slack message, discord message,
  teams message, channel feed message, feed item, feed row, message row,
  user message, user post, conversation message, conversation row,
  inline comment, threaded reply, message bubble, chat bubble, talk bubble
]
---

```jsx
// Comment thread shape — avatar left, body below the author row.
<Stack gap="md">
  <Message
    author="alice"
    timestamp="2 hours ago"
    avatar={
      <Avatar size="sm">
        <AvatarFallback tone="violet">A</AvatarFallback>
      </Avatar>
    }
  >
    Splitting this into two PRs makes the review tractable.
  </Message>
  <Message
    author="ben"
    timestamp="1 hour ago"
    badge={<Badge variant="outline" className="text-[10px]">OP</Badge>}
    avatar={
      <Avatar size="sm">
        <AvatarFallback tone="amber">B</AvatarFallback>
      </Avatar>
    }
  >
    Agreed. I'll take the schema PR.
  </Message>
</Stack>
```

```jsx
// Chat shape — your messages right-aligned via align="end".
<Stack gap="md">
  <Message
    author="alice"
    timestamp="11:24"
    avatar={
      <Avatar size="xs">
        <AvatarFallback tone="violet">A</AvatarFallback>
      </Avatar>
    }
  >
    Hey, how's the launch going?
  </Message>
  <Message
    author="you"
    timestamp="11:26"
    align="end"
    avatar={
      <Avatar size="xs">
        <AvatarFallback tone="emerald">Y</AvatarFallback>
      </Avatar>
    }
  >
    Launch image is in, scheduling now.
  </Message>
</Stack>
```

```jsx
// Full Slack-style message — edited indicator, pinned flag, reactions
// row, threaded reply count, role badge, hover actions.
<Message
  author="alice"
  timestamp="11:24"
  edited
  pinned
  badge={<Badge variant="secondary" className="text-[10px]">Designer</Badge>}
  avatar={
    <Avatar size="md">
      <AvatarFallback tone="violet">A</AvatarFallback>
    </Avatar>
  }
  reactions={
    <>
      <Badge variant="outline" className="gap-1 cursor-pointer">👍 4</Badge>
      <Badge variant="outline" className="gap-1 cursor-pointer">🎉 2</Badge>
    </>
  }
  threadCount={3}
  onThreadClick={() => openThread(messageId)}
>
  Updated the token spec — review when you have a chance.
</Message>
```

```jsx
// Slack / Discord channel feed — with role badge + hover-revealed actions.
<Stack gap="lg">
  {messages.map((m) => (
    <Message
      key={m.id}
      author={m.user}
      timestamp={m.time}
      badge={<Badge variant="secondary" className="text-[10px]">{m.role}</Badge>}
      avatar={
        <Avatar size="md">
          <AvatarImage src={m.avatar} />
          <AvatarFallback tone="sky">{m.user.charAt(0)}</AvatarFallback>
        </Avatar>
      }
      actions={
        <Row gap="xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-6 w-6"><Smile className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6"><Reply className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button>
        </Row>
      }
      className="group"
    >
      {m.text}
    </Message>
  ))}
</Stack>
```

```jsx
// Compact density — for narrow side panels (Studio Comments tab,
// activity feeds, notification rows). Notice the smaller Avatar size
// pairs naturally with density="compact".
<Stack gap="sm">
  <Message
    density="compact"
    author="alice"
    timestamp="2m ago"
    edited="· edited 1m ago"
    avatar={
      <Avatar size="xs">
        <AvatarFallback tone="violet">A</AvatarFallback>
      </Avatar>
    }
  >
    Splitting this into two PRs makes the review tractable.
  </Message>
  <Message
    density="compact"
    author="ben"
    timestamp="1m ago"
    avatar={
      <Avatar size="xs">
        <AvatarFallback tone="amber">B</AvatarFallback>
      </Avatar>
    }
  >
    Agreed. I'll take the schema PR.
  </Message>
</Stack>
```

## Anti-patterns

```jsx
// ❌ Rolling the message layout by hand from Avatar + Row + Badge + spans.
//    This is the EXACT shape Message exists to consolidate — caught in
//    the wild on a "Slack clone" prompt where the model assembled this
//    inline instead of reaching for Message. The result loses the
//    align="end" knob, the actions slot, the data-gds-part hooks, and
//    duplicates the same flex template across every consumer.
{messages.map((msg) => (
  <div className="group flex gap-4">
    <Avatar className="w-9 h-9 shrink-0">
      <AvatarImage src={msg.avatar} />
      <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <Row gap="sm" align="baseline">
        <span className="font-semibold text-sm">{msg.user}</span>
        <Badge variant="secondary" className="text-[10px]">{msg.role}</Badge>
        <span className="text-[10px] text-muted-foreground">{msg.time}</span>
      </Row>
      <p className="text-sm mt-1">{msg.text}</p>
    </div>
  </div>
))}

// ✅ The Grade way.
{messages.map((msg) => (
  <Message
    key={msg.id}
    author={msg.user}
    timestamp={msg.time}
    badge={<Badge variant="secondary" className="text-[10px]">{msg.role}</Badge>}
    avatar={
      <Avatar size="md">
        <AvatarImage src={msg.avatar} />
        <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
      </Avatar>
    }
  >
    {msg.text}
  </Message>
))}
```

```jsx
// ❌ Building a custom "AuthorDot" or "MessageRow" component inline as
//    a one-off helper inside a scaffold. Three scaffolds did this before
//    Message landed; the pattern is always identical.
function MessageRow({ user, body, time }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="h-7 w-7 rounded-full bg-violet-500/20 ...">{user[0]}</div>
      <div>
        <Row><strong>{user}</strong> <small>{time}</small></Row>
        <p>{body}</p>
      </div>
    </div>
  );
}

// ✅ Use Message. The colored-initials avatar pattern is covered by
//    Avatar + AvatarFallback tone="...".
<Message
  author={user}
  timestamp={time}
  avatar={<Avatar size="sm"><AvatarFallback tone="violet">{user[0]}</AvatarFallback></Avatar>}
>
  {body}
</Message>
```

---

---
name: Motion
import: "@gradeui/ui"
subcomponents: [MotionScene, MotionScreen, MotionText]
props:
  - view?: "play" | "strip" (default "play") — play runs the film; strip lays
      scenes out left-to-right as labelled cards (the arrangement view).
  - aspect?: "auto" | "16/9" | "9/16" | "1/1" (default "auto") — fixed artboard
      aspect, letterboxed into the container. "9/16" is the TikTok / Reels /
      Shorts format; "auto" fills responsively. Strip cards adopt the ratio.
  - stage?: string — CSS background of the persistent stage behind every scene.
  - backdrop?: React.ReactNode — live layer behind all scenes (image, gradient, <ThreeScene>).
  - autoplay?: boolean (default true)
  - loop?: boolean (default false — a motion is a movie, it ends)
  - controls?: boolean (default true) — play/pause, restart, scene dots (random access)
  - children: <MotionScene> elements, in order.
  - "MotionScene: label?, durationMs? (MINIMUM runtime; the whole clock when
      nothing inside keeps time, default 4000), fill? (scene background over
      the stage — e.g. a white title card), transition? ('fade' | 'slide-up' |
      'slide-down' | 'slide-left' | 'slide-right' | 'pop' | 'zoom' |
      'wipe-circle' (a circular mask wipe) | 'none' — how the scene ARRIVES.
      The OUTGOING scene stays visible as a frozen layer UNDERNEATH for the
      transition window, so slides reveal it and wipes cut through it),
      transitionMs? (timing override; each transition has a sensible
      default), children (ANY JSX)."
  - "MotionScreen: device? ('desktop' | 'mobile'), shots? (its OWN ScreenAnimator
      camera), virtualWidth?, spotlight?, cursor?, enter? (default FALSE —
      the offscreen fly-in reads badly inside a small frame; use scene
      transition / animate for entrances), animate? ('rise' |
      'tilt-settle' — entrances; 'float' | 'drift' — ambient loops; 'none'
      default — animates the FRAME in place within the scene, composable with
      the camera inside; pair entrances with enter={false}), screenId?
      (provenance, ignored at render), children (the screen content, copied in)."
  - "MotionText: template? ('title' | 'lower-third' | 'section-break' |
      'broadcast' — the TV-style full-width brand-blue band that sits over
      the screen | 'ticker' — a news-style marquee bar pinned to the very
      bottom: heading is the uppercase label chip, text scrolls in an
      infinite loop | 'stat' — an oversized statistic slate: heading is the
      number slamming in at up to 180px, text is the label fading up below |
      'quote' — an editorial pull-quote with a decorative oversized opening
      mark: heading is the quote, text the em-dash attribution), heading,
      text?, durationMs?, tone? ('light' | 'dark'). 'ticker' pairs well
      inside MotionOverlay zone='bottom' for a film-level ticker that runs
      across every scene."
  - "MotionOverlay: the BROADCAST layer — a peer of MotionScene inside
      <Motion> that renders above every scene for the film's runtime:
      network-bug logo, live wall clock (which keeps ticking when playback
      pauses — better-than-video proof it's live), ticker, persistent
      video. zone? ('top-left' | 'top' | 'top-right' | 'center' |
      'bottom-left' | 'bottom' | 'bottom-right' | 'lower-third'),
      fromScene?/toScene? (scene-range visibility — overlays are a second
      timeline; defaults = always on), interactive? (re-enable pointer
      events), children (any JSX)."
when_to_use: A directed sequence of scenes on one persistent stage — the
  text → demo → video → text grammar of a modern product demo. A scene is a
  stage MOMENT holding arbitrary JSX; screens go inside scenes via
  <MotionScreen> (each with its own camera — two side by side shows
  mobile + desktop), templated text via <MotionText>, video/images as plain
  children. A scene advances when all its timed children finish (camera tours,
  text templates), or after durationMs when nothing keeps time. Use
  <ScreenAnimator> alone for a single directed screen; use <Motion> the moment
  there's a sequence.
composes_with: [ScreenAnimator, ThreeScene, VideoPlayer, AppShell, the whole component set (scenes hold screens)]
aliases: [motion, grade motion, scenes, sequence, demo reel, product video, launch video, title card, lower third, section break, multi-scene, storyboard]
---

```jsx
// Title card → dashboard at two viewports → video clip. One stage throughout.
<Motion>
  <MotionScene label="Hook">
    <MotionText template="title" heading="Meet the new pipeline" text="From prompt to product" />
  </MotionScene>
  <MotionScene label="Dashboard">
    <MotionScreen device="mobile" shots={[{ zoom: 1, hold: 2000 }, { zoom: 2, cx: 0.5, cy: 0.25, hold: 2400, label: "Live on mobile" }]}>
      <DashboardMobile />
    </MotionScreen>
    <MotionScreen shots={[{ zoom: 1, hold: 2400 }, { zoom: 2.2, cx: 0.22, cy: 0.3, hold: 2600, label: "Revenue up 24%" }]}>
      <Dashboard />
    </MotionScreen>
  </MotionScene>
  <MotionScene label="Proof">
    <MotionText template="stat" heading="4.2x" text="Faster from prompt to product" />
  </MotionScene>
  <MotionScene label="Word">
    <MotionText template="quote" heading="It feels like the demo directs itself." text="Head of Design, Acme" />
  </MotionScene>
  <MotionScene label="Clip" durationMs={6000}>
    <video src="/clip.mp4" autoPlay muted style={{ borderRadius: 12, maxWidth: "70%" }} />
    <MotionText template="ticker" heading="Live" text="Grade Motion ships scene transitions, broadcast overlays and a directed camera" />
  </MotionScene>
</Motion>
```

### Anti-patterns

DO NOT wrap a whole scene in <ScreenAnimator> — the camera belongs to each
<MotionScreen> inside the scene, not to the scene. A scene with two screens
has two cameras.

durationMs is a MINIMUM runtime, not just a fallback: a scene with a 3s
lower-third and `durationMs={16000}` runs the full 16s (the caption ending
early never cuts a long visual mid-flight). Timed children can extend a
scene PAST the floor; with no timed children, durationMs is the whole clock.

DO NOT use it as a layout wrapper — like ScreenAnimator it positions
`absolute inset-0` and takes over the frame.

DO NOT worry about reduced motion — the play view falls back to the strip
(see everything, move nothing).

---

---
name: MultiSelect
import: "@gradeui/ui"
props:
  - options: { value: string; label: string; icon?: ComponentType; disabled?: boolean }[]
  - value?: string[] — controlled selection
  - defaultValue?: string[] — uncontrolled initial selection
  - onValueChange?: (next: string[]) => void
  - placeholder?: string (default "Select…")
  - searchPlaceholder?: string (default "Search…")
  - emptyMessage?: string (default "Nothing matches.")
  - maxCount?: number (default 3) — badges shown on the trigger before collapsing to "+N more"
  - searchable?: boolean (default true) — hide for short option lists
  - badgeDismissible?: boolean (default true) — show × on each selected badge
  - disabled?: boolean
  - modalPopover?: boolean (default false) — Popover modal mode
  - className?: string
when_to_use: |
  Picking multiple items from a finite list — tag selectors, filter chips,
  "share with N people", multi-region settings.

  **This is the answer for ANY "removable-chips-inside-an-input" pattern.**
  MultiSelect's trigger renders the current selection as Badges with X
  icons (the "chip-in-trigger" / "chip-in-input" shape), opens a Popover
  with a searchable Command list, and supports "+N more" collapse past
  `maxCount`. Reach for it for:
    - Linear-style filter bars (assignee, label, project chips inside one trigger)
    - Slack channel pickers (selected channels as removable chips)
    - Notion relation properties (related-page chips)
    - GitHub label / assignee pickers
    - tag / category / mention pickers anywhere
  Don't invent a `<ChipInput>` or `<TagInput>` for these — MultiSelect
  already covers the trigger-with-badges shape.

  Use `<Select>` instead for SINGLE selection. Use `<Command>` directly
  (no MultiSelect wrapper) when the option set is unbounded or async
  (users to @-mention, email recipients, search-as-you-type API results).
composes_with: [Popover, Command, Badge, Checkbox-style row indicator, Separator]
aliases: [
  multi select, multiselect, multi-select, tag picker, chips input,
  chip input, chipinput, tag input, taginput, chip picker, badge picker,
  multi picker, multi-pick combobox, multipicker, tag select,
  react native multi select, multi-select combobox,
  filter chips, filter bar chips, removable chips, removable pills,
  channel picker, label picker, recipient picker, relation picker,
  picker with chips, selected items as chips, badges in input,
  badges in trigger, pills in input, multi-select with badges
]
---

```jsx
const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "nuxt", label: "Nuxt" },
];

<MultiSelect
  options={frameworks}
  defaultValue={["next", "remix"]}
  onValueChange={setSelected}
  placeholder="Pick frameworks"
  maxCount={2}
/>
```

```jsx
// With per-option icons — the icon renders both in the dropdown row
// and on the selected badge.
import { Code2, Server, Cloud } from "lucide-react";
const services = [
  { value: "edge", label: "Edge runtime", icon: Cloud },
  { value: "node", label: "Node runtime", icon: Server },
  { value: "browser", label: "Browser only", icon: Code2 },
];

<MultiSelect options={services} placeholder="Select runtimes" />
```

```jsx
// Filter-bar chip picker (Linear / Jira style). Selected status chips
// render INSIDE the trigger with X icons; click the trigger to open the
// Popover and toggle more. Pair with a search Input to the left for the
// "search + scoped filters" composition (e.g. Reddit / Linear / GitHub
// header search). Don't reach for a custom ChipInput — this IS it.
const statuses = [
  { value: "todo", label: "Todo" },
  { value: "doing", label: "In Progress" },
  { value: "done", label: "Done" },
];

<Row gap="sm" align="center">
  <Input placeholder="Search issues…" className="flex-1" />
  <MultiSelect
    options={statuses}
    placeholder="Status"
    maxCount={2}
    badgeDismissible
  />
</Row>
```

### Anti-patterns

DO NOT use MultiSelect for single-pick — that's `<Select>`. The visual semantics differ (badges vs single value) and screen-reader announcements differ ("combobox, 2 selected" vs "combobox, Apple").

DO NOT pass `value` without `onValueChange` — the component becomes a read-only display of the controlled state and selections inside the popover silently no-op. Either go fully uncontrolled (`defaultValue`) or wire both.

DO NOT inline `options` as `[{value, label}, ...]` from scratch on every render — memoise it. The component memoises its internal lookup, but a fresh array reference on every parent render still forces React to reconcile every row.

DO NOT reach for MultiSelect when the list is unbounded or async (users to mention, email recipients, search-as-you-type API results). Use `<Command>` directly with custom rendering — MultiSelect's `options` model expects the full set up front.

DO NOT hand-roll a "chip input" / "tag input" / "search with removable filter chips" composition with raw Badge + Input + state. MultiSelect already covers the trigger-with-removable-Badges pattern (the chip-in-trigger shape). If your screenshot has selected items rendered as removable pills, MultiSelect is the answer — even if the source visual integrates the chips with a search field. (Genuine gap: the *typed-text-immediately-next-to-chips* search composition where the input is freeform and the chips are scopes — that's a Row of `<Input>` + `<MultiSelect>`, not a new primitive.)

---

---
name: Popover
import: "@gradeui/ui"
subcomponents: [PopoverTrigger, PopoverContent, PopoverAnchor]
props:
  - Popover: open?, defaultOpen?, onOpenChange?, modal? (default false)
  - PopoverTrigger: asChild?: boolean — usually a Button
  - PopoverContent: side? "top" | "right" | "bottom" | "left"; align? "start" | "center" | "end"; sideOffset?, alignOffset?, collisionPadding?, className?
  - PopoverContent: surface? (solid | translucent | glass | glass-strong) — what the popover surface is *made of*. `solid` is the default opaque `bg-popover`. `translucent` is the Apple HIG menu-sheet feel. `glass` for floating panels over rich canvases (Studio inspector, image-tool palette).
  - PopoverAnchor: asChild?: boolean — pin the popover to a different element than the trigger
when_to_use: A floating panel anchored to a trigger that contains interactive content — date pickers, color pickers, filter pickers, "more info" panels, inline forms. Differs from Tooltip (hover-only, no focusable content) and Dialog (modal, blocks the page). DatePicker, DateRangePicker, and the Combobox pattern all compose Popover internally.
composes_with: [Button (as trigger), Calendar (date picker), Command (combobox), Form controls (inline edit popover), Code (code-detail popovers)]
aliases: [popover, dropdown panel, floating panel, inline editor, attached panel, filter pop, popover view, popoverpresentation, attached popover, glass popover, frosted popover, inspector popover]
---

PopoverContent sits at elevation-4. Three scenario recipes — match the material to the canvas the popover floats over.

---

### Scenario 1 — Filter popover (default opaque)

You're attaching a filter picker to a button in a list/table header. The page behind is mostly white space and a table — there's nothing visually important to preserve through the popover. Opaque is the right default.

```jsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <Filter className="h-4 w-4" /> Filters
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-72" align="end">
    <Stack gap="md">
      <Stack gap="xs">
        <Label>Plan</Label>
        <Select>{/* … */}</Select>
      </Stack>
      <Stack gap="xs">
        <Label>Status</Label>
        <Select>{/* … */}</Select>
      </Stack>
      <Row justify="end" gap="xs">
        <Button variant="ghost" size="sm">Clear</Button>
        <Button size="sm">Apply</Button>
      </Row>
    </Stack>
  </PopoverContent>
</Popover>
```

`solid` keeps the form fields maximally legible. Filter popovers are read-heavy; legibility wins over aesthetic.

---

### Scenario 2 — Glass inspector popover (creative tool aesthetic)

You're building Studio, a presentation editor, or a vector tool. The user clicked a selected layer and a popover offers per-element knobs. The canvas behind is the work — they need to keep spatial awareness of what they just clicked. Glass is the canonical signal.

```jsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon"><Palette className="h-4 w-4" /></Button>
  </PopoverTrigger>
  <PopoverContent
    surface="glass"
    className="w-80 shadow-elevation-4"
    align="end"
    sideOffset={8}
  >
    <Stack gap="md">
      <Row justify="between" align="center">
        <span className="text-sm font-medium">Button — selected</span>
        <Badge variant="outline">raised</Badge>
      </Row>

      <Stack gap="xs">
        <Label>Tone</Label>
        <Row gap="xs">
          <Button size="sm" variant="raised" style={{ "--btn-glow": "var(--selected-glow)" }} />
          <Button size="sm" variant="raised" style={{ "--btn-glow": "var(--success)" }} />
          <Button size="sm" variant="raised" style={{ "--btn-glow": "var(--warning)" }} />
          <Button size="sm" variant="raised" style={{ "--btn-glow": "var(--destructive)" }} />
        </Row>
      </Stack>

      <Stack gap="xs">
        <Label>Size</Label>
        <ToggleGroup type="single" defaultValue="md">
          <ToggleGroupItem value="sm">sm</ToggleGroupItem>
          <ToggleGroupItem value="md">md</ToggleGroupItem>
          <ToggleGroupItem value="lg">lg</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
    </Stack>
  </PopoverContent>
</Popover>
```

`surface="glass"` + `shadow-elevation-4` is the Studio-inspector signature. The user's eye stays on the canvas; the popover reads as chrome layered above it.

---

### Scenario 3 — AI suggestion popover (translucent + aura)

A different shape from the destructive Dialog confirmation: an inline AI suggestion that surfaces while the user keeps working. Translucent stays light; aura announces the AI origin.

```jsx
<Popover open={hasSuggestion}>
  <PopoverAnchor>
    <Code source={selectedSnippet} language="tsx" highlight={[3]} bare />
  </PopoverAnchor>
  <PopoverContent
    surface="translucent"
    className="w-96 shadow-elevation-4 gds-aura-ring"
    style={{ "--aura-color": "var(--selected-glow)" }}
    side="bottom"
    align="start"
  >
    <Stack gap="sm">
      <Row gap="xs" align="center">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Studio suggestion</span>
      </Row>
      <p className="text-sm">
        This Toolbar would line up edge-to-edge with the TabsList below if it used <code>size="sm"</code>. Apply?
      </p>
      <Row justify="end" gap="xs">
        <Button variant="ghost" size="sm">Dismiss</Button>
        <Button size="sm">Apply</Button>
      </Row>
    </Stack>
  </PopoverContent>
</Popover>
```

Note `PopoverAnchor` — the popover is pinned to the selected snippet, not to a trigger button. This is the "annotation surfaces next to the thing it annotates" pattern.

---

### Anti-patterns

**DO NOT roll glass by hand on PopoverContent.**

```jsx
{/* ❌ Misses edge highlight, fixed-step blur. */}
<PopoverContent className="bg-popover/50 backdrop-blur-md">

{/* ✅ */}
<PopoverContent surface="glass">
```

**DO NOT use Popover for content that needs a modal interaction.** Popover is non-modal — pointer-down outside dismisses it. If the user must decide before continuing, reach for Dialog.

**DO NOT use `surface="glass-strong"` on PopoverContent.** It's tuned for full-page overlays; on a 288px popover it just reads as washed out.

**DO NOT use Popover when the trigger is a hover target with no focusable content.** That's Tooltip's job — Popover requires focus, Tooltip dismisses on hover-out.

---

---
name: Progress
import: "@gradeui/ui"
element: div
props:
  - value?: number (0–100) — percent complete
  - max?: number (default 100)
  - className?: string
when_to_use: Determinate progress — file uploads, multi-step forms, quota meters. Indeterminate state → use Skeleton or animated Loader icon.
composes_with: [Card (as a section), Badge (showing % next to it), Label (describing what's loading)]
aliases: [progress, progress view, progress indicator, progress bar, determinate progress, loading bar, completion bar]
---

```jsx
<Progress value={42} />
```

---

---
name: PropertyList
import: "@gradeui/ui"
props:
  - layout?: "row" | "stack" — row (default): label column beside value; stack: label above value for narrow panels
  - density?: "compact" | "default" | "relaxed" — row rhythm
  - align?: "start" | "center" — default vertical alignment of label vs value; use start when values wrap (tag groups, multi-line)
  - divider?: boolean — hairline rule between rows
  - labelWidth?: string — override the label column width (any CSS length); sets --gds-property-list-label-width
  - children: PropertyList.Row[]
when_to_use: Read-only display of the properties of a SINGLE item — detail panels, inspectors, "about this" cards, order/record summaries. It is a Table row transposed (schema vertical, one record). The value side is a polymorphic slot, so the same renderers that fill a Table cell (text, Badge, tag group, Avatar stack, date, link) drop straight into a row. For an EDITABLE field (label + control) use Field instead; a panel that flips between read and edit swaps a PropertyList for a stack of Fields.
composes_with: [Badge, Avatar, Table, Field, Separator, Card]
aliases: [property list, properties, property panel, description list, definition list, detail list, key value, key-value, data list, field list, attributes, metadata list, record summary, detail panel, inspector fields, spec list]
---

```jsx
<PropertyList>
  <PropertyList.Row label="Status" icon={<Activity />}>
    <Badge variant="warning-soft">Low</Badge>
  </PropertyList.Row>
  <PropertyList.Row label="Published">2026-06-18</PropertyList.Row>
  <PropertyList.Row label="Owner">
    <Avatar className="h-5 w-5"><AvatarFallback>EO</AvatarFallback></Avatar>
  </PropertyList.Row>
</PropertyList>
```

```jsx
<PropertyList density="compact" divider align="start">
  <PropertyList.Row label="Topics">
    <Row gap="xs" wrap>
      <Badge variant="secondary">Pricing</Badge>
      <Badge variant="secondary">Onboarding</Badge>
    </Row>
  </PropertyList.Row>
  <PropertyList.Row label="Business profiles">
    <Row gap="xs" wrap>
      <Badge variant="outline">Acme</Badge>
      <Badge variant="outline">Kite</Badge>
    </Row>
  </PropertyList.Row>
</PropertyList>
```

---

---
name: RadioCard
import: "@gradeui/ui"
props:
  - value: string (required) — the radio value
  - label?: ReactNode — title line
  - description?: ReactNode — secondary line
  - aside?: ReactNode — slot before the indicator (a Badge, price, hint)
  - hideIndicator?: boolean — hide the dot; selection shown by the card border + background
  - indicatorPosition?: "leading" | "trailing" — default trailing
  - children?: ReactNode — arbitrary static content (image, custom layout) instead of label/description
when_to_use: Single-select where each option is a whole selectable card (shipping options, plan picker, onboarding choices). The whole card is the control, so focus and the checked state live on the card surface and the entire card is clickable. MUST sit inside a RadioGroup (keeps roving focus + single-select). Static content only — never nest an interactive control (Slider/Input/Button/link) inside. For a plain radio + label row use Field instead.
composes_with: [RadioGroup (required parent), Badge (in aside), MediaSurface (custom children)]
aliases: [radio card, selectable card, option card, plan picker, choice card, pricing tier, segmented choice card]
---

```jsx
<RadioGroup defaultValue="standard" className="grid gap-3">
  <RadioCard value="standard" label="Standard" description="4–10 business days" />
  <RadioCard value="fast" label="Fast" description="2–5 business days" />
  <RadioCard value="next-day" label="Next day" description="1 business day" />
</RadioGroup>
```

Indicator on the leading edge instead of trailing:

```jsx
<RadioGroup defaultValue="standard" className="grid gap-3">
  <RadioCard value="standard" indicatorPosition="leading" label="Standard" description="4–10 business days" />
  <RadioCard value="fast" indicatorPosition="leading" label="Fast" description="2–5 business days" />
</RadioGroup>
```

No visible dot (selection reads from the card border + background), laid out in a grid via className on the group:

```jsx
<RadioGroup defaultValue="m" className="grid grid-cols-2 gap-3">
  <RadioCard value="s" hideIndicator label="Small" description="Up to 10 seats" />
  <RadioCard value="m" hideIndicator label="Medium" description="Up to 50 seats" />
</RadioGroup>
```

---

---
name: RadioGroup
import: "@gradeui/ui"
element: div
subcomponents: [RadioGroupItem]
props:
  - RadioGroup: value?: string — controlled selection
  - RadioGroup: defaultValue?: string — uncontrolled initial
  - RadioGroup: onValueChange?: (value: string) => void
  - RadioGroup: disabled?: boolean
  - RadioGroup: orientation? "horizontal" | "vertical" (default "vertical")
  - RadioGroup: name?: string — form name when posting natively
  - RadioGroupItem: value: string — what the group emits when this item is picked
  - RadioGroupItem: id?: string — pair with a <Label htmlFor> for click-on-label
  - RadioGroupItem: disabled?: boolean
when_to_use: A small set of mutually-exclusive options where the user needs to SEE all of them at once — pricing tiers (3-4 options), shipping speed, payment method radio cards. When each option should be a whole clickable card (label + description, selected state on the card), use RadioCard inside the RadioGroup instead of a Card with a radio in the corner. For a plain label + description row, wrap RadioGroupItem in Field. For 5+ options use Select. For a segmented control as part of a toolbar use ToggleGroup. For yes/no use Switch.
composes_with: [Label (paired with each item via htmlFor), Field (label + description row), RadioCard (whole-card selectable option), Stack (vertical list)]
aliases: [radio group, radio buttons, single-choice, pricing options, payment method, radio buttons, radio control, single-select]
---

```jsx
<RadioGroup defaultValue="pro" name="plan">
  <Stack gap="sm">
    <Row gap="sm" align="center">
      <RadioGroupItem id="plan-free" value="free" />
      <Label htmlFor="plan-free">Free</Label>
    </Row>
    <Row gap="sm" align="center">
      <RadioGroupItem id="plan-pro" value="pro" />
      <Label htmlFor="plan-pro">Pro — $12/mo</Label>
    </Row>
    <Row gap="sm" align="center">
      <RadioGroupItem id="plan-team" value="team" />
      <Label htmlFor="plan-team">Team — $48/mo</Label>
    </Row>
  </Stack>
</RadioGroup>
```

---

---
name: Resizable
import: "@gradeui/ui"
subcomponents: [ResizablePanelGroup, ResizablePanel, ResizableHandle]
props:
  - ResizablePanelGroup: direction: "horizontal" | "vertical" — required; sets the axis the user drags along
  - ResizablePanelGroup: autoSaveId?: string — persists user-adjusted sizes to localStorage under this id
  - ResizablePanelGroup: onLayout?: (sizes: number[]) => void
  - ResizablePanel: defaultSize?: number — percent of group (0-100); siblings should sum to ~100
  - ResizablePanel: minSize?, maxSize?: number — percent bounds
  - ResizablePanel: collapsible?: boolean — allow this panel to collapse to zero
  - ResizablePanel: collapsedSize?, onCollapse?, onExpand? — collapse behaviour controls
  - ResizableHandle: withHandle?: boolean — show a visible drag affordance (default just a hit-zone)
when_to_use: A multi-pane layout where the user wants to drag the divider — Slack/Mail-style list+detail, IDE editor+terminal, side-by-side compare view. Static layouts shouldn't use this — reach for AppShell with nav="three-pane" (fixed widths) or Grid (responsive ladder). Built on react-resizable-panels under the hood.
composes_with: [AppShellMain (host the splitter inside main), ScrollArea (each panel's content), Card]
aliases: [resizable, splitter, split pane, drag divider, adjustable panels, resizer, split view, draggable divider, split pane resizer, ns split view]
---

```jsx
// List + detail with a draggable divider, saved between sessions.
<ResizablePanelGroup direction="horizontal" autoSaveId="inbox">
  <ResizablePanel defaultSize={30} minSize={20}>
    <InboxList />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={70}>
    <ConversationView />
  </ResizablePanel>
</ResizablePanelGroup>
```

---

---
name: RivePlayer
import: "@gradeui/ui"
props:
  - src: string — URL or path to the .riv file
  - stateMachines?: string | string[] — state machine(s) to run
  - artboard?: string — artboard name; omit to use default
  - controls?: boolean (default false) — viewer mode by default; set true for play/pause overlay
  - autoPlay?: boolean (default true) — respects reduced-motion
  - loop?: boolean (default true)
  - pauseOffscreen?: boolean (default true)
  - fit?: "contain" | "cover" | "fill" | "fitWidth" | "fitHeight" | "none" (default "contain")
  - stateMachineInputs?: Record<string, number | boolean | string>
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" (default "square")
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "lg")
  - poster?: string — image shown while the runtime loads
when_to_use: Rive runtime wrapped in the shared media surface. Reach for Rive when you need interactive state-machine animations driven by scroll/hover/input. For non-interactive looping video, use VideoPlayer; for shader-driven backgrounds, use ThreeScene.
composes_with: [MediaSurface (internal), Card, any container]
aliases: [rive, riv, animation, animated, lottie]
notes: The Rive runtime (`@rive-app/react-canvas`) is an optional dependency of `@gradeui/ui` — lazy-imported at mount. Consumers who don't use Rive can install with `--no-optional` and the dep is skipped; RivePlayer renders a friendly error if the runtime is missing. When no `src` is given RivePlayer renders an empty surface — ALWAYS pass `src`. If you don't have a specific file, use the public Rive CDN sample "https://cdn.rive.app/animations/vehicles.riv" with `stateMachines="bumpy"` — a known-working demo.
---

```jsx
// Known-working public sample — use this when you don't have a specific .riv
<RivePlayer
  src="https://cdn.rive.app/animations/vehicles.riv"
  stateMachines="bumpy"
  aspect="square"
/>

// Player mode with state-machine inputs
<RivePlayer
  src="/button.riv"
  stateMachines="Hover"
  stateMachineInputs={{ isHovered: true }}
  controls
/>
```

---

---
name: Row
import: "@gradeui/ui"
role: layout
props:
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "md") — gap between children
  - align?: "start" | "center" | "end" | "stretch" | "baseline" (default "center") — cross-axis (vertical) alignment
  - justify?: "start" | "center" | "end" | "between" | "around" | "evenly" (default "start") — main-axis distribution
  - wrap?: boolean (default false) — allow children to wrap onto additional lines when they overflow
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
when_to_use: Horizontal composition — button groups, inline form rows, logo + nav rows, anything on one line. Reach for Row instead of `flex items-center gap-*` so the alignment and spacing are editable through the settings panel. For two-pane layouts with an explicit ratio (sidebar + content, 1/3 + 2/3) use Split instead — Row evenly flows whatever children it holds.
composes_with: [Button, Input, NavItem, Stack (can wrap a Row), any content component]
aliases: [row, hstack, horizontal, inline, horizontal layout, hstack, h-stack, horizontal stack, lazyhstack]
---

```jsx
// Button group — justify="end" pushes the group to the right.
<Row gap="sm" justify="end">
  <Button variant="ghost">Cancel</Button>
  <Button>Save</Button>
</Row>
```

```jsx
// Spread apart — logo left, action right.
<Row justify="between" align="center">
  <Logo />
  <Button>Sign in</Button>
</Row>
```

---

---
name: ScreenAnimator
import: "@gradeui/ui"
subcomponents: []
props:
  - shots?: Array<{ zoom?, cx?, cy?, hold?, trans?, label? }> — the tour. Each
      shot is a zoom (1 = fit, >1 push in), focal point cx/cy (0..1 fractions of
      the content), hold (ms dwell), trans (ms glide-in), and a caption label.
      Omit for a static framed view.
  - autoplay?: boolean (default true)
  - loop?: boolean (default true) — fly in → shots → back to start → exit → repeat
  - controls?: boolean (default true) — play / pause / restart transport
  - spotlight?: boolean (default false) — opt in to dim the edges (vignette) when pushed in
  - cursor?: boolean (default true) — synthetic cursor pulse on detail shots
  - enter?: boolean (default true) — fly in from offscreen on start
  - stage?: string — CSS background of the stage behind the screen (default dark)
  - backdrop?: React.ReactNode — a live layer behind the content (image, gradient, or a <ThreeScene> shader)
  - className?: string
  - children: React.ReactNode (the screen to animate)
when_to_use: Wrap ANY screen or section in a directed camera — a "live demo
  director". Give it a list of shots and it tours them (zoom + pan) over the
  live, still-interactive content, with a focus spotlight, captions, a synthetic
  cursor, and play/pause. Use it to turn a built screen into an auto-playing
  product demo (embed it, or drop it on a marketing page). It's the live,
  editable, re-renderable answer to a screen-recording video.
composes_with: [AppShell, ThreeScene, Card, Grid, the whole component set (it wraps a screen)]
aliases: [screen animator, camera, camera tour, director, demo, product demo, zoom pan, spotlight, ken burns, presenter]
---

```jsx
// Wrap a live screen; the camera tours the shots and loops.
<ScreenAnimator
  shots={[
    { zoom: 1, cx: 0.5, cy: 0.5, hold: 2400, label: "Overview" },
    { zoom: 2.4, cx: 0.2, cy: 0.34, hold: 2600, label: "Revenue up 24%" },
    { zoom: 1.8, cx: 0.5, cy: 0.6, hold: 2800, label: "Pipeline" },
  ]}
  backdrop={<ThreeScene preset="aurora" />}
>
  <Dashboard />
</ScreenAnimator>
```

### Anti-patterns

DO NOT use it as a layout wrapper — it positions `absolute inset-0` and takes
over the frame. It's for a whole screen/section you want to direct, not a div.

DO NOT hand-tune `trans`/`hold` per shot unless you need to — the defaults
(soft settle on overview, snappier push on detail) read well. `cx`/`cy` are the
knobs that matter; they're fractions of the screen (0 = left/top, 0.5 = centre).

DO NOT worry about reduced motion — it settles on the starter frame and stops
moving automatically under `prefers-reduced-motion`.

---

---
name: ScrollArea
import: "@gradeui/ui"
subcomponents: [ScrollBar]
props:
  - ScrollArea: type? "auto" | "always" | "scroll" | "hover" — when the scrollbar shows
  - ScrollArea: scrollHideDelay?: number — ms before "scroll"/"hover" scrollbars fade
  - ScrollArea: dir? "ltr" | "rtl"
  - ScrollArea: className?: string — set a height/max-height here, otherwise nothing scrolls
  - ScrollBar: orientation? "vertical" | "horizontal" (default vertical)
when_to_use: Bounded content that needs custom scroll chrome — sidebars with long item lists, chat transcripts, table panels inside a dashboard, anywhere the OS scrollbar would feel out of place against the design tokens. The wrapping element has to have a height constraint (`h-`, `max-h-`, or grid row sizing) or nothing scrolls — scroll-area can't infer a bound on its own. For body-level scrolling, leave the document to the browser.
composes_with: [Card (long card body), AppShellNav (long sidebar), Sheet (long modal body), Table (sticky-header scrolling list)]
aliases: [scroll area, scroll container, custom scrollbar, sidebar scroll, panel scroll, scroll view, scrollview, react native scrollview]
---

```jsx
// Sidebar with a long item list — fixed height so scroll engages.
<ScrollArea className="h-96 w-56 rounded-md border">
  <Stack gap="xs" className="p-3">
    {items.map((item) => (
      <button key={item.id} className="text-left px-2 py-1 rounded hover:bg-muted">
        {item.name}
      </button>
    ))}
  </Stack>
</ScrollArea>
```

---

---
name: SectionBlock
import: "@gradeui/ui"
props:
  - padding? (none | sm | md | lg | xl) — vertical rhythm. Defaults to `lg`.
  - background? (transparent | muted | card | primary | gradient) — tonal direction of the section bg.
  - surface? (solid | translucent | glass | glass-strong) — what the section is *made of*. Orthogonal to `background`. Use `glass` for hero sections that float over a generative backdrop / image / dot grid.
  - container? (default | wide | narrow | full) — max-width of the inner content.
  - alignment? (left | center | right) — header / CTA alignment.
  - titleSize? (sm | md | lg | xl)
  - title?: string
  - subtitle?: string
  - cta1? / cta2? — string or `{ text, variant, href, onClick }` config
  - backgroundImage?: string — direct CSS background image url
  - as? "section" | "div" | "article" — semantic root
  - fullBleed?: boolean
when_to_use: The top-level container for a marketing page section — hero, feature row, pricing table, testimonial strip, FAQ section. Always reach for SectionBlock over a hand-rolled `<section>` so vertical rhythm, container width, and tonal background stay consistent across the page. Pair `background="gradient"` + `surface="glass"` inner Cards for the "modern marketing hero" pattern.
composes_with: [Card (the most common child — especially with surface="glass"), Grid (feature rows), Stack (hero column), MediaSurface (hero imagery), Code (developer hero), Carousel (logo strips)]
aliases: [section, section block, hero section, marketing section, page section, content section, container section, feature section, hero, page hero, marketing hero, glass section, gradient section, mesh hero]
---

SectionBlock is the **container axis** of a marketing page; Card is the **content axis** inside it. Three Presence axes still apply to SectionBlock: `background` (tonal direction), `surface` (material), `padding` (depth of vertical rhythm).

---

### Scenario 1 — Standard feature row (default)

You're laying out a feature section on a marketing page — a row of cards explaining capabilities. Calm tonal background, generous padding, default container width.

```jsx
<SectionBlock
  padding="lg"
  background="muted"
  title="Built for production"
  subtitle="The hard primitives every team eventually needs."
  alignment="center"
>
  <Grid cols="3" gap="md">
    <Card>
      <CardHeader>
        <Database className="h-5 w-5" />
        <CardTitle>Data tables</CardTitle>
        <CardDescription>Sorting, filtering, virtualisation.</CardDescription>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader>
        <Map className="h-5 w-5" />
        <CardTitle>Maps</CardTitle>
        <CardDescription>MapLibre default. Mapbox + Google adapters.</CardDescription>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader>
        <MoveVertical className="h-5 w-5" />
        <CardTitle>Drag and drop</CardTitle>
        <CardDescription>dnd-kit underneath, themed against tokens.</CardDescription>
      </CardHeader>
    </Card>
  </Grid>
</SectionBlock>
```

No `surface` prop. The default `solid` is the right answer for in-flow feature rows — the muted background sets the section apart from neighbouring sections cleanly.

---

### Scenario 2 — Gradient hero with glass cards (modern marketing pattern)

The canonical "shadcn-killer marketing hero" pattern. SectionBlock supplies the gradient mesh; Card children opt into glass; the two compose without either having to know about the other.

```jsx
<SectionBlock
  padding="xl"
  background="gradient"
  alignment="center"
  title="Open the markup. Tell me which one you would merge."
  subtitle="GradeUI produces code you would actually integrate."
  cta1={{ text: "Open Studio", href: "/studio" }}
  cta2={{ text: "Install the library", variant: "outline" }}
>
  <Grid cols="2" gap="md" className="mt-8">
    <Card surface="glass" className="shadow-elevation-4">
      <CardHeader>
        <CardTitle>v0 — sidebar component</CardTitle>
        <CardDescription>~300 lines</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Code source={v0Code} language="tsx" bare className="p-4 text-xs max-h-72" />
      </CardContent>
    </Card>

    <Card surface="glass" className="shadow-elevation-4 gds-aura-ring">
      <CardHeader>
        <CardTitle>GradeUI — sidebar component</CardTitle>
        <CardDescription>6 lines</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Code source={gradeCode} language="tsx" bare className="p-4 text-xs max-h-72" />
      </CardContent>
    </Card>
  </Grid>
</SectionBlock>
```

This is the pattern the home-diff-hero scaffold uses. `background="gradient"` paints the mesh; the Cards float through it via `surface="glass"`; `gds-aura-ring` on the second card draws the eye to the recommended path. No Tailwind soup anywhere.

---

### Scenario 3 — Glass section over a backgroundImage (image hero)

You're using a hero image as the section background. A solid section panel over it would defeat the image. A glass section keeps the image visible while focusing the eye on the content overlay.

```jsx
<SectionBlock
  padding="xl"
  surface="glass"
  backgroundImage="/hero/teams-shipping.jpg"
  alignment="center"
  title="For teams shipping software"
  subtitle="The primitive layer modern product teams actually use."
  cta1={{ text: "Open Studio" }}
  container="narrow"
>
  <Row justify="center" gap="lg" className="text-sm text-muted-foreground">
    <span>Linear</span><span>Vercel</span><span>Stripe</span><span>Anthropic</span>
  </Row>
</SectionBlock>
```

`background` stays at the default `transparent` so the image shows through; `surface="glass"` paints the frosted overlay on top with edge highlight + theme-tuned blur. The narrow container caps content width so the hero stays readable over the image.

---

### Anti-patterns

**DO NOT roll glass by hand at the section level.**

```jsx
{/* ❌ */}
<section className="py-20 bg-card/40 backdrop-blur-md">

{/* ✅ */}
<SectionBlock surface="glass" padding="xl">
```

**DO NOT use `background="primary"` + `surface="glass"`.** The primary fill is intentionally opaque (it's a brand statement). Layering glass on top makes the brand colour read as washed-out. Pick one signal.

**DO NOT skip SectionBlock for marketing rows.** Hand-rolling `<section className="py-20">` means every section gets a slightly different vertical rhythm and container width — the page reads as drift. SectionBlock is the rhythm primitive.

**DO NOT use `padding="xl"` for in-app sections.** xl padding is marketing-page territory. In-app section breaks should use `sm` or `md` — anything more and your dashboard reads as a marketing page.

**DO NOT use `surface="glass-strong"` on SectionBlock unless the section is acting as a full-page overlay.** It's tuned for very heavy de-emphasis of what's underneath; on a regular section it just looks washed-out.

---

---
name: Section
import: "@gradeui/ui"
subcomponents: [Container, SectionEyebrow, SectionTitle, SectionSubtitle, SectionDescription, SectionActions, SectionMedia]
props:
  - Section: scope? (default | inverse | brand | accent | muted | card) — colour SUBTHEME; applies the `scope-*` class so the whole band re-tones (bg/fg/card/muted/border) while action colours stay vivid. Unset = the page surface. See STUDIO-COLOR.md.
  - Section: background?: ReactNode — visual band background slot: image / video / gradient / shader (drop a <BackgroundFill> here). Renders BEHIND the content; Section owns the relative/overflow/z plumbing. Works with `scope` (which re-tones the content tokens so text stays legible over the media).
  - Section: pad? (none | sm | md | lg | xl) — vertical rhythm (responsive py); default lg. Section is ALWAYS full width — it never sets a max width.
  - Section: as? (section | header | footer | div) — semantic element; default section.
  - Container: maxW? (sm | md | lg | xl | prose | full) — centred max width + gutters; default lg. The MEASURE.
  - Container: grid?: boolean — snap children to a 12-column grid (use `col-span-*` on children); default false.
  - Container: as? (div | section) — semantic element; default div.
when_to_use: THE page scaffold. A page is an ordered stack of Sections — every distinct band (hero, logos, features, pricing, testimonial, CTA, footer) gets its OWN Section so each is independently themeable. `Section` is the full-width band (scope + vertical rhythm). **REQUIRED scaffold: a `Section` ALWAYS contains a `Container`.** Put content inside the `Container`, never directly in the `Section`. For an edge-to-edge band use `<Container maxW="full">` — that is how you go full-bleed; you never omit the Container. NEVER hand-roll `<section className="py-20">` or a `<div className="max-w-7xl mx-auto px-6">` wrapper — that is exactly what `Section` + `Container` replace. This holds for app content regions too, not just marketing pages (AppShell is only the outer chrome; the regions inside it are still `Section` → `Container`). The content inside the Container is free — use the parts (SectionEyebrow/Title/Subtitle/Description/Actions/Media) for the common heading+copy+CTA+media shape, or drop any JSX. SectionMedia is a slot for any media (MediaSurface image, Carousel, VideoPlayer, embed, or a whole app UI).
composes_with: [Container, MediaSurface, Carousel, VideoPlayer, Button, Badge, Card, Grid, Stack]
aliases: [section, band, hero section, page section, content section, marketing section, landing section, full bleed, container, max width wrapper, page band, section block]
---

```jsx
// A page is a stack of Sections. Each band picks a scope; a Container
// holds the measure (omit it to let the band bleed full-width).
<Section scope="inverse" pad="xl">
  <Container maxW="lg">
    <SectionEyebrow>New</SectionEyebrow>
    <SectionTitle>Use the agent you prefer.</SectionTitle>
    <SectionSubtitle>Own the components. Ship on your subscription.</SectionSubtitle>
    <SectionActions>
      <Button size="lg">Open Studio</Button>
      <Button size="lg" variant="outline">Docs</Button>
    </SectionActions>
  </Container>
</Section>
```

```jsx
// Full-bleed media band — STILL a Container, just maxW="full" so the media
// spans edge to edge. Section always wraps a Container; never omit it.
<Section scope="card" pad="lg">
  <Container maxW="full">
    <SectionMedia>
      <MediaSurface hint="Studio canvas" alt="A generated screen" className="aspect-[21/9] w-full" />
    </SectionMedia>
  </Container>
</Section>
```

```jsx
// Contained content on a grid — children snap to the 12-col Container grid.
<Section pad="lg">
  <Container grid>
    <div className="col-span-12 md:col-span-7">{/* lead */}</div>
    <div className="col-span-12 md:col-span-5">{/* aside */}</div>
  </Container>
</Section>
```

---

---
name: Select
import: "@gradeui/ui"
subelements:
  - SelectTrigger: button
  - SelectValue: span
  - SelectContent: div
  - SelectItem: div
  - SelectGroup: div
  - SelectLabel: div
  - SelectSeparator: div
subcomponents: [SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator]
props:
  - Select: value?, onValueChange?, defaultValue?, disabled?, name?, required?, autoComplete?, onOpenChange? — Radix root (renders no element itself, so no native-attr passthrough; name/required/autoComplete post via a hidden native select)
  - SelectTrigger: size?: "default" | "sm" | "xs" — control density; wraps the clickable control, nest SelectValue inside
  - SelectValue: placeholder?: string — text when nothing is selected
  - SelectContent: size?: "default" | "sm" | "xs" — menu density; cascades to every SelectItem inside via context so a compact trigger gets a compact menu. Accepts items via children.
  - SelectItem: value: string — required; content is the label. Inherits density from SelectContent.
  - SelectItem: disabled?: boolean — item shown but not pickable
when_to_use: Single-choice from 3+ known options. Fewer than 3 → RadioGroup. Huge list with search → use a Combobox (not in DS yet). Multi-select → not supported by this primitive. In dense tool panels, set size="xs" on BOTH the trigger and the content so the closed control and open menu match.
composes_with: [Label (above SelectTrigger), Form, Card]
aliases: [dropdown, combobox, picker, select, pop-up button, popup button, popup picker, picker view, rnpickerselect, react native picker, native picker]
---

```jsx
<Select defaultValue="apple">
  <SelectTrigger><SelectValue placeholder="Pick a fruit" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
  </SelectContent>
</Select>
```

Compact, for dense panels — match the trigger and menu density:

```jsx
<Select defaultValue="md">
  <SelectTrigger size="xs"><SelectValue /></SelectTrigger>
  <SelectContent size="xs">
    <SelectItem value="sm">Small</SelectItem>
    <SelectItem value="md">Medium</SelectItem>
  </SelectContent>
</Select>
```

---

---
name: SelectionCard
import: "@gradeui/ui"
subcomponents: [RadioCard, CheckboxCard, SwitchCard]
props:
  - label?: ReactNode — title line. Omit and pass `children` for fully custom content.
  - description?: ReactNode — secondary line under the label.
  - aside?: ReactNode — slot between content and indicator (a Badge, price, kbd hint).
  - hideIndicator?: boolean — hide the dot/check/switch glyph; selection is then shown by the card's selected border + background. Semantics stay intact.
  - indicatorPosition? (leading | trailing) — which side the glyph sits on; default trailing.
  - RadioCard: value (string) — required; sits inside a `RadioGroup`. Renders as a RadioGroupPrimitive.Item.
  - CheckboxCard: checked? / defaultChecked? / onCheckedChange? — renders as a CheckboxPrimitive.Root.
  - SwitchCard: checked? / defaultChecked? / onCheckedChange? — renders as a SwitchPrimitives.Root.
when_to_use: A selectable option where the WHOLE card is the control — plan pickers, shipping/payment options, onboarding choices, settings toggles. Use RadioCard for single-select (inside a RadioGroup), CheckboxCard for multi-select, SwitchCard for an on/off option. The glyph differs by type on purpose so single-select vs multi-select vs toggle reads at a glance. All three share one `.gds-selection-card` surface so they look identical sitting together, and every visual is token-driven (`--gds-selection-card-*` with semantic fallbacks) so a project can re-skin them through the per-project override layer without forking.
composes_with: [RadioGroup, Badge, Label, Grid, Stack]
aliases: [selection card, radio card, checkbox card, switch card, option card, choice card, plan picker, pricing option, selectable card, tile select]
---

The card itself carries `role=radio` / `checkbox` / `switch`, focus, hover, and the
checked state — the entire surface is the hit target. The glyph is only a visual
indicator.

```jsx
// Single-select: RadioCards inside a RadioGroup.
<RadioGroup defaultValue="standard" className="grid gap-3">
  <RadioCard value="standard" label="Standard" description="4–10 business days" />
  <RadioCard value="fast"     label="Fast"     description="2–5 business days" aside={<Badge>Popular</Badge>} />
  <RadioCard value="next-day" label="Next day" description="1 business day" />
</RadioGroup>
```

```jsx
// Multi-select + toggle.
<div className="grid gap-3">
  <CheckboxCard defaultChecked label="Email receipts" description="Sent after each order" />
  <SwitchCard label="Dark mode" description="Match the system theme" />
</div>
```

**Anti-pattern — never nest interactive content.** Because the card is itself a
control, do NOT put a Slider, Input, Button, or link inside it. Static content only
(text, images, badges). If a card needs its own controls, use a plain `Card` with a
`Field` row + the control as siblings instead.

---

---
name: Separator
import: "@gradeui/ui"
element: div
props:
  - orientation? ("horizontal" | "vertical") — default "horizontal"
  - decorative?: boolean (default true) — hide from a11y tree
  - className?: string
when_to_use: Light divider between sibling blocks in a Card, list, or header. For section-level partition use extra spacing instead.
composes_with: [Card (between CardHeader/Content/Footer), navigation menus, any vertical stacks]
aliases: [divider, rule, hr, line, horizontal rule]
---

```jsx
<Separator />
<Separator orientation="vertical" className="h-6" />
```

---

---
name: ShaderControls
import: "@gradeui/ui"
props:
  - controls (ControlSpec[]) — the schema to render. Each spec describes one control (slider / toggle / select / switch / input) and its range, step, label, and display.
  - value (DemoState) — controlled state object keyed by control name; the parent owns it.
  - onChange ((key, value) => void) — fired on every control change.
  - labelPosition? (inline | above) — dense inline (label left, control + value right) or stacked label-above; default inline.
  - numberFormat? (raw | percent) — "percent" normalises eligible sliders (no unit, fractional step, non-negative) to 0–100%; a control's own `display: "percent"` always wins. Default raw.
when_to_use: Render a `ControlSpec[]` schema into a DS-native control panel — the single renderer behind shader params, the post-processing stack, and any effect layer (they all describe themselves as ControlSpec[]). Reach for it whenever you have a list of named, typed parameters to expose as a tweaker panel and want it to read identically to the Studio inspector. DS-consistent by construction: it composes the primitives at tool-panel density (Label size="xs", Slider size="sm", ghost Input, ToggleGroup, Select, Switch) — never bespoke markup.
composes_with: [Label, Slider, Input, ToggleGroup, Select, Switch, Card]
aliases: [shader controls, control panel, params panel, tweaker, parameter panel, controlspec renderer, effect controls, schema controls]
---

```jsx
const [state, setState] = React.useState({ speed: 0.4, grain: 0.2, invert: false });

<ShaderControls
  controls={[
    { key: "speed", type: "slider", label: "Speed", min: 0, max: 1, step: 0.01, display: "percent" },
    { key: "grain", type: "slider", label: "Grain", min: 0, max: 1, step: 0.01 },
    { key: "invert", type: "switch", label: "Invert" },
  ]}
  value={state}
  onChange={(key, v) => setState((s) => ({ ...s, [key]: v }))}
  numberFormat="percent"
/>
```

One renderer drives every params surface (shader, post stack, effect layer), so a
control added to the schema appears identically in the Studio inspector and any
consumer panel. Keep state in the parent; `ShaderControls` is fully controlled.

---

---
name: ShaderPresetPicker
import: "@gradeui/ui"
props:
  - value?: string — currently selected preset id (controlled)
  - onChange?: (id: string) => void — called when the user clicks a preset card
  - filterTags?: string[] — only show presets matching at least one tag ("space" | "retro" | "motion" | "hero" | "background" …)
  - live?: "never" | "hover" | "always" (default "hover") — thumbnail render mode
  - postPreset?: string — shared post-FX preset applied to every thumbnail
  - palette?: Partial<Palette> — shared palette applied to every thumbnail
  - columns?: 2 | 3 | 4 (default 3) — grid columns at md+ breakpoint
when_to_use: Runtime gallery of shader presets — click to select. Use with ThreeScene as a controlled input so the user can pick a background shader. For a single preview card, use ShaderPresetPreview directly.
composes_with: [ShaderPresetPreview (internal), ThreeScene (the typical downstream consumer)]
aliases: [shader picker, preset picker, shader gallery, preset gallery]
notes: Powered by the same preset registry that drives `<ThreeScene preset="…" />` — adding a preset to the registry makes it appear here automatically. At time of writing only "space" is registered, so the picker renders a single card until more presets ship.
---

```jsx
const [preset, setPreset] = useState("space");

<ShaderPresetPicker value={preset} onChange={setPreset} />
<ThreeScene preset={preset} postPreset="vhs" aspect="wide" />

// Filter to a subset
<ShaderPresetPicker filterTags={["hero"]} columns={3} />
```

---

---
name: ShaderPresetPreview
import: "@gradeui/ui"
props:
  - preset: string — shader preset id from the registry
  - live?: "never" | "hover" | "always" (default "hover") — when to run the live WebGL render
  - postPreset?: string — override the preset's default post-FX
  - palette?: Partial<Palette> — palette overrides for the preview
  - aspect?: "video" | "square" | "portrait" | "wide" (default "video")
  - hideLabel?: boolean (default false) — hide the label strip under the preview
  - onClick?: () => void
when_to_use: Thumbnail-sized preview card for a shader preset. Defaults to a cheap static placeholder until hovered, at which point the live WebGL render kicks in. Use directly when you want a single preset card; use ShaderPresetPicker for a filterable grid.
composes_with: [ThreeScene (internal), ShaderPresetPicker (wraps this)]
aliases: [shader preview, preset preview, shader card]
notes: Prefer `live="hover"` in galleries — Safari caps concurrent WebGL contexts at ~8. `live="always"` is fine for one or two cards; past that you'll run out of contexts. VALID `preset` ids come from the shader registry — at time of writing the only shipped preset is "space". Unknown ids render a placeholder card with the raw id as a label (no error). Do NOT pass invented ids like "neon-grid" — it will render as the literal string "neon-grid".
---

```jsx
// Hover-to-live (default)
<ShaderPresetPreview preset="space" />

// Always-live — use sparingly
<ShaderPresetPreview preset="space" live="always" />
```

---

---
name: Sheet
import: "@gradeui/ui"
subcomponents: [SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose]
props:
  - Sheet: open?, defaultOpen?, onOpenChange?, modal? (default true)
  - SheetTrigger: asChild?: boolean
  - SheetContent: side? "top" | "right" | "bottom" | "left" (default "right")
  - SheetContent: surface? (solid | translucent | glass | glass-strong) — what the sheet panel is *made of*. `solid` is the default opaque `bg-background`. Reach for `glass` whenever the canvas behind the sheet (a layout in progress, a media gallery, a dashboard) should remain visible.
  - SheetContent: className?: string — usually set a width (right/left) or height (top/bottom)
  - SheetTitle / SheetDescription: identify the sheet to screen readers; required for accessibility even if visually styled differently
  - SheetClose: asChild? — usually wraps a Button labelled Cancel or Done
when_to_use: A panel that slides in from a screen edge — mobile nav drawers, side panels for editing a single record without leaving the list, filter trays on small viewports, Studio-style inspector panels. For a centered focus modal use Dialog. For a transient announcement use Toast (Sonner). For inline reveals use Collapsible.
composes_with: [Form controls (an inline edit sheet), Button (trigger + close), AppShellNav (mobile-only swap), Code (changelog drawers), MediaSurface (image-detail sheets)]
aliases: [sheet, drawer, side panel, slide-in, nav drawer, mobile drawer, slide-over, action sheet, modal sheet, bottom sheet, side sheet, react native modal sheet, bottom-sheet, ios action sheet, inspector panel, glass sheet, frosted drawer]
---

SheetContent sits at elevation-5. The `surface` axis controls material independently of `side` (which controls layout direction) — every combination is valid.

---

### Scenario 1 — Edit-record drawer (default opaque)

A right-edge drawer that lets a user edit one record without losing their place in a list. The list is the user's context — the drawer doesn't need to blur it; it just needs to be visibly distinct.

```jsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Edit user</Button>
  </SheetTrigger>
  <SheetContent className="w-full sm:max-w-md">
    <SheetHeader>
      <SheetTitle>Edit user</SheetTitle>
      <SheetDescription>Update Elena's profile and role.</SheetDescription>
    </SheetHeader>
    <Stack gap="md" className="py-4">
      <Stack gap="xs">
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="Elena Okafor" />
      </Stack>
      <Stack gap="xs">
        <Label htmlFor="role">Role</Label>
        <Select>{/* … */}</Select>
      </Stack>
    </Stack>
    <SheetFooter>
      <SheetClose asChild>
        <Button variant="ghost">Cancel</Button>
      </SheetClose>
      <Button>Save changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

`solid` is the right default for editing workflows. Form fields need maximum legibility; blur behind them works against that.

---

### Scenario 2 — Glass inspector panel (creative tool aesthetic)

You're building a creative tool. The canvas is the work — a Studio layout, an image being annotated, a presentation slide. The inspector panel needs to live alongside the work without obscuring it. Glass is the canonical "I am chrome, not content" signal.

```jsx
<Sheet open={hasSelection} modal={false}>
  <SheetContent
    side="right"
    surface="glass"
    className="w-96 shadow-elevation-5"
  >
    <SheetHeader>
      <SheetTitle>Selection</SheetTitle>
      <SheetDescription>Button — Toolbar &gt; trailing</SheetDescription>
    </SheetHeader>

    <Stack gap="md" className="py-4">
      <Stack gap="xs">
        <Label>Variant</Label>
        <Select defaultValue="raised">{/* … */}</Select>
      </Stack>
      <Stack gap="xs">
        <Label>Size</Label>
        <ToggleGroup type="single" defaultValue="md">
          <ToggleGroupItem value="sm">sm</ToggleGroupItem>
          <ToggleGroupItem value="md">md</ToggleGroupItem>
          <ToggleGroupItem value="lg">lg</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
    </Stack>
  </SheetContent>
</Sheet>
```

Three things to notice: `modal={false}` so the user keeps interacting with the canvas while the inspector is open; `surface="glass"` so the canvas reads through; `shadow-elevation-5` to lift the panel cleanly off the canvas. This is the Studio inspector pattern.

---

### Scenario 3 — Bottom action sheet (mobile, glass for iOS feel)

The iOS-native action sheet has glass behind it. Matching that material on mobile flows is "feels like a native app" by default.

```jsx
<Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
  <SheetContent
    side="bottom"
    surface="glass"
    className="rounded-t-2xl"
  >
    <SheetHeader className="text-center">
      <SheetTitle>Share screen</SheetTitle>
    </SheetHeader>
    <Stack gap="xs" className="py-4">
      <Button variant="ghost" className="justify-start"><Mail /> Email</Button>
      <Button variant="ghost" className="justify-start"><MessageCircle /> Message</Button>
      <Button variant="ghost" className="justify-start"><Copy /> Copy link</Button>
    </Stack>
    <SheetClose asChild>
      <Button variant="outline" className="w-full">Cancel</Button>
    </SheetClose>
  </SheetContent>
</Sheet>
```

`side="bottom"` + `surface="glass"` + `rounded-t-2xl` is the iOS action-sheet recipe. The rounded top corners signal "this can be dismissed by dragging down" even before any gesture handler is wired up.

---

### Anti-patterns

**DO NOT roll glass by hand on SheetContent.**

```jsx
{/* ❌ Tailwind soup — no edge highlight, blur isn't theme-tuned. */}
<SheetContent className="bg-background/60 backdrop-blur-md">

{/* ✅ */}
<SheetContent surface="glass">
```

**DO NOT use `surface="glass"` for a modal sheet that contains a long form.** Form legibility wins over aesthetic. If the user is going to spend 30 seconds in this sheet, give them an opaque background.

**DO NOT pair `surface="glass"` with `modal={true}` and the default scrim.** The scrim already dims the canvas — adding glass on top of a dimmed canvas reads as "two competing layers of de-emphasis". Either turn off the scrim (`modal={false}`), or use `surface="solid"`.

**DO NOT skip SheetTitle.** Screen readers announce it on open. If the design has no visible title, wrap a `sr-only` one.

---

---
name: Sidebar
import: "@gradeui/ui"
subcomponents: [SidebarHeader, SidebarContent, SidebarFooter, SidebarSection, SidebarItem]
props:
  - Sidebar: collapsed?: boolean — controlled collapsed state (wire onCollapsedChange when set)
  - Sidebar: defaultCollapsed?: boolean — uncontrolled initial value (default false)
  - Sidebar: onCollapsedChange?: (next: boolean) => void
  - Sidebar: collapsible?: boolean — show the affordance for the user to collapse (default true)
  - Sidebar: variant?: 'rail' | 'panel' — outer chrome treatment. `rail` (default) is the classic nav rail with a single right-border + tracked width via `--gds-sidebar-width`; drops cleanly into `<AppShellNav placement="side">`. `panel` is a card-style floating sidebar with full border + rounded corners + parent-controlled width; use when the sidebar is one of several adjacent panes in a body row (e.g. Projects | Canvas | Settings). The compound children (Header/Content/Footer/Section/Item) are identical in both treatments.
  - SidebarHeader: any children — brand / logo / org switcher; hides nothing when collapsed (centred)
  - SidebarContent: any children — scrollable body
  - SidebarFooter: any children — user block, settings link, pinned chrome
  - SidebarSection: title?: ReactNode — group label, tracking-wide muted styling; hidden when sidebar is collapsed. CASE: static (non-collapsible) headers historically render UPPERCASE (Notion / Linear / Slack-style "GAMES", "FAVORITES"); collapsible headers render the authored case. Control it explicitly with titleTransform.
  - SidebarSection: titleTransform? ("uppercase" | "none") — title casing for BOTH header variants. "none" renders the authored case (sentence-case headers like a "Recents" list); "uppercase" forces the shouty group label. Unset = the per-variant legacy default above.
  - SidebarSection: icon?: ReactNode — optional icon beside the title
  - SidebarSection: trailing?: ReactNode — **action(s) on the right edge of the header** — the canonical "+" / "..." slot (Notion's "+ Add page" next to Pages, Linear's "+" next to Favorites, Slack's "+" next to Channels). Pointer events isolated so a Button here doesn't toggle collapse.
  - SidebarSection: collapsible?: boolean — title acts as expand/collapse trigger with a **chevron indicator** (default true). Set `false` for a static, non-clickable header.
  - SidebarSection: defaultExpanded?: boolean — initial open state (default true)
  - SidebarItem: icon?: ReactNode — leading icon
  - SidebarItem: badge?: ReactNode — trailing count / label (hidden when collapsed)
  - SidebarItem: active?: boolean — current route; adds aria-current="page"
  - SidebarItem: href?: string — renders as <a>; for routing use `asChild` with your link component
  - SidebarItem: asChild?: boolean — wrap a custom link (<Link href> from Next.js etc.) via Radix Slot
  - SidebarItem: asButton?: boolean — render as <button> for action rows (open dialog, log out)
  - SidebarItem: disabled?: boolean
  - SidebarItem: collapsedLabel?: ReactNode — tooltip override when sidebar is collapsed (defaults to children text)
  - SidebarItem: size?: 'sm' | 'md' — row size. `md` (default) is the standard `text-sm font-medium` nav row; `sm` is `text-xs` + lighter weight + tighter padding for visually subordinate rows (nested screens under a project, sub-pages under a section). Active state still wins on color + weight so the current row pops at either size.
  - SidebarItem: description?: ReactNode — secondary line beneath the label (metadata like 'Edited 2m ago', '12 items', a brief description). Row layout adapts: label + description stacked vertically; icon vertically-centered against the stack; badge stays on trailing edge. Hidden when sidebar collapsed.
  - SidebarTreeItem: description?: ReactNode — secondary line beneath the label, same shape as SidebarItem.description. Useful when a branch needs more than just a name (last-edited timestamp, item count, owner).
  - SidebarTreeItem: trailing?: ReactNode — right-edge action slot (settings cog, more-actions overflow, "+ add child"). Rendered as a SIBLING of the branch button (not nested inside it, so `<button>` children in `trailing` stay valid HTML). Vertically centered against the row; click events are stopPropagation'd so a tap on a trailing button doesn't toggle expand/collapse. The branch row wrapper carries a `group/row` named-group, so consumer-provided trailing can opt into hover-only visibility via `hidden group-hover/row:flex` — the hover state is scoped to the branch row alone, not the nested children.
when_to_use: Vertical app navigation. Drop inside `<AppShellNav placement="side">` for full-page layouts. Compound API — `<SidebarHeader>` for brand, `<SidebarContent>` for the scrollable body of `<SidebarSection>` + `<SidebarItem>` rows, `<SidebarFooter>` for user / settings chrome. For top nav reach for TopMenu; for command-palette style search reach for Command.
composes_with: [AppShell (inside AppShellNav), Avatar (in Footer), Tooltip (auto-wrapped on collapsed items), Button (asChild for custom routing)]
aliases: [sidebar, side menu, sidemenu, navigation sidebar, app sidebar, side nav, side nav rail, master pane, sidebarmenu, navigation rail, react native drawer]
---

```jsx
<Sidebar defaultCollapsed={false}>
  <SidebarHeader>
    <div className="flex items-center gap-2 font-semibold">
      <Logo className="h-5 w-5" />
      <span>Acme</span>
    </div>
  </SidebarHeader>

  <SidebarContent>
    <SidebarSection title="Workspace">
      <SidebarItem href="/" icon={<Home />} active>Dashboard</SidebarItem>
      <SidebarItem href="/inbox" icon={<Inbox />} badge={3}>Inbox</SidebarItem>
      <SidebarItem href="/team" icon={<Users />}>Team</SidebarItem>
    </SidebarSection>
    <SidebarSection title="Personal">
      <SidebarItem href="/settings" icon={<Settings />}>Settings</SidebarItem>
    </SidebarSection>
  </SidebarContent>

  <SidebarFooter>
    <Row gap="sm" align="center">
      <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
      <Stack gap="none" className="text-xs">
        <span className="font-medium">Ali</span>
        <span className="text-muted-foreground">Pro plan</span>
      </Stack>
    </Row>
  </SidebarFooter>
</Sidebar>
```

```jsx
// With Next.js routing — wrap any link component via `asChild`.
import Link from "next/link";

<SidebarItem asChild icon={<Home />} active={pathname === "/"}>
  <Link href="/">Dashboard</Link>
</SidebarItem>
```

```jsx
// Action row — `asButton` renders a <button> instead of an <a>.
<SidebarItem asButton icon={<LogOut />} onClick={signOut}>
  Sign out
</SidebarItem>
```

```jsx
// Section header with a trailing action — the Notion / Linear / Slack
// "+" next to a section name. The trailing slot isolates pointer events
// from the collapse toggle, so the Button doesn't also flip expand.
<SidebarSection
  title="Pages"
  trailing={
    <Button variant="ghost" size="icon" className="h-5 w-5">
      <Plus className="h-3 w-3" />
    </Button>
  }
>
  <SidebarItem>Notes</SidebarItem>
  <SidebarItem>Drafts</SidebarItem>
</SidebarSection>
```

```jsx
// Non-collapsible static header — for sections the user shouldn't
// be able to fold. `collapsible={false}` hides the chevron.
<SidebarSection title="Workspace" collapsible={false}>
  <SidebarItem>...</SidebarItem>
</SidebarSection>
```

### Anti-patterns

DO NOT pass a `sections={[...]}` data array — that was the old SideMenu shape (retired May 2026). Compose `<SidebarSection>` and `<SidebarItem>` directly so any non-list-shaped chrome (search input, drag handle, custom brand block) can sit alongside the nav.

DO NOT set `href` AND `onClick` AND `asChild` at once — pick one mode per row. `href` = anchor, `asButton` = button, `asChild` = wrap your own link component. Mixing modes makes the DOM ambiguous.

DO NOT use Sidebar for primary marketing-style top navigation — that's TopMenu. Sidebar is for app chrome (logged-in product surfaces), not landing pages.

DO NOT rely on the collapsed-state tooltip to convey critical-only information. When the sidebar is collapsed, only the icon is visible by default; the label is in the tooltip on hover, but mobile users + screen readers won't reliably see it. Keep icons recognisable and ship the label as actual text on hover/focus, not just as a tooltip.

DO NOT hand-roll an uppercase "SECTION NAME" header above your items. `<SidebarSection title="…">` already gives you the uppercase + tracking-wide + muted styling, plus the chevron + expand/collapse behaviour. If your design has a "+" or "..." next to the section name, use the `trailing` prop — don't render the action as a separate SidebarItem below the section.

DO NOT bypass `<Sidebar>` and compose an icon rail or projects pane from raw `<Stack>` + buttons. You lose the collapsed-state handling, the per-item tooltip, the `data-gds-part` markers that Studio's selection layer reads, and the consistent padding/gap CSS vars (`--gds-sidebar-*`). If you find yourself writing `<button className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted">{icon}{label}</button>`, that's a SidebarItem.

---

---
name: Skeleton
import: "@gradeui/ui"
element: div
props:
  - className?: string — required in practice; supply width/height utilities
  - All native div HTML attrs
when_to_use: Loading placeholder for content whose shape you know. Set width/height via className to mimic the real content (e.g. "h-4 w-32"). Not a spinner — use it where the real thing will drop in.
composes_with: [Card, Avatar (inside a Skeleton for avatar loading), any layout]
aliases: [placeholder, shimmer, loader, loading state, redacted, redacted placeholder, shimmer placeholder, content placeholder, lottie placeholder]
---

```jsx
<div className="space-y-2">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

---

---
name: Slider
import: "@gradeui/ui"
props:
  - value?: number[] — controlled value; ALWAYS an array even for a single-thumb slider (`[50]`)
  - defaultValue?: number[] — uncontrolled initial; `[20, 80]` for a two-thumb range
  - onValueChange?: (value: number[]) => void
  - min?: number (default 0)
  - max?: number (default 100)
  - step?: number (default 1)
  - disabled?: boolean
  - orientation? "horizontal" | "vertical" (default "horizontal")
  - dir? "ltr" | "rtl"
  - inverted?: boolean — flip the visual direction
  - name?: string — form name when posting natively
when_to_use: A continuous-ish numeric pick — volume, opacity, font size, price-range filters. Use a single-thumb slider for one value, two-thumb for a range. For a small set of discrete options (1-5 stars, sm/md/lg) prefer ToggleGroup. For free-text numeric entry use an Input type="number".
composes_with: [Label (mandatory above), Row (label + current value display), Card (settings rows)]
aliases: [slider, range slider, range input, volume, opacity slider, scrub, drag value, slider control, value slider, react native slider]
---

```jsx
// Single-thumb slider with the current value shown alongside.
<Stack gap="xs">
  <Row justify="between" align="center">
    <Label htmlFor="opacity">Opacity</Label>
    <span className="text-sm text-muted-foreground tabular-nums">{value[0]}%</span>
  </Row>
  <Slider
    id="opacity"
    min={0}
    max={100}
    step={1}
    value={value}
    onValueChange={setValue}
  />
</Stack>
```

```jsx
// Two-thumb price-range filter.
<Slider
  min={0}
  max={500}
  step={5}
  defaultValue={[50, 250]}
  onValueChange={setRange}
/>
```

---

---
name: Sortable
import: "@gradeui/ui"
subcomponents: [Sortable.Item, Sortable.Handle]
props:
  - Sortable: values: (string | number)[] — ordered list of unique ids; the source of truth for the order
  - Sortable: onReorder?: (next: (string | number)[]) => void — fires with the new order after a drag that changed it
  - Sortable: strategy?: "vertical" | "horizontal" | "grid" (default "vertical") — match the layout your items render in
  - Sortable: disabled?: boolean — disable drag on every item
  - Sortable.Item: value: string | number — must match one entry in the parent `values` array (identity, not React key)
  - Sortable.Item: asChild?: boolean — render as the child element via Radix Slot
  - Sortable.Item: disabled?: boolean — disable drag for this item only
  - Sortable.Handle: asChild?: boolean — wrap a Button / icon as the drag grip
when_to_use: Drag-to-reorder lists, kanban-column reordering, sortable shelves, tab strips the user can rearrange. Pairs with any layout primitive — Stack for vertical lists, Row for horizontal strips, Grid for 2D card walls. For cross-container drag (drag a card from one column to another) hand-roll DndContext at the page level — Sortable v1 covers single-list reorder; Sortable.Group for cross-container is a planned follow-up. Reach for raw `@dnd-kit/core` if you need custom collision detection, drag overlays with arbitrary chrome, or non-list use cases (kanban swimlanes, draggable canvas nodes).
composes_with: [Stack (vertical lists), Row (horizontal strips), Grid (2D card walls), Card (typical item content), Button (as Sortable.Handle asChild)]
aliases: [sortable, reorder, drag and drop, dnd, draggable list, sortable list, kanban, drag to reorder, drag-drop, dragdroplist, drag handle, react native draggable flatlist]
---

```jsx
const [items, setItems] = React.useState([
  { id: "a", title: "First" },
  { id: "b", title: "Second" },
  { id: "c", title: "Third" },
]);

<Sortable values={items.map(i => i.id)} onReorder={(ids) => {
  setItems(ids.map(id => items.find(i => i.id === id)!));
}}>
  <Stack gap="sm">
    {items.map((item) => (
      <Sortable.Item key={item.id} value={item.id}>
        <Card>
          <CardContent className="p-3">{item.title}</CardContent>
        </Card>
      </Sortable.Item>
    ))}
  </Stack>
</Sortable>
```

```jsx
// With a drag handle — only the grip activates drag; the rest of the
// row stays clickable for child Buttons / links.
<Sortable values={ids} onReorder={setIds} strategy="vertical">
  <Stack gap="sm">
    {items.map((item) => (
      <Sortable.Item key={item.id} value={item.id}>
        <Card>
          <Row gap="sm" align="center" className="p-3">
            <Sortable.Handle asChild>
              <Button variant="ghost" size="icon">
                <GripVertical className="h-4 w-4" />
              </Button>
            </Sortable.Handle>
            <span className="flex-1">{item.title}</span>
            <Button size="sm">Edit</Button>
          </Row>
        </Card>
      </Sortable.Item>
    ))}
  </Stack>
</Sortable>
```

```jsx
// Horizontal tab strip — strategy="horizontal" + Row instead of Stack.
<Sortable values={tabIds} onReorder={setTabIds} strategy="horizontal">
  <Row gap="xs">
    {tabs.map((tab) => (
      <Sortable.Item key={tab.id} value={tab.id}>
        <Badge>{tab.label}</Badge>
      </Sortable.Item>
    ))}
  </Row>
</Sortable>
```

```jsx
// 2D card grid — strategy="grid".
<Sortable values={photoIds} onReorder={setPhotoIds} strategy="grid">
  <Grid cols="3" gap="md">
    {photos.map((p) => (
      <Sortable.Item key={p.id} value={p.id}>
        <MediaSurface aspect="square" alt={p.alt} />
      </Sortable.Item>
    ))}
  </Grid>
</Sortable>
```

### Anti-patterns

DO NOT add a `sortable` prop to Stack / Row / Grid — those primitives stay pure. Wrap them in `<Sortable>` to mark a collection sortable. Mixing layout and reorder concerns into one component balloons each primitive's contract for a feature 95% of stacks don't use, and loses you cross-layout consistency (one Sortable wrapping a Grid works exactly like one wrapping a Stack).

DO NOT use `key` as the sortable identity. `<Sortable.Item value={item.id}>` is the source of truth — `key={item.id}` is also fine for React's reconciler but `value` is what dnd-kit reads. They usually match; if they don't, drag-end will operate on the wrong row.

DO NOT try to mutate children directly to reorder. Sortable's data model is `state → children`. Reorder fires `onReorder(newValues)`; you update state; React re-renders children in the new order. Trying to read children's keys + reorder them imperatively fights React.

DO NOT wrap clickable items (Card with onClick, Button-bearing rows) without thinking about drag-vs-click conflict. The PointerSensor has a 4px activation distance so single clicks pass through, but if the row's primary affordance is "click to open detail," consider a `<Sortable.Handle>` so the user clicks the body for detail and drags only the grip.

DO NOT use Sortable for cross-container drag in v1. A single `<Sortable>` is one DndContext; the kanban "drag from To Do to Done" case needs one DndContext above multiple SortableContexts. Until `<Sortable.Group>` lands, that pattern needs hand-rolled `@dnd-kit/core` at the page level. Single-list, single-grid, single-strip reorder all work.

---

---
name: Stack
import: "@gradeui/ui"
role: layout
props:
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "md") — vertical gap between children
  - align?: "start" | "center" | "end" | "stretch" (default "stretch") — cross-axis (horizontal) alignment of children
  - justify?: "start" | "center" | "end" | "between" | "around" | "evenly" (default "start") — main-axis (vertical) distribution. Reach for this on absolute-positioned overlays (`justify="end"` pins children to the bottom) and split footers (`justify="between"`).
  - asChild?: boolean (default false) — render as the child element via Slot, so `<Stack asChild><section>…</section></Stack>` stamps Stack's classes onto the `<section>` rather than nesting a wrapper div
  - className?: string
  - children: React.ReactNode
when_to_use: Default top-level layout inside the main slot when composing two or more stacked regions (hero + content + footer, auth card + subtext, etc.). Prefer Stack over hand-rolled `flex flex-col gap-*` so the vertical rhythm is editable through the settings panel.
composes_with: [Section, Row, Split, Hero, any content component]
aliases: [stack, vstack, vertical, column, vertical layout, v-stack, vertical stack, lazyvstack]
---

```jsx
<Stack gap="lg">
  <Hero>…</Hero>
  <Section>…</Section>
  <Section>…</Section>
</Stack>
```

```jsx
// Narrow centred column for auth / marketing copy.
<Stack gap="md" align="center" className="max-w-md mx-auto">
  <CardTitle>Sign in</CardTitle>
  <Input placeholder="Email" />
  <Input placeholder="Password" type="password" />
  <Button className="w-full">Continue</Button>
</Stack>
```

```jsx
// Hero overlay pinned to the bottom — use `justify="end"`, NOT
// `className="flex flex-col justify-end"`. Stack is already a flex
// column, so `flex flex-col` in className is dead weight.
<Stack justify="end" gap="md" className="absolute inset-0 p-10 max-w-2xl">
  <Badge>Featured</Badge>
  <h1 className="text-5xl font-semibold">Severance</h1>
  <Button>Play</Button>
</Stack>
```

### Anti-patterns

DO NOT add `flex flex-col` to Stack's className — Stack already applies `flex flex-col` as its base. Same for Row + `flex flex-row`. These are the literal definitions of the primitives.

DO NOT reach for `className="justify-end"` (or `justify-between`, etc.) when the new `justify` prop covers it. Inline-Tailwind layout escapes are how scaffolds slowly drift away from the design system — keep them in props so the settings panel can mutate them.

---

---
name: Swatch
import: "@gradeui/ui"
subcomponents: [SwatchGroup]
sizes: [2xs, xs, sm, md, lg, xl]
props:
  - color?: string — any raw CSS colour (`#1f6feb`, `oklch(...)`, `rgb(...)`, or `var(--x)`). Takes precedence over `token`. Use for one-off or external colours.
  - token?: string — a Grade colour token NAME with no `--` and no `oklch()` wrap; resolved internally to `oklch(var(--<token>))`. THE design-system path — e.g. `token="brand-3"`, `token="primary"`, `token="chart-2"`. Re-voices live when the theme changes.
  - type? (solid | gradient | image) — fill kind; default solid (or inferred from `image` / `gradient`). Determines what the chip renders in place.
  - gradient?: string — CSS gradient for `type="gradient"`, e.g. `linear-gradient(135deg,#6366f1,#ec4899)`.
  - image?: string — image URL for `type="image"`; rendered cover-fit behind the chip.
  - size? (2xs | xs | sm | md | lg | xl) — t-shirt scale, 16px → 56px; default md (32px). 2xs (16px) suits dense colour lists. Prefer over h-*/w-* utilities.
  - shape? (square | rounded | circle) — default rounded (rides `--radius`); circle for dot pickers; square for a hard tile.
  - selected?: boolean — draws the shared selection ring (`--selected`). For palette / accent pickers.
  - onSelect?: () => void — makes the swatch a pickable <button> (adds aria-pressed, focus ring, hover lift). Omit for a static display chip.
  - onColorChange?: (value: string) => void — makes the swatch an editable colour well: hosts a native `<input type="color">` (the OS picker) behind the DS chip and fires with the new `#rrggbb`. Presentation stays the chip, interaction stays native. Use for inspector / control-panel colour fields instead of styling a raw colour input. Takes precedence over `onSelect`.
  - label?: ReactNode — caption rendered beneath the chip; also becomes the accessible name + tooltip.
  - SwatchGroup: layout? (row | stack) — `row` (default) spaces chips out; `stack` overlaps them into a coin-stack (the theme-picker / "key colours" treatment, where each chip's ring reads as the separating edge).
  - SwatchGroup: size? / shape? — cascade to every child Swatch so a strip stays consistent without repeating the prop.
  - SwatchGroup: gap? (xs | sm | md | lg) — spacing between chips in `row` layout; default sm.
when_to_use: Showing a colour as a small chip — brand-pop strips, palette / accent pickers, theme previews, token galleries, "pick a colour" rows. Reach for `token` to bind to a live theme variable; `color` for raw values. A transparency checkerboard sits behind the fill so semi-transparent values read honestly.
composes_with: [Row (strip of swatches), Stack, Grid (palette wall), Field (as a colour-picker trailing slot), Card (in a theme-preview), RadioGroup (selectable accent set), Label]
aliases: [colour swatch, color swatch, colour chip, color chip, palette swatch, token swatch, brand pop, accent swatch, colour tile, color tile, paint chip, react native colour swatch]
notes: |
  Anti-patterns to avoid:

  - DO NOT hand-roll a colour chip as a bare `<div className="h-10 w-10 rounded">`
    with an inline `style={{ background: ... }}`. That is exactly what
    <Swatch> is — use it so the chip is selectable in Studio, sizes on
    tokens, and gets the transparency checkerboard + selection ring for free.
  - DO NOT wrap a token in oklch() yourself for the `token` prop —
    pass the bare name. `token="brand-3"`, NOT `token="oklch(var(--brand-3))"`.
    (If you already have a wrapped string, pass it as `color` instead.)
  - DO NOT size with h-*/w-* utilities — use `size` so the scale stays on
    the t-shirt tokens.
  - DO NOT use Swatch for an avatar, status dot, or icon background. It is
    specifically a COLOUR specimen. A status dot is a tiny Badge/indicator;
    a person is an Avatar.
---

```jsx
// Brand-pop strip — eight live theme accents.
<SwatchGroup size="lg">
  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
    <Swatch key={n} token={`brand-${n}`} />
  ))}
</SwatchGroup>
```

```jsx
// Theme-picker "key colours" — overlapping coin-stack of circles.
<SwatchGroup layout="stack" shape="circle" size="md">
  <Swatch token="background" />
  <Swatch token="muted" />
  <Swatch token="primary" />
  <Swatch token="accent" />
</SwatchGroup>
```

```jsx
// Captioned token chips.
<Row gap="md" wrap>
  <Swatch token="primary" label="Primary" />
  <Swatch token="accent" label="Accent" />
  <Swatch token="muted" label="Muted" />
</Row>
```

```jsx
// Pickable accent set — selection ring + button semantics.
<Row gap="sm">
  {["brand-1", "brand-2", "brand-3", "brand-4"].map((t) => (
    <Swatch
      key={t}
      token={t}
      shape="circle"
      selected={t === selectedToken}
      onSelect={() => setSelectedToken(t)}
    />
  ))}
</Row>
```

```jsx
// Raw colour, including a semi-transparent value over the checkerboard.
<Row gap="sm">
  <Swatch color="#1f6feb" />
  <Swatch color="oklch(0.7 0.18 30)" />
  <Swatch color="rgb(16 185 129 / 0.4)" />
</Row>
```

---

---
name: SwitchCard
import: "@gradeui/ui"
props:
  - checked? / defaultChecked? / onCheckedChange? — standard switch state
  - label?: ReactNode — title line
  - description?: ReactNode — secondary line
  - aside?: ReactNode — slot before the indicator (a Badge, price, hint)
  - hideIndicator?: boolean — hide the switch glyph; state shown by the card border + background
  - indicatorPosition?: "leading" | "trailing" — default trailing
  - children?: ReactNode — arbitrary static content instead of label/description
when_to_use: A prominent on/off setting presented as a whole selectable card. The whole card is the switch, so the toggled state lives on the card surface. Standalone. For a row of compact settings (label left, small Switch right) use Field layout="setting" instead — SwitchCard is for the heavier, card-sized toggle.
composes_with: [Badge (in aside), Stack (stacking several)]
aliases: [switch card, toggle card, setting card, feature toggle card]
---

```jsx
<SwitchCard label="Auto-renew" description="Renew this plan automatically each month" defaultChecked />
```

Indicator on the leading edge:

```jsx
<SwitchCard
  indicatorPosition="leading"
  label="Auto-renew"
  description="Renew this plan automatically each month"
  defaultChecked
/>
```

---

---
name: Switch
import: "@gradeui/ui"
element: button
props:
  - checked?: boolean
  - onCheckedChange?: (checked: boolean) => void
  - defaultChecked?: boolean
  - disabled?: boolean
  - id?: string
  - name?: string — form field name, posted via the hidden input
  - value?: string — form value when on (default "on")
  - required?: boolean — marks the hidden form input required
when_to_use: Instant on/off setting ("Enable notifications", "Dark mode"). Commits on toggle — no submit button needed. For selecting-from-a-list use Checkbox. For a settings row (label + description on the left, Switch on the right) use Field layout="setting". For a prominent on/off presented as a whole selectable card, use SwitchCard.
composes_with: [Label (via htmlFor), Field (layout="setting" settings row), SwitchCard (whole-card toggle), Card (settings rows)]
aliases: [toggle, switch, on/off switch, ios toggle, toggle switch, switch control, react native switch]
---

```jsx
<div className="flex items-center justify-between">
  <Label htmlFor="notifications">Email notifications</Label>
  <Switch id="notifications" />
</div>
```

---

---
name: Table
import: "@gradeui/ui"
element: table
subcomponents: [TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption]
props:
  - TableCell: colSpan?: number — span multiple columns
  - TableCell: rowSpan?: number — span multiple rows
  - TableHead: scope?: string — a11y column/row header scope ("col" | "row")
  - Each subcomponent accepts native table HTML attrs
  - No variants — styling follows the active theme tokens
when_to_use: Structured tabular data — rows × columns with alignment requirements. NOT a layout grid — for that use div+Tailwind grid utilities. Keep to <100 rows; larger datasets need virtualisation (not in DS).
composes_with: [Card (wrap the table), Badge (inside TableCell for status), Checkbox (row selection), Button (row actions)]
aliases: [table, table view, data table, datatable, grid view, data grid, rows and columns]
---

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Invoice #001</TableCell>
      <TableCell className="text-right">$250</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

---
name: Tabs
import: "@gradeui/ui"
element: div
subelements:
  - TabsTrigger: button
subcomponents: [TabsList, TabsTrigger, TabsContent]
sizes: [sm, md, lg]
variants: [pill, underlined]
props:
  - Tabs: defaultValue?, value?, onValueChange?, orientation?
  - TabsList: size? (sm | md | lg, default md) — t-shirt scale aligned with Button/ToggleGroup heights; cascades to every TabsTrigger via context so set it once on the list
  - TabsList: variant? (pill | underlined, default pill) — `pill` is the shadcn chip-on-muted look; `underlined` is the minimal text + bottom-border treatment (formerly the separate SimpleTabs component, collapsed into Tabs in May 2026). Cascades to triggers.
  - TabsTrigger: value: string — matches a TabsContent value; tooltip?: string — when set, wraps the trigger in the design-system Tooltip and auto-applies aria-label (useful for icon-only triggers); requires a TooltipProvider somewhere above the tabs
  - TabsTrigger: disabled?: boolean — trigger shown but not selectable
  - TabsContent: value: string — matches a TabsTrigger value
when_to_use: A small set of peer views within one surface (2–5 tabs). For primary nav use Side Menu/routing. For filters use a filter control, not tabs. Pick `variant="pill"` for app chrome (settings panels, in-card tab strips). Pick `variant="underlined"` for marketing/docs pages and browser-tab-style treatments.
composes_with: [Card (tabs inside a card body), Dialog, TooltipProvider (required for tooltip prop)]
aliases: [tabs, tab strip, tab bar, tab view, tabbed interface, pageviewcontroller, react native tab view, underlined tabs, page tabs, segment switcher, simple tabs]
---

```jsx
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="details">…</TabsContent>
  <TabsContent value="activity">…</TabsContent>
</Tabs>
```

```jsx
// Icon-only triggers — `tooltip` adds the design-system Tooltip + aria-label.
<TooltipProvider>
  <Tabs defaultValue="preview">
    <TabsList size="sm">
      <TabsTrigger value="preview" tooltip="Preview"><Eye /></TabsTrigger>
      <TabsTrigger value="code" tooltip="Code"><Code /></TabsTrigger>
    </TabsList>
    <TabsContent value="preview">…</TabsContent>
    <TabsContent value="code">…</TabsContent>
  </Tabs>
</TooltipProvider>
```

```jsx
// Underlined variant — replaces the old SimpleTabs component. Use
// `variant="underlined"` on the TabsList and it cascades to triggers.
<Tabs defaultValue="profile">
  <TabsList variant="underlined">
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="team">Team</TabsTrigger>
    <TabsTrigger value="billing">Billing</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">…</TabsContent>
  <TabsContent value="team">…</TabsContent>
  <TabsContent value="billing">…</TabsContent>
</Tabs>
```

---

---
name: Textarea
import: "@gradeui/ui"
element: textarea
props:
  - size?: "default" | "sm" | "xs" — control density, mirrors Input. default = min-h-80 / text-sm; sm and xs shrink the min-height + padding for dense panels.
  - All native textarea HTML attrs (rows, value, onChange, placeholder, disabled)
when_to_use: Multi-line text entry (descriptions, messages, comments). Pair with a Label. Single-line input → use Input instead. Use size="sm"/"xs" in dense tool panels.
composes_with: [Label, Form, Card (in CardContent)]
aliases: [text area, multiline, comment box, message field, text editor, multi-line text, multiline input, multiline text field, comments box, multiline textinput]
---

```jsx
<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" rows={4} placeholder="Tell us about yourself." />
```

---

---
name: ThreeScene
import: "@gradeui/ui"
props:
  - preset?: "mesh" | "waves" | "space" | "plasma" | "voronoi" | "synthwave" — shader preset id from the registry
  - fragmentShader?: string — user-authored GLSL body; takes precedence over preset
  - onShaderError?: (error: ShaderCompileError) => void — fires on compile failure; scene falls back to `preset="space"`
  - postPreset?: "none" | "vhs" | "cinematic" | "synthwave" | "crt" (default "vhs") — post-processing pass
  - palette?: Partial<{ primary; secondary; accent; background }> — any CSS-legal colour string per slot. Re-tints automatically when the theme changes. Unset slots fall back to defaults.
  - createScene?: (ctx) => SceneHandle — custom full scene factory; takes precedence over preset AND fragmentShader
  - controls?: boolean (default false) — play/pause overlay
  - autoPlay?: boolean (default true) — respects reduced-motion
  - pauseOffscreen?: boolean (default true) — big win for WebGL battery life
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" (default "video")
  - maxDpr?: number (default min(devicePixelRatio, 2)) — lower for thumbnails / low-end devices
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "lg")
when_to_use: WebGL primitive for shader backgrounds, generative visuals, and bespoke three.js scenes. Three authoring paths, in order of preference — (1) pick a `preset` id; (2) if nothing in the registry fits, write a `fragmentShader` against the fixed uniform contract; (3) only as a last resort, pass a full `createScene` factory. For looping video, use VideoPlayer; for interactive animations, use RivePlayer.
composes_with: [MediaSurface (internal), foreground content stacked above with `position: absolute/relative z-10`]
aliases: [three, threejs, webgl, shader, scene, 3d, generative, hero background, fragment shader, glsl]
notes: |
  Depends on `three` and `postprocessing` (bundled into @gradeui/ui). Safari caps concurrent WebGL contexts at ~8 — for preset galleries, prefer ShaderPresetPreview with `live="hover"`.

  ## Path 1 — `preset` (pick one, fastest, highest quality)

  Valid `preset` ids (complete list — do NOT invent any others):
    - "mesh"      — smooth moving blobs of primary/secondary/accent over the background; soft, theme-reactive. THE default soft background. Default post: "none".
    - "waves"     — flowing banded ribbons rippling across the surface; clean motion for headers/heroes. Default post: "none".
    - "space"     — Hyperspace starfield, streaking stars. Default post: "vhs".
    - "plasma"    — soft rolling colour clouds, ambient/abstract. Default post: "synthwave".
    - "voronoi"   — jittered cellular grid with glowing edges. Default post: "crt".
    - "synthwave" — retro perspective grid + banded sun. Default post: "synthwave".

  Any other preset id renders an empty surface. If these don't cover the ask, DO NOT invent a name — jump to Path 2 (`fragmentShader`) and write the shader directly.

  Valid `postPreset` ids (complete list): "none" | "vhs" | "cinematic" | "synthwave" | "crt".

  Re-skin any preset with `palette={{ primary, secondary, accent, background }}` to shift its mood. Preset + palette + postPreset is usually enough to hit ocean / lava / neon / forest vibes.

  ### Palette values — what counts as a valid colour

  Each slot accepts ANY CSS-legal colour expression. Values are normalised via a browser probe before being handed to three.js, so all of these work:

    - CSS custom properties wrapped in a colour function — `"oklch(var(--primary))"`, `"oklch(var(--foreground))"`. **This is the recommended pattern for gradeui consumers.** gradeui tokens (like shadcn) are bare channel triplets (`--primary: 0.610 0.128 20`), so `var(--primary)` alone is NOT a valid CSS colour and will render black. ALWAYS wrap as `oklch(var(--token))`. The shader re-tints automatically on theme change.
    - Hex — `"#ff5fb9"`, `"#f5b"`.
    - `rgb()` / `rgba()` — `"rgb(255 95 185)"`, `"rgb(255, 95, 185)"`.
    - `hsl()` / `hsla()` — `"hsl(330 100% 69%)"`.
    - `oklch()` / `lab()` / `lch()` / `oklab()` — `"oklch(0.74 0.18 350)"`. Full CSS Color 4.
    - Named colours — `"tomato"`, `"dodgerblue"`, `"black"`.

  INVALID — these DO NOT work and will silently fall back to the default palette slot:

    - Literal bare triplets passed as a palette string — `"0.4 0.1 0.9"` is NOT a colour; wrap it as `"oklch(0.4 0.1 0.9)"`. (The var()-based auto-wrap above only kicks in when the palette value is `var(--token)` and the token itself is a triplet — it can't rescue a raw triplet passed directly.)
    - three.js hex numbers — `0xff5fb9` (number). Use the string `"#ff5fb9"`.
    - Colour arrays — `[0.4, 0.1, 0.9]`. Not accepted.

  Theme reactivity: when the host document's root class or `data-theme` attribute changes, the scene re-reads the palette and pushes new uniforms into the running shader WITHOUT tearing down the WebGL context. Dark/light swaps are essentially free.

  ### gradeui token semantics — pick the RIGHT tokens, and ALWAYS wrap in `oklch()`

  gradeui tokens are bare OKLCH channel triplets (`--primary: 0.610 0.128 20`, no `oklch()` wrapper) — same convention as shadcn. That means **every `var(--token)` passed to the palette MUST be wrapped in `oklch(...)` at the call site**: `"oklch(var(--primary))"`, not `"var(--primary)"`. Unwrapped values resolve to invalid CSS and render black.

  Token role cheat-sheet when picking which slot maps to what:

    - `--primary` — brand hue 1. USE for `palette.primary` (and often `palette.accent` too).
    - `--accent` — brand hue 2. USE for `palette.secondary` — gradeui's `--secondary` is a NEUTRAL surface (identical to `--muted`) and will render as a flat near-white wash in the shader.
    - `--foreground` — inverted neutral (dark in light mode, light in dark mode). USE for `palette.background` — the raw `--background` token is the page background (near-white in light mode) and will wash the shader out.

  Idiomatic theme-reactive palette for gradeui consumers (copy verbatim):

    ```jsx
    palette={{
      primary: "oklch(var(--primary))",
      secondary: "oklch(var(--accent))",   // NOT var(--secondary) — that's a neutral
      accent: "oklch(var(--primary))",
      background: "oklch(var(--foreground))", // NOT var(--background) — that's the page bg
    }}
    ```

  ## Path 2 — `fragmentShader` (custom GLSL)

  Pass a GLSL fragment shader body as a string. Runs on a fullscreen quad. Header is AUTO-INJECTED — write `void main()` only and use the uniforms below as given. Do NOT redeclare them, do NOT add `#version` directives, do NOT `import * as THREE` — you are writing shader text, not JavaScript.

  Auto-injected header (available to every fragmentShader):

    ```glsl
    precision highp float;
    varying vec2 vUv;               // [0,1] across the quad
    uniform float uTime;            // elapsed seconds
    uniform vec2  uResolution;      // pixel size of the canvas
    uniform vec2  uMouse;           // [0,1], y-up (GLSL convention); defaults to (0.5, 0.5)
    uniform vec3  uPrimary;         // palette.primary  (theme-driven)
    uniform vec3  uSecondary;       // palette.secondary
    uniform vec3  uAccent;          // palette.accent
    uniform vec3  uBackground;      // palette.background
    ```

  Minimal working skeleton:

    ```glsl
    void main() {
      vec2 uv = vUv - 0.5;
      float t = uTime;
      vec3 col = mix(uBackground, uPrimary, 0.5 + 0.5 * sin(length(uv) * 10.0 - t));
      gl_FragColor = vec4(col, 1.0);
    }
    ```

  GLSL syntax rules:
    - Use `gl_FragColor` for output (NOT `out vec4`).
    - Use `varying` for inputs (NOT `in`).
    - Use `texture2D` if sampling textures (not `texture`). In practice you won't need textures — stick to procedural colour.
    - Hard cap: keep shaders under ~200 lines. Long raymarchers are usually both slow and wrong.

  Error handling: if the GLSL fails to compile, the component fires `onShaderError` with the GL info log and renders `preset="space"` as a fallback. Never returns a blank surface.

  ## Path 3 — `createScene` (escape hatch)

  A full `SceneFactory` that returns `{ scene, camera, update, resize, setPalette, dispose }`. Only reach for this if you need real geometry, multiple passes, or a custom camera. 95% of "make me a shader" asks are better served by Path 2.

  ## Fullscreen backgrounds

  Surface defaults to `aspect="video"` (16:9). For a full-bleed hero background using `className="absolute inset-0"`, ALWAYS also pass `aspect="auto"` — otherwise the aspect-ratio constraint fights the absolute positioning and you get letterboxing.

  ## Layering & tweakable params (direction)

  Shaders are composable, not monolithic. A rendered visual is a BASE
  layer (the generative scene — gradient, dots, waves, space…) plus a
  stack of EFFECT layers applied on top (grain, dither, vignette,
  chromatic…). This is the same model as the post-FX composer — an
  effect is independent of the base it sits over, so e.g. `grain`
  applies to ALL bases (mix-and-match).

  Every layer — base and effect — declares a `params: ParamSpec[]`
  schema (see lib/three/types.ts): `range` (slider + number),
  `segmented`, `select`, `toggle`, `color`, `colorList`. A param's
  `key` doubles as the GLSL uniform name, so values map to uniforms
  generically. The same `ParamSpec` shape is what a controls panel
  renders from — the Paper-style "Presets + sliders + swatches" panel —
  and is the canonical "this section is a form" descriptor shared with
  the inspector controls kit (Input slots, sized Select, segmented
  control, slider+number).
---

```jsx
// Path 1 — named preset (fastest path)
<ThreeScene preset="plasma" postPreset="synthwave" aspect="wide" />
```

```jsx
// Path 1 — preset + palette re-skin to hit a custom mood
<ThreeScene
  preset="space"
  postPreset="cinematic"
  palette={{
    primary: "#00e0ff",
    secondary: "#1a7eff",
    accent: "#ffffff",
    background: "#000512",
  }}
/>
```

```jsx
// Path 1 — palette from the active theme via CSS variables.
// Recolors automatically when the theme switches.
//
// gradeui tokens are bare OKLCH triplets (shadcn-style), so EVERY var() MUST
// be wrapped in oklch(...) at the call site — unwrapped `var(--primary)` is
// invalid CSS and will render black.
//
// Slot mapping: `--secondary` is a neutral surface in gradeui (not a brand hue)
// and `--background` is the page bg (near-white in light mode). Map secondary
// to `--accent` and background to `--foreground` for a punchy, theme-reactive
// palette that inverts cleanly on dark-mode toggle.
<ThreeScene
  preset="plasma"
  palette={{
    primary: "oklch(var(--primary))",
    secondary: "oklch(var(--accent))",
    accent: "oklch(var(--primary))",
    background: "oklch(var(--foreground))",
  }}
/>
```

```jsx
// Path 1 — CSS Color 4 (oklch) works too.
<ThreeScene
  preset="voronoi"
  palette={{
    primary: "oklch(0.74 0.18 350)",
    secondary: "oklch(0.62 0.22 260)",
    accent: "oklch(0.92 0.11 95)",
    background: "oklch(0.1 0.04 280)",
  }}
/>
```

```jsx
// Path 2 — custom fragment shader. Header is auto-injected; just write main().
// This one: concentric rings in the theme's primary colour, breathing on uTime.
<ThreeScene
  fragmentShader={`
    void main() {
      vec2 uv = vUv - 0.5;
      uv.x *= uResolution.x / uResolution.y;
      float d = length(uv);
      float rings = 0.5 + 0.5 * sin(d * 30.0 - uTime * 2.0);
      vec3 col = mix(uBackground, uPrimary, rings);
      col = mix(col, uAccent, smoothstep(0.45, 0.5, d) * 0.4);
      gl_FragColor = vec4(col, 1.0);
    }
  `}
  postPreset="vhs"
  aspect="square"
/>
```

```jsx
// Path 2 — interactive: follow the pointer with uMouse.
<ThreeScene
  fragmentShader={`
    void main() {
      vec2 uv = vUv;
      float d = distance(uv, uMouse);
      float glow = smoothstep(0.3, 0.0, d);
      vec3 col = mix(uBackground, uPrimary, glow);
      gl_FragColor = vec4(col, 1.0);
    }
  `}
/>
```

```jsx
// Fullscreen hero — shader behind, content on top.
// `aspect="auto"` is required for inset-0 to fill the parent.
<div className="relative h-screen w-full overflow-hidden">
  <ThreeScene
    preset="synthwave"
    aspect="auto"
    className="absolute inset-0"
  />
  <div className="relative z-10 py-16 px-6 text-center text-white">
    <h1 className="text-5xl font-bold">Build at the speed of thought</h1>
  </div>
</div>
```

---

---
name: Toaster
import: "@gradeui/ui"
aliases: [toast, toaster, sonner, notification, snackbar, alert toast, transient alert, transient banner, banner notification, toastandroid]
props:
  - Toaster: position? "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" (default "bottom-right")
  - Toaster: theme? "light" | "dark" | "system"
  - Toaster: richColors?: boolean — colored variants for success/error/warning/info
  - Toaster: expand?: boolean — keep multiple toasts visually separated rather than stacked
  - Toaster: visibleToasts?: number — max concurrent toasts on screen (default 3)
  - Toaster: duration?: number — default ms before auto-dismiss
when_to_use: Transient, non-blocking feedback that confirms or warns about an action — "Saved", "Failed to upload", "Copied to clipboard", "Invitation sent". For permanent inline messages reach for Callout. For confirmations that block until acknowledged use Dialog. Mount <Toaster /> ONCE at the root of the app; everywhere else, call the `toast` helper.
composes_with: [App root layout (single <Toaster /> mount), Form submit handlers (success/error toasts), Async actions]
notes: Backed by Sonner under the hood — `import { toast } from "sonner"` to fire toasts from anywhere.
---

```jsx
// At the app root, mount once.
<Toaster richColors position="bottom-right" />
```

```jsx
// Anywhere else, fire via the helper.
import { toast } from "sonner";

<Button
  onClick={async () => {
    try {
      await saveProfile();
      toast.success("Saved");
    } catch (err) {
      toast.error("Couldn't save", { description: err.message });
    }
  }}
>
  Save changes
</Button>
```

---

---
name: ToggleGroup
import: "@gradeui/ui"
subcomponents: [ToggleGroupItem]
variants: [default, outline, segmented]
sizes: [2xs, xs, sm, md, lg]
props:
  - ToggleGroup: type: "single" | "multiple" — single picks one, multiple picks any number
  - ToggleGroup: value?: string | string[] — controlled; matches `type` (string for single, string[] for multiple)
  - ToggleGroup: defaultValue?: string | string[] — uncontrolled initial
  - ToggleGroup: onValueChange?: (value: string | string[]) => void
  - ToggleGroup: size? (2xs | xs | sm | md | lg, default md) — cascades to every ToggleGroupItem via context, matches Tabs/Button heights; 2xs/xs are the dense tool-panel sizes (2xs also drops text to text-2xs and icons to size-3 so labelled items read at panel density)
  - ToggleGroup: variant? (default | outline | segmented) — segmented sits the items in a muted track with the active item as a soft raised pill, so it reads like a TabsList; reach for it in dense property panels (e.g. a Row/Stack direction toggle)
  - ToggleGroupItem: value: string — what the group reports when this item is pressed
  - ToggleGroupItem: tooltip?: ReactNode — when set, wraps the item in a Tooltip; required for icon-only items where the visible chrome doesn't carry a label
  - ToggleGroupItem: tooltipSide? ("top" | "right" | "bottom" | "left", default "top") — side the tooltip renders on
  - ToggleGroupItem: tooltipDelay?: number — per-item delay override; falls back to the upstream TooltipProvider's delayDuration
when_to_use: A small set of mutually-exclusive (`type="single"`) or independent (`type="multiple"`) binary options that live side-by-side as a segmented control — viewport size picker (Mobile/Tablet/Desktop), text alignment, view density. Reads identically to a TabsList of the same size; reach for ToggleGroup when each option emits a value (like a form input) rather than swapping panels. Use Tabs for panel switching, Toggle for a single on/off.
composes_with: [Card (header controls), Row, AppShellHeader chrome, settings panels]
aliases: [toggle group, segmented control, segmented buttons, button group, pill group, view selector, segmented picker, segmentedcontrolios, segmented buttons group, rn segmented control]
---

```jsx
// Single-select segmented control — viewport size picker with
// icon-only items + tooltips. The `tooltip` prop also fills in
// `aria-label` for screen readers, so consumers don't have to
// duplicate the label.
<ToggleGroup type="single" defaultValue="desktop" size="sm">
  <ToggleGroupItem value="mobile" tooltip="Mobile — 390px"><Smartphone /></ToggleGroupItem>
  <ToggleGroupItem value="tablet" tooltip="Tablet — 768px"><Tablet /></ToggleGroupItem>
  <ToggleGroupItem value="desktop" tooltip="Desktop — 1024px"><Monitor /></ToggleGroupItem>
  <ToggleGroupItem value="responsive" tooltip="Responsive — fills the column"><MoveHorizontal /></ToggleGroupItem>
</ToggleGroup>
```

```jsx
// Multi-select — text formatting toolbar.
<ToggleGroup type="multiple">
  <ToggleGroupItem value="bold" aria-label="Bold"><Bold /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic"><Italic /></ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Underline"><Underline /></ToggleGroupItem>
</ToggleGroup>
```

```jsx
// Segmented variant + 2xs — a dense property-panel toggle. Reads like a
// tab strip (muted track, active pill) but emits a value, so it's a form
// control, not panel-switching. This is the Studio Row/Stack control.
<ToggleGroup
  type="single"
  variant="segmented"
  size="2xs"
  value={direction}
  onValueChange={(v) => v && setDirection(v)}
  className="w-full"
>
  <ToggleGroupItem value="row" className="flex-1"><Columns3 /> Row</ToggleGroupItem>
  <ToggleGroupItem value="col" className="flex-1"><Rows3 /> Stack</ToggleGroupItem>
</ToggleGroup>
```

---

---
name: Toggle
import: "@gradeui/ui"
variants: [default, outline]
sizes: [default, sm, lg]
props:
  - variant? (default | outline) — outline adds a border, default is borderless and ghost-like
  - size? (default | sm | lg)
  - pressed?: boolean — controlled pressed state
  - defaultPressed?: boolean — uncontrolled initial state
  - onPressedChange?: (pressed: boolean) => void
  - disabled?: boolean
  - children: React.ReactNode — usually an icon or short label
when_to_use: A standalone on/off button — Bold/Italic in a toolbar, "Show grid" in a header, single binary toggle that doesn't belong inside a Switch row. For two-or-more mutually-exclusive options use ToggleGroup. For a labeled settings switch ("Active: on/off") use Switch.
composes_with: [Tooltip (wrap an icon-only Toggle), Row, TabsList (sibling)]
aliases: [toggle, toggle button, press button, bold button, italic button]
---

```jsx
// Single toolbar toggle — icon + tooltip for screen readers.
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Toggle aria-label="Toggle bold">
        <Bold />
      </Toggle>
    </TooltipTrigger>
    <TooltipContent>Bold</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

```jsx
// Borderless variant — fits inline among other controls.
<Toggle defaultPressed>Show grid</Toggle>
```

---

---
name: Toolbar
import: "@gradeui/ui"
role: layout
subcomponents: [ToolbarSlot]
props:
  - leading?: React.ReactNode — left-aligned region (logo + primary nav)
  - center?: React.ReactNode — center region (search, page title, segmented control)
  - trailing?: React.ReactNode — right-aligned region (action icons, avatar, primary CTA)
  - children?: React.ReactNode — escape hatch; bypasses slot layout
  - position?: "top" | "bottom" | "inline" (default "top") — border placement
  - variant?: "default" | "subtle" | "transparent" (default "default")
  - size?: "sm" | "md" | "lg" (default "md") — height + padding
  - sticky?: boolean (default false) — pin to top/bottom of scroll container
  - aria-label?: string (default "Toolbar") — required by WAI-ARIA toolbar pattern
  - className?: string
when_to_use: |
  ANY three-region chrome bar — the leading/center/trailing pattern Apple HIG
  describes as a "Toolbar." App window chrome (Reddit, Twitter, GitHub, Linear,
  most desktop apps), section toolbars inside Cards or panels, bottom action
  bars on mobile layouts, persistent footer toolbars.

  Don't hand-roll `<Row justify="between">` with a flex-1 on a middle child and
  manual min-width juggling — Toolbar gives you the canonical `auto 1fr auto`
  grid for free, with `role="toolbar"`, `data-gds-part` markers, position
  variants for top/bottom borders, and sticky sizing.

  Slot semantics:
    leading   — Logo + nav rail (e.g. a `<Row>` of Buttons or Link components)
    center    — Search input, page title chip, segmented Tab strip
    trailing  — Icon buttons, notification bell, avatar, primary CTA

  When a slot is omitted, its column collapses cleanly. Center stays visually
  centered in the bar regardless of leading/trailing widths because the grid
  template is `auto 1fr auto` (the center column absorbs available width).

  Use as the top child of `<AppShellHeader>` for window-level chrome:
    <AppShellHeader>
      <Toolbar leading={<Logo/>} center={<Search/>} trailing={<Avatar/>} />
    </AppShellHeader>

  Use directly inside a Card or page section for section-scoped toolbars:
    <Card>
      <Toolbar size="sm" variant="subtle" leading={...} trailing={...} />
      {content}
    </Card>
composes_with: [Button, Avatar, Input, Logo, Badge, AppShellHeader, Card, Row, Stack]
aliases: [
  toolbar, tool bar, top bar, topbar, app bar, appbar, header bar, header,
  navigation bar, nav bar, navbar, window chrome, window toolbar, title bar,
  titlebar, action bar, actionbar, command bar, ribbon,
  three-region nav, leading center trailing, leading-center-trailing,
  apple hig toolbar, hig toolbar, native toolbar, segmented toolbar,
  bottom toolbar, footer toolbar, fixed toolbar, sticky header
]
notes: |
  Apple HIG reference: https://developer.apple.com/design/human-interface-guidelines/toolbars
  WAI-ARIA toolbar pattern: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/

  Roving tabindex for arrow-key navigation between toolbar items is NOT
  implemented in v1. For a tight cluster of related controls (an editor
  toolbar — B / I / S / link), compose with @radix-ui/react-toolbar inside
  the slots if you need arrow-key navigation. For an app chrome bar (logo
  + nav + actions), standard tab order is the expected pattern and a
  single aria-label is sufficient.

  Center vs. leading for the page title:
    - Use `center` for a CENTERED page title (Apple-style window chrome).
    - Use `leading` after the logo for a LEFT-ALIGNED page title (web-app
      style — GitHub, Linear). Mixing is fine.
---

```jsx
// App window chrome — Reddit / Twitter / GitHub shape.
<Toolbar
  leading={
    <Row gap="sm" align="center">
      <Logo />
      <Button variant="ghost" size="sm">Home</Button>
      <Button variant="ghost" size="sm">Explore</Button>
    </Row>
  }
  center={
    <Input placeholder="Search" className="max-w-md" />
  }
  trailing={
    <Row gap="xs" align="center">
      <Button variant="ghost" size="icon"><Bell /></Button>
      <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
    </Row>
  }
/>
```

```jsx
// Section toolbar inside a Card — small, subtle, no border.
<Card>
  <Toolbar
    size="sm"
    variant="subtle"
    position="inline"
    leading={<span className="text-sm font-medium">Recent activity</span>}
    trailing={
      <Button variant="ghost" size="sm">View all</Button>
    }
  />
  <CardContent>…</CardContent>
</Card>
```

```jsx
// Bottom action toolbar — common on mobile-style detail pages.
<Toolbar
  position="bottom"
  sticky
  leading={<Button variant="outline" size="sm">Cancel</Button>}
  trailing={<Button size="sm">Save changes</Button>}
/>
```

```jsx
// Inside AppShellHeader — the canonical "app chrome" composition.
<AppShell nav="side">
  <AppShellHeader>
    <Toolbar
      leading={<Logo />}
      trailing={
        <Row gap="xs">
          <Button variant="ghost" size="icon"><Bell /></Button>
          <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
        </Row>
      }
    />
  </AppShellHeader>
  <AppShellNav placement="side">{/* sidebar */}</AppShellNav>
  <AppShellMain>{/* content */}</AppShellMain>
</AppShell>
```

## Anti-patterns

```jsx
// ❌ Hand-rolling the three-region grid every time.
<Row justify="between" align="center" className="px-4 py-3 border-b border-border">
  <Row gap="sm" align="center"><Logo /></Row>
  <div className="flex-1 flex justify-center"><Input className="max-w-md" /></div>
  <Row gap="xs" align="center"><Bell /><Avatar /></Row>
</Row>

// ✅ Toolbar collapses this to slot props + the right ARIA role.
<Toolbar
  leading={<Logo />}
  center={<Input className="max-w-md" />}
  trailing={<Row gap="xs"><Bell /><Avatar /></Row>}
/>
```

```jsx
// ❌ Cramming an editor-style toolbar (B / I / S / link) into the leading
//    slot. Toolbar's slot layout is for chrome bars; for a tight cluster
//    of related controls with arrow-key navigation, compose with Radix
//    Toolbar primitives inside the leading slot OR use a plain <Row>.

// ✅ Editor toolbar lives inside the section it's editing, not in the
//    window chrome. Use a Row of Buttons or @radix-ui/react-toolbar
//    inside the section.
```

---

---
name: Tooltip
import: "@gradeui/ui"
subcomponents: [TooltipTrigger, TooltipContent, TooltipProvider]
props:
  - TooltipProvider: delayDuration? number (default 700) — ms hover before show; mount ONCE near the app root
  - TooltipProvider: skipDelayDuration? number (default 300) — ms gap that still feels like "same hover"
  - Tooltip: open?, defaultOpen?, onOpenChange?
  - TooltipTrigger: asChild?: boolean — usually wraps a Button or icon
  - TooltipContent: side? "top" | "right" | "bottom" | "left" (default "top"); align? "start" | "center" | "end"; sideOffset?: number
when_to_use: A short, non-essential label that explains a control on hover/focus — icon-only buttons in toolbars, abbreviated column headers, status dots. NEVER hide critical info inside a tooltip — they're invisible on touch and can be skipped by screen readers if implemented carelessly. For richer hover content use HoverCard. For inline help text that's always visible, use a description paragraph.
composes_with: [Button (icon-only), Toggle, TabsTrigger (the canonical tabs already have a `tooltip` prop that wraps this), Avatar (status badge meaning)]
aliases: [tooltip, tip, hover tip, hint, label on hover, help tag, hint, helper text bubble, info tip]
---

```jsx
// Icon-only Button with a tooltip — accessible name still set via aria-label.
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Open settings">
        <Settings />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Settings</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

---
name: VideoPlayer
import: "@gradeui/ui"
props:
  - src: string — video URL
  - controls?: boolean (default true) — show native controls; false for chromeless hero/background video
  - autoPlay?: boolean (default false) — forces muted=true (browser restriction)
  - loop?: boolean (default false)
  - muted?: boolean (default = autoPlay)
  - pauseOffscreen?: boolean (default true) — pause when scrolled out of viewport
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" (default "video")
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "lg") — driven by `--gds-media-radius`
  - objectFit?: "cover" | "contain" | "fill" (default "cover")
  - poster?: string — image shown before playback. Always rendered as a `loading="lazy"` `<img>` overlay (not the native `poster` attribute, which fetches eagerly).
  - playbackRate?: number (default 1)
when_to_use: HTML5 video wrapped in the shared media surface. Controls-on for a standard player, controls-off (+ autoplay/muted/loop) for hero / background video. Prefer Rive for anything interactive, Three Scene for shader backgrounds.
composes_with: [MediaSurface (internal), Card (wrap for thumbnail grids)]
aliases: [video, mp4, movie, webm, clip, video view, av player, react native video, video element]
notes: Poster images are always lazy-loaded. We don't use the native `<video poster>` attribute because browsers fetch it eagerly even when the surface is off-screen, which wastes the offscreen-pause savings. Instead we render `<img loading="lazy" decoding="async">` layered over the video, then fade it out on `onPlaying`. When no `src` is given nothing renders — always pass a URL.
---

```jsx
<VideoPlayer src="/sample.mp4" poster="/movie-poster.jpg" controls />

// Chromeless hero video
<VideoPlayer src="/sample.mp4" controls={false} autoPlay loop muted aspect="wide" />
```
