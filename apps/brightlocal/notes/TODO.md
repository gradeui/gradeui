# Todo (queued 11 Sep 2026, evening)

Open items in the order I would take them.

1. **Beacon voice setting.** An in-page setting (Cmd+K and /settings) that
   sets the default voice: auto (register per line, as now), Brian, Bea or
   Ray. The per-line variants already exist in lib/review-summary.ts, so
   the setting picks the variant where one exists and falls back to the
   base line. Keith and Buzz stay fixtures.
2. **Easter egg, part three.** Extend the hover/click author to the page
   strips (lib/beacon-pages.ts lines) and the plan items, not just the
   summary lines.
3. **Globey scene assets.** The full-body Globey scenes (magnifying glass
   and friends) are not in @brightlocal/illustrations 0.6.0. Drop the SVGs
   into public/globey/ and swap the stand-ins (QR banner, first-run band,
   dialog headers). lib/illustrations.ts is the meaning catalogue.
4. **Subscription page, second pass.** DONE 10 Sep: a **confirmation
   state**. Not a fake checkout, because a prototype must never ask for
   card details, and not a persona switch, because that would claim the
   product did something it did not. Choosing a plan sets `?chosen=`, the
   state band turns green and says what the choice means in this account's
   own terms (the trial persona gets the date the trial ends and its
   review count, the lapsed one gets the half-price line, everyone else
   gets the price), the ladder and the cards mark it "Your choice", and
   Change plan puts it all back. Manage billing on the plan you already
   have is deliberately inert rather than claiming you are moving to it.
   STILL OPEN: the four FAQ questions are the real ones off
   brightlocal.com/pricing, but the harvest only caught the questions
   because the accordions were shut, so there are no answers to quote and
   the boxes do not open. Either link them out to the pricing page or get
   the answers. The half-price win-back is still a proposal, not a
   BrightLocal offer.
5. **Other Insights & Actions areas.** Website, Google Business Profile,
   Citations and Export are still skeletons. The Reviews roadmap page is
   the template.
6. **Dark mode sweep.** Every bespoke surface now has a dark rule, but the
   Tracker page body, the Builder wizard and the Showcase widgets were not
   checked in dark. Rule: use the DS semantic pairs, never raw ramp colours.
7. **Badge treatment pick.** Eight options at /docs/beacon, none chosen.
8. **Motion.** The DS entrance tokens are on the chart-tab reveal only.
   Stagger the dialog's headline, copy and column on open.
9. **Review sites vs sources.** DECIDED 10 Sep: **review sites**. It is
   BrightLocal's own published word, already recorded at the top of
   lib/first-run.ts, and "source" reads like plumbing. Done in the copy
   this app owns: the page lines (lib/beacon-pages.ts), the insight items
   and their action links (lib/review-insights.ts), the summary hint
   (lib/review-summary.ts), the starter guide and the DS component note.
   Field names (`source`, `sourceCount`, `bySource`) stay as they are, and
   so does "source" meaning a citation under a "Did you know".
   REMAINING, and deliberately not touched: the Tracker's own chrome (the
   facet menus "All sources" and "Find a source", the donut's "7 sources",
   the "Source" table head, the "Source timeline" panel title) and the
   Report Settings sheet. Those live in a PROMOTED screen, so the change
   belongs in Studio and comes back with the next promotion. A promotion
   patch would work but the patches file says to keep itself minimal, and
   a rename is exactly what Studio can carry.
10. **Theme engine.** For the large personas, a theme engine with mention
    counts (three mentions to name a theme, three months for a trend, a
    sibling or the survey for a comparison) so Beacon says what changed
    and why, not just the numbers.
11. **Celebrate the firsts, and the seconds** (Ali, 11 Sep, last thing).
    Milestones as moments: the first review replied to, the second review
    site connected, the first campaign sent, the first showcase placed,
    the twentieth review. Ray's register, the one place he is allowed to
    fire. Each moment carries a "Did you know" about the very thing they
    just did ("You've connected TripAdvisor. Did you know...") with a
    citable source, or a Beacon insight on that connection from the rows
    ("TripAdvisor is where your comparison reviews come from"). Always
    imparting wisdom. Needs: a milestone detector over the rows plus a
    session flag so each fires once, a small celebration surface (toast
    or a strip variant with the confetti illustration), and a sourced
    fact per milestone (the harvested site copy has the survey stats;
    third-party numbers need a source before they go in).
12. **"Since you last visited"** (Ali, 11 Sep). A daily pass over the rows
    with a few rules: what arrived since the last visit, what changed
    (rating window, waiting count, a site that went quiet), and the one
    milestone crossed if any. Surfaces as the first thing on the hub for a
    returning user, in the recap's header format, and feeds the milestone
    moments in item 11. Rules first, model second: the query is cheap and
    deterministic, the wording is where the voices come in. Persona data
    gives it a "last visit" date per persona to fake the gap.
