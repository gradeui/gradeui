# gradeui positioning

A working strategy doc. Image placeholders are inline with briefs you can hand to a designer or image-gen pass.

## The market is wrong

Lovable, Bolt, v0, Claude Design, and the rest of the AI builders sell the same thing: describe an app, get an app. They produce marketing pages and shallow prototypes that demo well in a tweet and fall apart the moment a real team tries to ship them. The output is Tailwind soup. Hundreds of lines of inline classes, no components, no system, no path to integration. The visual default is generous padding and marketing typography because that is what looks good in the demo screenshot.

This is fine if you are building a landing page for a side project. It is useless if you are building the actual application.

> **Image placeholder: "what AI builders make"**
> A typical v0 or Lovable output rendered as a marketing-flavoured SaaS hero. Big gradient, generous padding, oversized buttons, three-column feature grid. Caption underneath. Treat as the negative example.

## What gradeui is

gradeui is the AI app builder for teams that ship real software. Real components, real density, real primitives, a Figma file that matches the code, and a token system that lets the brand designer change the look without re-prompting.

> **Image placeholder: "what gradeui makes"**
> A dense SaaS workspace screenshot. Left sidebar with sections and counts, top toolbar with search and filters, central data table with frozen first column, right detail pane. Compact density. Caption underneath. Treat as the positive example, sat side by side with the previous placeholder.

One sentence: gradeui generates apps the way a senior team would build them. Every other AI builder is making marketing pages with throwaway markup.

## Vibe to live code

The honest read on Lovable, Bolt, and v0 is that they are great places to start and difficult places to live. You can vibe out a prototype in an afternoon. You cannot ship it. The output is generated, the markup is throwaway, the system underneath is whatever the model felt like that day. Every iteration drifts further from anything a real team can take over.

gradeui sits on the other end of that arc. You can vibe code in Studio just like you would in Lovable. When you are ready to ship, the components are real. The Sidebar you generated is `<Sidebar>` in your codebase. The free component library installs into any React app. Or push the screen straight to CodeSandbox if your team is already working there, so the code lands in their environment ready to extend. Your developers inherit the same primitives you mocked with, in production code they can actually own.

Or you come from somewhere else. You have built two months of UI in Lovable, you have hit the ceiling, and you need a real design foundation before you keep going. gradeui is the graduation path. Bring your screens, rebuild them on a tokenised system, hand the codebase to your team.

The pitch sharpens into one sentence: vibe code anywhere, ship live code with gradeui.

> **Image placeholder: the arc**
> A three-panel sequence. Left: a Studio canvas mid-vibe, rough composition, generated components with placeholder copy. Middle: the same screen polished, components named, tokens applied, slots filled. Right: a developer's IDE with the same screen rendered from real `<Sidebar>` and `<DataTable>` imports, plus the component import statements visible. Caption: "vibe code anywhere, ship live code with gradeui."

## Migrate, do not rewrite

Most product teams carrying real customer load cannot afford a UI rewrite. The rewrite is the project that takes eighteen months, ships nothing to customers, and ends with the lead engineer leaving. Every product manager has watched at least one of these. Some have watched their own.

gradeui is designed for piecemeal migration. The component library installs alongside whatever your team is shipping today. Replace the sidebar this sprint. Replace the data table next month. Adopt the token system on the page being touched anyway. The work compounds. Every new screen lands on the system. Every refactor of an old screen graduates it. The migration becomes the work the team was already doing, channelled into a foundation that will outlast the next AI cycle.

For teams that want help with the plan, gradeui consultancy maps your existing UI to the design system, names the order to replace components, and pairs with your team on the hard parts. You bring the content, the domain expertise, and the customer load. We bring the system, the components, and the experience of running this kind of migration before. AI builders accelerate the work because they generate against the same primitives your team is migrating to, so every prompt compounds with the migration rather than fighting it.

No lock-in. The component library is MIT licensed and free for commercial use. You own the code. If you stop using gradeui tomorrow, the system you built on it keeps shipping. This is the difference between buying a foundation and renting a tool.

> **Image placeholder: the migration ladder**
> A before, during, and after sequence of a real product UI. Top: a legacy admin UI, dense, dated, inconsistent components and colours. Middle: a transitional state with some sections migrated to gradeui and others still on the legacy components, both shipping in production. Bottom: fully migrated UI, modernised but recognisably the same product. Caption: "piece by piece, without the rewrite."

