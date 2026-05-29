# gradeui copy

Working drafts for LinkedIn and the home page. All copy follows the doc voice: sentence case, no em-dashes, no italics, prose over bullets. Each post is self-contained and ready to paste, formatted as plain text (LinkedIn does not render markdown).

---

## On audience and goal

The LinkedIn audience is Product Managers, C-suite, and designers and developers extending their knowledge. The goal is to be read as a credible voice in the AI builder and design system space, with two downstream outcomes: people use gradeui, and people hire you for consultancy when they need help shipping.

That changes the voice of these posts. The first pass was builder-voice, punchy and feature-led, which reads like marketing to a PM and is fine in a dev community. This pass is insight-led: a sharp observation about the AI builder market or how teams ship, with gradeui appearing as proof of the thinking rather than the headline. The product earns trust by being the embodiment of the position, not by being repeated as a pitch.

Nine posts. The first two are paired bridge stories that name the two paths into gradeui (out of Lovable-style prototype tools, and away from a doomed legacy rewrite). Posts three through eight are insight-led across the main angles. The ninth is an explicit invitation to talk, which is the post that converts to consultancy briefs and should run once per quarter rather than on rotation.

## LinkedIn snippets

### 1. The graduation problem nobody is naming

A pattern I keep seeing in product teams this year.

A founder or PM ships a v1 on Lovable, Bolt, or v0 in two weekends. The board is delighted. The screenshots travel well. Then comes the first frontend hire, the first design audit, the first integration with the rest of the business, and the work begins to slow. The markup is throwaway. Components do not exist as components. Every regenerate drifts the structure further from anything the team can ship. The thing that got them the demo is the thing that cannot scale.

The strategic mistake is not using AI builders. The strategic mistake is treating the prototype as the foundation. There is a graduation step nobody is talking about: moving from vibe code to real code, on a system that can absorb future AI output without compounding drift.

I built gradeui for exactly that graduation. Real components, real tokens, real Figma parity. AI builders feed into it, your team builds on it.

The demo is not the product. The system underneath is.

### 2. The rewrite that kills teams

Every product team has seen at least one UI rewrite project that took eighteen months, shipped nothing to customers, and ended with the lead engineer leaving.

The instinct is reasonable. The legacy UI is dated, the components are inconsistent, the team wants to modernise. So someone proposes a rewrite. Twelve months in, the new version has caught up to maybe forty percent of the old one. The team is exhausted. The board is asking why nothing has shipped. The rewrite slips. Eventually it dies, or worse, it ships and the team discovers they have rebuilt all the legacy mistakes in new technology.

There is a different way. Piecemeal migration. Install a modern component library alongside whatever your team is shipping today. Replace the sidebar this sprint. Replace the data table next month. Adopt the token system on the page being touched anyway. Every refactor of an old screen graduates it. Every new screen lands on the new system. The migration becomes the work the team was already doing, just channelled.

I built gradeui to be the destination for this kind of migration. MIT licensed, free for commercial use, no lock-in. You own the code. AI builders compound with the work because they generate against the same primitives your team is migrating to.

If your team is mid-rewrite or about to start one, the conversation worth having first is whether you should rewrite at all.

### 3. AI is the fastest way to break a design system

Most design systems being shipped today are quietly rotting. The accelerant is AI builders.

Every generation produces slightly different markup, slightly different spacing, slightly different tokens (or no tokens at all). Six months in, your team has shipped two hundred screens and the system has become fiction. There is no single source of truth. There is a probability distribution of components that looks vaguely like a system if you squint.

The fix is not banning AI. The fix is designing the system so AI output lands on it, not next to it.

Three things to get right. Tokens as the contract, so the brand designer can shift the look without re-prompting. Real components in the output, so generations stack rather than diverge. A Figma file that matches the code, so design and engineering review the same artefact.

Get those right and AI becomes a multiplier on your design system. Get them wrong and AI becomes its accelerated death.

This is the shape design systems take in the AI era. Anything else is technical debt with extra steps.

### 4. The hidden cost of AI builders is integration