13. **Walkthrough videos.** DONE in part: the runner is
    apps/brightlocal/scripts/record-video.mjs, the capture stage is
    /meta/capture, the first flow is scripts/flows/overview.json and it
    renders. Remaining: the eight section flows and the stitched master.
    Original note: Plan in notes/VIDEOS.md: nine videos, persona
    cut scenes, a flow runner for the standalone app with `persona` and
    `title` steps, stills first.
14. **Popover motion** (Ali, 12 Sep: "an interesting way to animate in the
    popovers"). Ideas, all on the DS motion tokens, none decorative for
    its own sake:
    - Stagger: header, then headline, then copy, then the right column,
      each on `--ds-motion-entrance-stagger`, so the dialog reads in the
      order you would read it.
    - The column slides in from the right edge a beat after the content,
      which sells "content left, insight right".
    - Numbers count up over `--ds-motion-duration-slow` (the tiles, the
      chart labels), the one place a number earns motion.
    - Marks sweep: the highlighter mark draws left to right under the key
      phrase as the headline lands.
    - Illustrations draw on: the line work strokes in (stroke-dashoffset)
      with the green accent popping last, matching their black-line-plus-
      one-accent rule.
    - Chart bars rise from the baseline, the current month last and in
      green, with `--ds-motion-ease-overshoot`.
    - Reduced motion: everything collapses to the plain fade already in
      place.
    Pick two or three, not all. Stagger plus the mark sweep plus the bars
    rising is probably the set.
15. **Port back to gradeui, as static pages** (Ali, 12 Sep; NOT needed for the reveal in about two days, park it). The gradeui
    build stays static, so the port is new pages, not a runtime.
    - Moves cleanly: the pure libraries (reviews-data, review-summary,
      review-insights, beacon-pages, first-run, beacon-voices,
      illustrations, plans, review-roadmap) have no Next or browser
      dependency and render at build time with a fixed persona each.
    - Moves with a shim: the components read persona and location from
      the demo provider and next/navigation. A static page passes those
      as props instead (a `StaticDemo` provider with a fixed persona and
      location per page, no localStorage, no URL params).
    - Stays here: the settings surface (Cmd+K, /settings, tones, dark,
      engines), the goto bridge, the QR generator's print window, the
      trial recap's open-on-switch. A static page shows one state.
    - The shape: apps/docs pages per persona and section ("Beacon for a
      trial account", "Beacon for a multi-location brand"), each one a
      frozen render of the strips, dialog columns and the roadmap, plus
      the voices and summaries docs pages as they are. The DS stays the
      npm package; the docs site would take @brightlocal/* as deps the
      same way this app does, and the ds/*.jsx copy goes back to being
      the registry lib it was copied from.
16. **Showcase: relevance and sentiment** (Ali, 12 Sep). Choosing which
    reviews to show should not be "here are your five-star ones". Two
    steps:
    - **Relevance.** A showcase for the booking page wants reviews that
      talk about booking; one for a service page wants that service. The
      generator already tags a theme per location, so a first pass can
      match on the theme phrase and the review text.
    - **Sentiment.** Star rating is not sentiment. A four-star review that
      raves reads better than a five-star with two words. Score the text,
      prefer specific praise over short ones, drop anything with a "but".
    - **"Pick them for me."** A button on the Showcase that selects six:
      positive, specific, recent, and spread across review sites and
      themes, with one line saying why each was chosen. Advanced mode, but
      it is the single most demo-able AI moment in the product.
17. **Finish the registry port** (10 Sep). `apps/brightlocal/ds/*.jsx` is a
    copy of `packages/studio/registries/brightlocal/lib/*.jsx`, and four
    files have drifted because the app is where the work happened.
    `proposal-insights.jsx` is now ported back (the per-action `goto`
    wrapper span, because Button drops unknown `data-*`, and `data-hook`
    instead of `dataHook` on AccordionTrigger, which 2.27.0 leaked to the
    DOM). Still app-only, ~446 lines across three files:
    - `proposal-page.jsx`: `NativePageHeader`, the DS's own
      GlobalLayoutContentHeader fed from the props every screen already
      passes, plus the PageHeader engine split.
    - `proposal-shell.jsx`: the `native` nav density, the layout-engine
      switch (`window.__gdsLayoutEngine`), `data-gds-layout-engine`.
    - `proposal-nav.jsx`: `NativeProposalSidebar`.
    One thing does NOT port: `useUrlDataset` imports `next/navigation`,
    which Studio's Fast Frame has no idea about. Drop it and keep the
    `loadSessionDataset()` fallback. The registry has no parse gate and
    every Studio screen imports these, so: esbuild-check each file, run
    `node scripts/generate-registry-lib.mjs brightlocal`, then look at a
    real screen on `localhost:3000/e/<shareId>` before calling it done.