## The five wedges

### 1. Real components, not Tailwind soup

To be fair to v0, it does ship a sidebar. So does anything built on shadcn. Most other builders give you Tailwind soup unless they reach for shadcn underneath. The honest comparison is not "we ship components and they do not." It is "we ship a real system and they ship a starter layer."

shadcn gives you one button size, one input size, no multi-select, no data table that survives past a demo. Beyond the basics it falls back to whatever the model invents. gradeui is what comes after the starter. Every primitive has five sizes. Multi-select is a first-class component. Sidebar, Toolbar, Modal, all real. Everything you would otherwise hand-roll or stitch together from npm is here, themed against the same tokens, in one consistent system.

This is the line worth repeating: gradeui is the only AI builder that produces code you would actually integrate, in a system that scales past the demo.

> **Image placeholder: code diff hero**
> Two code panels, side by side. Left labelled "v0: a sidebar", showing roughly 80 lines of nested divs with Tailwind class strings. Right labelled "gradeui: a sidebar", showing six lines: a `<Sidebar>` component with a few props and slotted children, all token-driven. The visual gap between them is the pitch.

### 2. The hard primitives, out of the box

This is what separates a tool that demos well from a tool you can build a real product on. Real applications are not buttons and forms. They are data tables with sorting, filtering, virtualisation, and column resizing. They are maps with markers and clustering. They are 3D surfaces. They are drag-to-reorder boards. They are rich text editors with collaborative primitives.

gradeui ships all of these as first-class, curated, battle-tested components. Data tables backed by TanStack-grade primitives. Map surfaces with MapLibre as default and Mapbox or Google as adapters. WebGL and three.js surfaces for visualisation, scenes, and product viewers. dnd-kit-backed drag and drop. TipTap, the de facto rich text editor, wired in with a toolbar that respects the size scale. Multi-select. Combobox. The things every serious app needs and no AI builder ships out of the box.

These are the libraries every serious frontend team eventually adopts. The gradeui team has done the integration work. Themed them against the tokens. Wired them into the size scale. Shipped them as one system rather than a list of npm installs your team has to glue together over six months.

Ask v0 for a CRM with a dense customer table that you can drag-reorder, an inline rich text note editor, and a map view of customer locations. It will fake it with divs, or half-stitch libraries it does not fully understand. gradeui will build it because it has the primitives, integrated, themed, and tested.

> **Image placeholder: "the components no AI builder ships"**
> A 2x2 collage. Top-left: dense data table with frozen columns, sort indicators, filter chips. Top-right: map with clustered markers and a popover. Bottom-left: kanban-style drag-and-drop board mid-drag, ghost card visible. Bottom-right: TipTap editor with formatting toolbar and a block menu. All four in the same gradeui visual language so the system reads as one piece.

### 3. Built for apps, not landing pages

Five sizes per primitive. Button, input, select, toggle, modal, the lot. Dense to marketing is one prop change. v0 and Lovable default to spacious because their demos need to look good in screenshots. gradeui defaults to whichever density the application needs.

> **Image placeholder: the size scale**
> The same form (label, input, select, button row) rendered three times in a single image. First column: xs density for ops dashboards, tight padding, small type. Middle: md for standard product UI. Right: xl for marketing onboarding, generous padding, large buttons. Same primitives, just the size prop changing. Caption: "one component, five sizes, dense to marketing."

The buyer this attracts is the team building the application, not the landing page. SaaS shops, internal tools teams, ops and admin platforms, IDE-shaped surfaces, the whole category of dense workspace UI that no AI builder has been able to touch.

### 4. Slot-based Figma parity

The design-to-code translation tax is the largest hidden cost in product teams. Designers mock in Figma, devs rebuild in code, the two drift, the file becomes a lie, and every audit is a fresh disappointment.

gradeui ships a slot-based Figma file. Designers mock with the same primitives devs build with. Slot names line up. Tokens line up. The Figma file is not a picture of the app, it is the app, rendered in design tools.