Three hundred lines of inline divs and Tailwind classes look fine in a demo. They are a problem when the engineering team has to integrate them with the rest of the application. The markup does not match the team's coding standards. The components do not exist. The tokens are gone. The result reads as "throw this away and start again."

I have watched product teams spend more engineering hours rewriting AI output than they would have spent building it from scratch. The board reads the demo as forward progress. The engineering team reads it as debt. Both readings are correct, which is the painful part.

The way out is to choose AI builders by integration cost, not demo quality. Output that lands as real components, against your tokens, on your stack, is worth more than output that wins a screenshot competition.

If you are evaluating AI builders right now, ask the engineering lead, not the product team. They are the ones absorbing the cost.

### 5. A small design system principle with an outsized payoff

Most component libraries ship one size of every primitive. Default button. Default input. Default modal. It works for landing pages because landing pages are spacious by design. It fails for product UI because product UI has density requirements that a single size cannot serve.

Five sizes per primitive is the discipline. xs for dense ops dashboards and admin tools. sm for compact product UI. md for the default. lg for generous app moments. xl for marketing and onboarding. Every primitive participates: button, input, select, toggle, modal, the lot.

The payoff is one prop. A team that adopts this stops re-spacing components by hand. Density becomes a design decision rather than an engineering escape. The same library serves the dense dashboard and the marketing landing page without forking.

Small principle. Saves months across a product lifecycle. Worth borrowing whether you use gradeui or not.

### 6. Model lock-in is the next strategic risk

A note for anyone evaluating AI builders for their team this quarter.

Most AI tools today are built on a single model. If the provider raises prices, shifts the model behaviour, or ships a competing product, your tooling absorbs the impact. You cannot swap without a rebuild.

This is a familiar shape. It is cloud lock-in from a decade ago. The companies who designed for portability paid a small upfront tax and slept through every provider drama afterwards. The companies who optimised for the leading vendor paid the tax during every renegotiation.

AI builders deserve the same scrutiny. Multi-model by design. Bring-your-own-token for paid providers. Free-tier defaults for the cheap path. Treat models as commodities, treat the system as the asset.

This is the principle behind gradeui. Claude, Gemini, Nano Banana, Imagen, OpenAI, all swappable. The system is the asset. Models are interchangeable parts.

### 7. The opinionated piece of any tool is the default

Designers love the infinite canvas. Product teams quietly suffer from it.

Figma, FigJam, Lovable, Bolt, every AI builder I have looked at this year defaults to the infinite canvas. It is great for sketching. It is terrible for managing two hundred screens of a real product, which is what a team has to do six months in. The job stops being design and starts being archaeology.

I made gradeui Studio default to a grid view of screens. Find it, open it, ship it. The infinite canvas is one click away when you actually want to sketch, but the day-to-day workflow respects how product teams already operate.

This kind of choice tells you what the tool is for. Defaults are positioning. They reveal who the tool was built for far more honestly than the marketing page does.

If you are picking tools for a product team, look at the defaults. The marketing copy will lie to you. The defaults will not.

### 8. Why iterating against AI output is so painful

Every AI builder hands you a polished demo on the first prompt. That is why iteration is so painful.

Polished output is impossible to refine. Every change risks the whole composition. The model rebuilds, the structure shifts, the parts you liked last time disappear. Teams end up prompt-engineering against their own previous output, losing context every cycle. The faster you iterate, the further you drift from the version you actually wanted.

There is a workflow underneath this that works, and it is the one product teams already know. Start at the wireframe. Establish the structure first. Lock the layout. Then raise fidelity on three independent axes: content, imagery, and visual polish. Each step is a deliberate decision, not a hopeful rerender.

This is how design teams have always worked. AI builders should serve that progression, not fight it.

It is the workflow I built into Studio. Worth borrowing whether you use gradeui or not.

### 9. The consultancy invitation (run quarterly)

Half my conversations this month have been with product teams trying to get AI builders to play nicely with their design systems.

It is the right problem to be focused on. AI builders are now generating output faster than systems can absorb it. The discipline is no longer "build the design system." It is "build the design system that can metabolise AI output without compounding drift."

Three things I keep recommending. Tokens as the contract. Real components in the output. A Figma file that matches the code. Get those right and AI becomes a multiplier. Get them wrong and AI becomes its accelerated death.

