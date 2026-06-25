"use client";

import * as React from "react";
import { Code } from "@/components/ui/code";

export function Body() {
  return (
    <>
      <p>
        An agent installed Grade and built a landing page out of raw{" "}
        <code>&lt;section&gt;</code> and <code>&lt;div&gt;</code> tags. Every band
        was a hand-rolled <code>max-w-7xl mx-auto px-6</code> wrapper. Not one{" "}
        <code>Section</code>, not one <code>Container</code>, none of the
        components I had spent months building. The frustrating part was that
        nothing had gone wrong. The components were all there in the package. The
        agent simply had no way to know they existed, so it did what every model
        does when handed an unfamiliar UI library: it fell back to the web
        default. Div soup.
      </p>

      <p>
        That is the moment I realised a design system is not portable just because
        you can <code>npm install</code> it. It is portable when the installed
        package can <em>explain itself</em> to whoever, or whatever, opens it.
      </p>

      <h2>The components were there. The knowledge wasn&rsquo;t.</h2>
      <p>
        I went looking for what an arbitrary consumer actually receives. The
        answer was uneven. The compiled components shipped, obviously. A
        machine-readable contract of prop types shipped too, under a{" "}
        <code>./contracts</code> export. Even the per-component usage notes
        shipped as markdown files. The content was good. The problem was purely
        discovery: nothing <em>announced</em> any of it. There was no entry point
        that said &ldquo;read this first&rdquo;, no index, nothing in the README
        beyond a single Button example. An agent diligent enough to enumerate the
        whole package would find the good stuff. An agent that read{" "}
        <code>package.json</code> and the README, which is most of them, would
        not.
      </p>
      <p>
        So this was never a content problem. It was an{" "}
        <strong>advertising</strong> problem. The fix is to make the package
        self-announcing, not just self-contained.
      </p>

      <h2>The one rule that has to survive the trip</h2>
      <p>
        If only a single idea makes it across the wire, it has to be the page
        scaffold, because that is the one the model gets wrong by default. In
        Grade a page is an ordered stack of <code>Section</code> bands, and every{" "}
        <code>Section</code> wraps a <code>Container</code>. The Section is the
        full-width themeable band; the Container is the measure. Full-bleed is not
        the absence of a Container, it is a Container set to full width. That last
        point matters, because &ldquo;leave it out to go edge to edge&rdquo; is
        exactly the wrong instinct.
      </p>

      <figure>
        <Code
          filename="the-difference.tsx"
          language="tsx"
          size="xs"
          showLineNumbers
          source={`// What an unguided model writes:
<section className="py-20">
  <div className="max-w-7xl mx-auto px-6">{/* ... */}</div>
</section>

// What the scaffold rule produces instead:
<Section scope="inverse" pad="xl">
  <Container maxW="lg">{/* ... */}</Container>
</Section>

// Edge to edge is still a Container, never an omission:
<Section pad="none">
  <Container maxW="full">{/* full-bleed media */}</Container>
</Section>`}
        />
        <figcaption>
          The left is reachable by no token and themeable by nothing. The right
          re-tones from one <code>scope</code>.
        </figcaption>
      </figure>

      <p>
        The reason the second form is worth insisting on is not neatness. The raw
        markup is unreachable: no token re-tones it, no theme touches it, nothing
        downstream can restyle it. The primitive version is one knob away from
        every other band on the site.
      </p>

      <h2>Foundations are rules, not components</h2>
      <p>
        The harder half is everything that has no component to import. How colour
        scopes work. How the expressive accent layer paints a promo band without
        touching base UI. The type scale, the spacing density, what a theme even
        is. You cannot <code>import</code> a rule, but an agent still has to know
        it, or it will reach for a literal hex value and a hardcoded{" "}
        <code>py-20</code> and quietly break themeability. So the foundations ship
        as their own short documents alongside the components: themes, colour
        scopes, expressive, typography, spacing. Each one is declarative and
        opinionated, written to be read by a model mid-generation, not by a person
        browsing docs.
      </p>

      <h2>One file, generated, that can never go stale</h2>
      <p>
        Rather than scatter this, I assemble it into a single comprehensive
        document, a kind of <code>DESIGN.md</code> that is the whole system in one
        place: the scaffold rule, then the foundations, then every component&rsquo;s
        usage note. The important property is that it is <strong>generated</strong>{" "}
        from the same sidecars the components already carry. I do not hand-maintain
        it. Edit a component&rsquo;s note, run the generator, and the document is
        current. A doc that is built from the source of truth cannot drift from
        the source of truth, which is the failure mode of every design-system
        wiki I have ever seen.
      </p>

      <h2>Big, but cache-shaped</h2>
      <p>
        Assembled in full, that document is large, around seventy thousand tokens.
        Too big to paste into every generation. But you are not meant to. The
        package is tiered on purpose, and the tiers map cleanly onto how prompt
        caching wants to be fed: a big stable prefix, a small changing tail.
      </p>
      <ul>
        <li>
          A tiny <strong>entry point</strong>, a few hundred tokens, that an agent
          loads every time: the scaffold rule and pointers to the rest.
        </li>
        <li>
          The <strong>foundations</strong>, a few thousand tokens, loaded once per
          session.
        </li>
        <li>
          A cheap <strong>index</strong>, one line per component, so the agent can
          pick what it needs and pull only those notes.
        </li>
        <li>
          The full document as the on-demand <strong>reference</strong> and the
          retrieval corpus, never sent wholesale.
        </li>
      </ul>
      <p>
        Because every one of those files is static and versioned, they sit at the
        front of the context and hit the model&rsquo;s prompt cache on every turn.
        Only the handful of retrieved component notes and the actual request
        change at the tail. Pin to a version and you get immutable CDN caching for
        free on top. The thing that <em>busts</em> caches, regenerating docs live
        or stuffing a variable blob into every prompt, is precisely what this
        avoids.
      </p>

      <h2>The product layer belongs to the consumer</h2>
      <p>
        There is one more layer, and it is not mine to ship. The package can say
        how Grade works, but it cannot say what <em>your</em> product is. So a
        consumer adds their own brief, what the product does, the voice, the
        do&rsquo;s and don&rsquo;ts, in their own repo, and the generating harness
        stacks it on top. Each layer changes at its own cadence, which is also why
        each caches independently.
      </p>

      <figure>
        <Code
          filename="prompt-layers.txt"
          language="text"
          size="xs"
          source={`[ system  ]  foundations + scaffold rule      ships in the package, per release
[ product ]  the consumer's brief + voice        lives in their repo, per project
[ retrieved] the component notes this screen needs  pulled per task
[ prompt  ]  the actual request                  per turn`}
        />
        <figcaption>
          The package supplies the system knowledge; the consumer supplies the
          product knowledge; they version, and cache, independently.
        </figcaption>
      </figure>

      <h2>Verify it the way you verify code</h2>
      <p>
        A claim like &ldquo;consumers receive everything they need&rdquo; is worth
        nothing if you cannot test it. So portability is a script, not a hope. It
        packs the real tarball, the exact file list the registry would publish,
        and asserts that every consumer-facing artifact is actually in it: the
        entry point, the design document and its index, every foundation, a note
        for every <em>public</em> component, the machine-readable contracts. It
        also fails if the document is stale, or if a new public component shipped
        without its note.
      </p>

      <figure>
        <Code
          filename="verify-portability"
          language="text"
          size="xs"
          source={`@gradeui/ui portability check — 142 files in the tarball

  ok  AGENTS.md ships
  ok  DESIGN.md ships
  ok  DESIGN.index.md ships
  ok  6 foundation docs ship
  ok  82 component sidecars ship
  ok  69 public components checked for sidecars
  ok  machine-readable ./contracts ships
  ok  DESIGN.md carries the Section -> Container scaffold rule

PASS — the package is self-describing. Any consumer gets the full picture.`}
        />
        <figcaption>
          Run in CI, this is what keeps the package self-describing instead of
          slowly decaying back into div soup.
        </figcaption>
      </figure>

      <p>
        Wiring it into CI is the part that makes it durable. A pull request that
        adds a public component without its usage note now fails the build, the
        same way a type error would. The guarantee holds itself up.
      </p>

      <h2>Why bother</h2>
      <p>
        Most design systems ship documentation for humans: a Storybook, a Figma
        library, an MDX site. Those are good, and they are not this. This is
        documentation for the machine, shipped inside the package, generated from
        the code, shaped for the cache, and gated in CI. I have not seen the whole
        of it assembled as one thing, and I think that is about to look like an
        oversight rather than a luxury, because more and more of the consumers of
        a design system are not people reading a site. They are agents reading a
        package.
      </p>
      <p>
        The bar I hold the rest of Grade to is that the system should do what the
        designer says, and everything in it should be a knob. This is the same bar
        pointed at distribution: the system should explain itself to whoever opens
        it, and you should be able to prove that it does.
      </p>
    </>
  );
}