And the loop runs both ways. Copy to Figma (shipping soon) takes a layout out of Studio with components intact, so what the model generated lands in your designers' workspace as real component instances, not a screenshot they have to redraw. The agent makes a screen, the designer refines it on the same primitives, the developer builds it from the same primitives. Three roles, one substrate.

v0 has no design tool. Lovable does not care about designers. Figma's own AI does not ship integratable code. gradeui is the only one closing the loop.

> **Image placeholder: Figma and code parity**
> Split screen. Left: a Figma artboard showing a Sidebar component with slots labelled (Header, Items, Footer, Settings). Right: the same component in code, with the slot names matching one-to-one. A subtle connector or arrow between them. Caption: "designers and devs build on the same substrate."

### 5. Tokens as the contract

CSS variables are the public surface area. The brand designer changes a token like `--gds-color-primary` and the entire output reskins. No regenerate, no re-prompt, no agent loop. Just a token edit.

This is the part of the stack that survives the next AI cycle. Models will get smarter at generation. The constraint will stop being "can the AI build it" and start being "can the system absorb the AI output without drift." Tokens are the answer.

> **Image placeholder: one app, three brands**
> The same dashboard UI rendered three times in a row with different token sets. Left: a warm brand (amber accents, serif headlines). Middle: a cool tech brand (blue accents, geometric sans). Right: a high-contrast accessibility theme. Same code in every panel, only the token file differs. Caption: "the same generation, three brands, no regeneration."

## Built for teams

Studio is a team product, not a single-player canvas. Multiple projects so an agency can run five clients side by side and a product team can keep marketing surfaces, app screens, and internal tools cleanly separated. Permissions built in. Team commenting on screens, so design review happens where the work lives rather than in a Slack thread linked to a screenshot. Prototype links you can share with stakeholders, who open, comment, and give feedback on the same thing the developers will build.

The opinionated piece is the grid view. Lovable, Figma, FigJam, Bolt, all default to an infinite canvas because designers want to sketch. Real product teams have forty screens, then eighty, then two hundred, and an infinite canvas turns into a junk drawer that nobody can navigate. Grid view says we know what you actually need to do: find the screen, open it, ship it. The infinite canvas option is one click away when you want it.

> **Image placeholder: the grid**
> A project's screens shown as a grid of cards, maybe twenty visible. Each card has a thumbnail, screen name, a comment-count badge, and last-edited stamp. One card hovered showing a quick actions affordance. Caption: "an infinite canvas does not scale, a grid view does."

## Wireframes first, fidelity on demand

Every other AI builder hands you a polished demo screen on the first prompt. It looks great in the screenshot and is brutal to iterate against. The model rebuilds the page each time, the structure shifts underneath you, the parts you liked about the last version disappear.

gradeui starts at the wireframe. Layout first, structure first, the bones of the screen before any polish. Decisions made at this fidelity stay made. Once the structure is right, you raise fidelity on your terms along two independent axes: keep the wireframe data and fill in real imagery and brand polish, or swap the placeholder content for your real data while keeping the layout fixed. Structure, content, and visual fidelity are separated, and you control each one.

This is how real product teams already work. Sketch the screen, agree on the structure, layer in real content, raise the visual fidelity last. The token system, the fill button, and the annotate-then-prompt loop all serve this progression rather than fighting it. A token change or a fill action does not re-prompt the whole page, so the locked-in parts stay locked.

> **Image placeholder: the fidelity ladder**
> A four-panel sequence of the same screen at rising fidelity. Panel one: pure wireframe, grey boxes and lines for layout. Panel two: same structure with real labels and placeholder data. Panel three: real product data and copy filled in. Panel four: polished version with brand tokens applied and generated imagery in the MediaSurfaces. Caption: "structure first, fidelity on demand."

## Real content, not placeholders

Every other AI builder ships a grey rectangle and labels it `<img>`. Designers stare at it, prompt around it, or paste an Unsplash URL by hand. gradeui's image-fill button hooks directly into the libraries that match the surface. Album art for a music app. Product images for e-commerce. Location photography for a map view. Avatars for a directory. One click, the prototype starts looking like the actual app, not a wireframe with rectangles where the content should be.