If your team is wrestling with this, I would be glad to talk. I built gradeui to be the answer. I also help teams build their own.

---

## On voice

A few things to keep consistent across the posts so the feed reads as one voice rather than eight unrelated takes.

Start with an observation, not a feature. "A pattern I keep seeing" is better than "Did you know gradeui." The reader earns the insight first, then learns where it comes from.

Use product mentions as proof. "I built gradeui for this" lands as evidence of conviction. "Buy gradeui" lands as a pitch. The former is what a PM passes to a peer. The latter is what they scroll past.

End with the takeaway, not the CTA. The consultancy CTA goes in post eight on a slow rotation. Everything else lets the reader come to you.

Make at least one post a quarter you genuinely disagree with the crowd on. The infinite canvas post is an example. Posts that are correct but uncontroversial do not build a voice. Posts that are correct and slightly heretical do.

---

## Site copy

Working snippets for the home page. Section ordering matches `POSITIONING.md` and reads top to bottom as you would scroll the page.

A note on hero choice. If LinkedIn is the primary referral channel and the audience is PMs and C-suite arriving from your posts, the positioning hook ("The design system every AI builder should sit on top of") will read as more credible than the developer hook. PMs want the strategic framing, not the install-flow framing. The developer hook works better when referral is coming from Hacker News, dev Twitter, or MCP-discovery routes. Worth keeping both ready and switching based on traffic source.

### Hero (developer hook, recommended)

Primary headline: One free platform. Any AI.

Subhead: GradeUI ships with rock-solid components, skills, and context out of the box. Extend to taste. Bring your key. Unlock the box.

Primary CTA: Open Studio
Secondary CTA: Install the library

### Hero (designer hook, alternative)

Primary headline: Vibe code anywhere. Ship live code with gradeui.

Subhead: The AI app builder for teams that ship real software. Real components, real density, real primitives, a Figma file that matches the code.

Primary CTA: Open Studio
Secondary CTA: See the components

### Hero (positioning hook, alternative)

Primary headline: The design system every AI builder should sit on top of.

Subhead: Real components, not Tailwind soup. Built for apps, not landing pages. Bring your own model, bring your own key, ship the same primitives to your team.

Primary CTA: Open Studio
Secondary CTA: Read the positioning

### Trust bar (under hero)

Caption above the logos: Plugs into everything you already use.

Compact row (models only for the hero variant): Anthropic, Google, OpenAI.

### Section 2: The diff

Headline: Open the markup. Tell me which one you would merge.

Subhead: Every other AI builder ships throwaway code that demos well and rots on contact with a real app. gradeui ships real components that integrate as a file copy, theme with tokens, and survive your next refactor.

### Section 3: Hard primitives

Headline: Data tables. Maps. Drag and drop. Rich text. 3D. The components no AI builder ships.

Subhead: TanStack, MapLibre, dnd-kit, TipTap, three.js. The libraries every serious frontend team eventually adopts, curated and themed against the same token system. Multi-select included.

### Section 4: Density

Headline: Five sizes per primitive. Dense to marketing, one prop change.

Subhead: Built for the application, not the landing page. The screens your team actually ships have density requirements no demo aesthetic can hit.

### Section 5: Figma parity

Headline: Designers and developers build on the same substrate.

Subhead: A slot-based Figma file with primitive names that match the code. Copy to Figma takes a layout straight out of Studio with components intact (shipping soon). Three roles, one substrate.

### Section 6: Tokens

Headline: Reskin everything with a token edit. No regenerate.

Subhead: CSS variables are the contract. Brand designers change `--gds-color-primary` and the entire output reskins. The part of the stack that survives the next AI cycle.

### Section 7: Team surface

Headline: An infinite canvas does not scale. A grid view does.

Subhead: Multiple projects, permissions, team comments, prototype links, grid view of screens. Studio is a team product, not a single-player canvas. The infinite canvas is one click away when you want it.

### Section 8: Fidelity ladder

Headline: Wireframes first. Raise fidelity on your terms.

Subhead: Structure, content, and visual polish on three independent axes. Lock the layout, swap the data, fill the imagery, take the polish to one hundred. Each step is a deliberate decision, not an accidental rerender.

### Section 9: Real content

Headline: Stop staring at grey rectangles.

Subhead: One-click fill from album art, product photos, stock libraries, or generate against page context with Nano Banana, Imagen, OpenAI, or any model you have a key for. The prototype starts looking like the app on the first click.

### Section 10: Plugs into everything (full trust section)

Headline: Plugs into everything you already use.

Subhead: Model agnostic by design. Bring your own key for any provider. Google's API has a free tier so a Google key costs nothing. Use your paid OpenAI or Anthropic key anywhere else.

Logo rows: Models (Anthropic, Google, OpenAI). Libraries (TanStack, MapLibre, dnd-kit, TipTap, three.js). Content (Unsplash, Spotify). Standards (MCP, React, Figma).

### Section 11: How it ships

Headline: Three ways in. Same system.

Card 1: The free library. `@gradeui/ui` installs into any React project. MIT licensed. The foundation everything else sits on top of. CTA: Install.

Card 2: Studio. The canvas, the team surface, the skills. Free to use, bring your own provider key. A Google key (free tier) costs nothing; OpenAI and Anthropic keys work for paid providers. CTA: Open Studio.

Card 3: The MCP server. Install in Cursor, Claude Code, Windsurf, any MCP-aware tool. Brings the primitives, skills, and playbook directly to your model of choice. CTA: Get the MCP.

### Section 12: Migrate, do not rewrite

Headline: Migrate piece by piece. Without the rewrite.

Subhead: Install the library alongside whatever you ship today. Replace components one at a time. Every refactor graduates a screen onto the system. Every new screen lands on it. The migration is the work your team was already doing, channelled into a foundation that will outlast the next AI cycle.

Trust line: MIT licensed. Free for commercial use. You own the code. No lock-in.

Primary CTA: Talk to us about a migration plan.
Secondary CTA: Install the library.

This is the section that converts to consultancy briefs. Worth giving it space and a visual that makes the piecemeal migration legible (the before-and-during-and-after of a real product UI).

### Footer pitch

A compressed restatement for the bottom of the page:

GradeUI. One free platform. Any AI. Real components, real density, real primitives, real content. Vibe code in Studio. Ship live code to your team. Bring your key, unlock the box.

### About / work with us

A short bio block that sits in the footer or an "About" panel. Doubles as the consultancy hook for visitors who arrive from your LinkedIn voice and want to know who is behind the system.

GradeUI is built by Ali Driver and the gradeui team. We help product teams build design systems that survive the AI era: real tokens, real components, real Figma parity, and a workflow that lets AI builders feed into the system rather than break it.

We work with a small number of teams each quarter on three things. Design system strategy for teams about to scale. AI builder integration for teams whose generated output is fighting their system. Piecemeal migration plans for teams sitting on legacy UI who want to modernise without the doomed rewrite project. You bring the product, the content, and the customer load. We bring the system, the components, and the experience of running these migrations before.

No lock-in on either side. The component library is MIT licensed and free for commercial use. The consultancy is engagement-based, not retainer-based, so the work ends when the work is done.

Get in touch at ali@gradeui.com.

---

## Microcopy bank

Short lines that can show up in card subheads, button hovers, or stray spots in the page.

For the trust bar: "Plugs into everything you already use."
For the diff section: "The only AI builder that produces code you would actually merge."
For the density section: "Dense to marketing, one prop change."
For the team surface: "An infinite canvas does not scale."
For the fidelity ladder: "Wireframes first. Fidelity on demand."
For the real content section: "Stop staring at grey rectangles."
For the trust section: "One free platform. Any AI."
For the install section: "Three ways in. Same system."
For the footer: "Bring your key. Unlock the box."

---

## Anti-pitch

Worth including a small "not for you" beat somewhere on the page, traditionally near the bottom, traditionally written as the founder talking:

GradeUI is not for the solo founder building a marketing site. Lovable, Bolt, and v0 do that better. It is for the team that has already built the marketing site and now has to build the actual application, with all the density, content, and integration that implies. If you are about to inherit a v0 output and rewrite it for the third time, you are the person we built this for.