Bring-your-own-token from day one. Drop in any provider key (Google for Nano Banana and Imagen, where Google's API has a free tier so a key costs nothing; Anthropic or OpenAI for teams already paying them) and the canvas generates imagery against the page's actual context. Not "a generic hero illustration." The hero illustration for this product, this page, this brand voice. The model gets the page composition as context, not just a prompt typed into a box.

This compounds with the system. MediaSurface is the canonical non-person image slot with `hint`, `alt`, and `source` props. Avatar is the people slot. Both render token-driven placeholders when empty. The fill button drops real content straight into them without leaving the canvas, and the same surfaces survive into production code with the same fill hooks.

The curation point applies here too. The gradeui team has wired up the popular content libraries so your team does not have to glue Unsplash, Spotify, or a generation provider into the canvas one Friday afternoon at a time.

> **Image placeholder: the fill menu**
> A MediaSurface mid-fill, the inline menu open showing the options: "Album art (Spotify)", "Stock (Unsplash)", "Generate with Nano Banana", "Generate with Imagen". An album cover loading into the surface in the background, another card filled with a generated hero illustration in the brand palette. Caption: "stop staring at grey rectangles."

## The interaction model

Canvas-first, not chat-first. Studio's annotate-then-prompt model maps to how designers actually work. Look at the canvas, mark up what is wrong, hit run. Chat-first builders make you describe the problem in a paragraph. Designers describe the problem with a pointer.

This is also where batched edits compound. Annotations accumulate, the prompt fires once, the model gets a complete delta rather than a stream of small clarifications. Faster iteration, cleaner attribution, cheaper inference.

> **Image placeholder: annotated canvas**
> Studio canvas screenshot with a generated component centred. Three annotation pins attached to specific parts: one says "tighter spacing", one says "this should be a Toggle, not a Switch", one says "swap for raised variant". A floating Apply button bottom-right. Caption: "describe with a pointer, not a paragraph."

## The distribution play

MCP. Ship gradeui as an MCP server and Cursor, Claude Code, Windsurf, and eventually Lovable itself can consume it. They become channels rather than competitors. Your reviewer skills (a11y, layout, density audit) run on their output. Your token layer normalises what they emit. You sell into the builders rather than against them.

Your own Studio is the canvas-first surface for the designers who want the full loop. Both motions run at once. MCP for the dev-tool ecosystem, Studio for the design-led teams.

## Plugs into everything

Logos and trust markers belong on the home page, but the principle they convey is part of the positioning. gradeui is not locked to a single model, a single library, or a single content source. That is both a credibility move and a defensive one: you cannot be killed by one provider shipping their own builder.

Models. Claude, Gemini, Nano Banana, Imagen, OpenAI. Bring your own key for every provider. Google's API has a free tier so a Google key runs at zero inference cost. Point a high-stakes generation at Anthropic. Studio does not care, the canvas does not care, the skills do not care.

Libraries. TanStack for tables, MapLibre and Mapbox and Google Maps for maps, dnd-kit for drag and drop, TipTap for rich text, three.js and WebGL for 3D. The OSS standards every serious frontend team eventually adopts, curated and themed against the same token system.

Content. Unsplash for stock, Spotify for album art, generation for the long tail. The fill button is the surface, the providers underneath are swappable.

Standards. MCP for distribution, React for output, Tailwind underneath, CSS variables on top, Figma as the design surface. gradeui sits inside the existing ecosystem rather than fighting to replace it.

> **Image placeholder: trust marker bar**
> A horizontal logo strip styled for a home page hero section. Models row (Anthropic, Google, OpenAI). Below it a libraries row (TanStack, MapLibre, dnd-kit, TipTap, three.js). Optional third row for content and standards (Unsplash, Spotify, MCP, React, Figma). Single tonal treatment, subtle dividers, no logos shouting louder than the others. Caption: "plugs into everything you already use." Worth designing as two variants: a compact single-row "models only" version for the hero, and a fuller multi-row version for a dedicated trust section deeper in the page.

## How it ships

The foundation is open source. `@gradeui/ui` installs into any React project, MIT licensed, no account required. Everything else sits on top of it: hosted gradeui.com, self-host Studio, the MCP server, and `@gradeui/pro`. The free library is what makes every other surface integratable in the first place.

There are two ways to use Studio: hosted on gradeui.com or self-hosted.

gradeui.com is the hosted SaaS. A free tier exists for trying the product (limited projects, limited screens, limited AI usage, limited email quota via Resend) and acts as the acquisition path. Paid tiers unlock real team use: more projects and screens, more usage, full collaboration surface (comments, permissions, prototype sharing), the grid view of screens. This is the path for PMs, designers, and founders who do not want to run their own infrastructure. Inference is always bring-your-own-token: a Google API key runs on their free tier (Gemini, Nano Banana, Imagen at zero cost), or add Anthropic and OpenAI keys for paid providers.

Self-host is the alternative for teams that want full control. Install Studio yourself, run it on your own infrastructure, bring your own keys. MIT licensed, free forever. No payment to gradeui, ever. This is the path for engineering-led teams who care more about no-lock-in than convenience.

`@gradeui/pro` is the paid component library on top of the free one. Complex composites and category-specific patterns that go beyond what `@gradeui/ui` ships. Same tokens, same primitives underneath, so adopting Pro never breaks an existing build. For larger teams there is a per-client tier with bespoke components and tokens delivered as a private package.

The MCP server is a public connector you install in Cursor, Claude Code, Windsurf, or any MCP-aware tool. It is orthogonal to the hosting choice: you can use the MCP whether you are on gradeui.com or self-hosted. It exposes the gradeui primitives, the skills (a11y, layout, density audit), and the playbook so the model can reach for the right component without inventing one.

Three on-ramps from a home page perspective: try it on gradeui.com (hosted, free or paid), self-host Studio (MIT, BYOT), or plug into your agent via MCP. Each route lands the same buyer in the same system, at a different starting position.

## Who you sell to

Design engineering at SaaS companies. Staff frontend at companies that have inherited v0 output and rewritten it twice. Design leads at multi-product teams who need a tokenised, app-grade system that AI can actually populate. Internal tools teams who have given up on Retool's aesthetic ceiling.

Lovable and Bolt graduates: founders who built v1 on a vibe-coding platform, hit the ceiling, and need a real foundation before they hire their first frontend engineer or take a real funding round. v0 power users who like the workflow but have outgrown shadcn's primitive set and want a system, not a starter.

Not solo founders building landing pages. That is Lovable's market. Do not fight for it.

## Risks

Claude Design is the actual sharp competitor, not the existing builders. Anthropic-built, likely canvas-first, likely token-aware, model access you cannot match price for price. Your defence is depth. The hard primitives, the Figma parity, the slot system, the skill atoms. Lean into the parts of the system that compound, and ship the MCP integration early so you are inside their funnel rather than outside it.

The other risk is positioning legibility. "Design system" reads dev-y, but the wedge buyer is the designer-coder hybrid. Lead the home page with the visual proof. A v0 output next to a gradeui output. The diff sells itself.

## What ships next

Three things, ordered.

The home page narrative built on these wedges. Hero is the vibe-to-live-code arc, the three-panel sequence that anyone arriving from Lovable or v0 immediately understands. Directly under the hero sits the trust marker bar, compact "models only" variant: Anthropic, Google, OpenAI. Establishes credibility and model-agnosticism in the first viewport.

Section two is the diff: shadcn primitive next to gradeui primitive, with the size-scale and multi-select gaps named. Section three is the hard primitives collage. Section four is the density story. Section five is the Figma parity loop, both directions, with copy-to-Figma called out. Section six is tokens. Section seven is the team surface, grid view as the visual hook. Section eight is the fidelity ladder, the four-panel sequence from wireframe to polished screen. Section nine is real content, the fill menu shot with album art and a generated hero side by side. Section ten is the full "plugs into everything" trust section, multi-row logo bar covering models, libraries, content, standards. Section eleven is "how it ships," three on-ramp cards: free library, open Studio, install the MCP. Section twelve is the migration story, the before-and-during-and-after image of a real product UI moving piece by piece onto the system, plus the no-lock-in trust line and a "talk to us about a migration plan" CTA. This is the section that converts to consultancy briefs.

The MCP server, shipped as a public connector with a one-line install. Distribution unlock. The skills (a11y, layout, density audit, motion review) ride along.

A teardown post comparing gradeui to v0, Lovable, Bolt, and Claude Design on four axes. Integratable code. Hard primitives. Density. Design-to-code loop. Honest, sharp, no fluff. Built as a permanent piece of marketing real estate, not a one-off tweet.
