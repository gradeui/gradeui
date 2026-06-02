/**
 * /docs/studio/embed — "Embed a screen" guide.
 *
 * User-facing walkthrough for dropping a live Grade screen into an outside
 * site via the public /e/<token> route. The route reuses the share-link
 * token, so embedding is "share, then point an iframe at /e/ instead of
 * /s/". See STUDIO-EMBED.md + STUDIO-CAPTURE.md (consumer 3) for the
 * architecture behind this page.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Embed a screen — Grade Studio",
  description:
    "Drop a live, themed Grade screen into any website, blog, or docs page with a single iframe.",
};

// Block code sample — matches the treatment used across the docs pages.
function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gds-gray-100 dark:bg-gds-gray-800 border border-gds-gray-200 dark:border-transparent p-4 font-mono text-sm text-gds-gray-900 dark:text-white overflow-x-auto">
      <pre className="whitespace-pre">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// Inline file/code mentions inside prose.
function Tok({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>;
}

const BASIC_SNIPPET = `<!-- Responsive 16:10 box — the iframe fills it, height follows the ratio -->
<div style="position: relative; aspect-ratio: 16 / 10; width: 100%;">
  <iframe
    src="https://gradeui.com/e/YOUR_TOKEN"
    style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0;"
    sandbox="allow-scripts"
    loading="lazy"
    title="Grade screen"
  ></iframe>
</div>`;

const PHONE_SNIPPET = `<!-- Phone-shaped frame — swap the ratio to suit the screen -->
<div style="position: relative; aspect-ratio: 390 / 844; max-width: 390px; margin: 0 auto;">
  <iframe
    src="https://gradeui.com/e/YOUR_TOKEN"
    style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 16px;"
    sandbox="allow-scripts"
    loading="lazy"
    title="Grade screen"
  ></iframe>
</div>`;

const FIXED_RES_SNIPPET = `<!-- Fixed-resolution: render at 1280px wide, scale to fill the box -->
<div style="position: relative; aspect-ratio: 16 / 10; width: 100%;">
  <iframe
    src="https://gradeui.com/e/YOUR_TOKEN?w=1280"
    style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0;"
    sandbox="allow-scripts"
    loading="lazy"
    title="Grade screen"
  ></iframe>
</div>`;

export default function StudioEmbedPage() {
  return (
    <div className="space-y-10">
      {/* Hook */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Embed a screen
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Drop a live Grade screen into any website, blog, Webflow page, or
          docs site with a single <Tok>&lt;iframe&gt;</Tok>. The embed renders
          the real screen, same components, same theme, fully interactive,
          isolated from the page around it. No npm install, no React on the
          host.
        </p>
      </div>

      {/* What you get */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          What you get
        </h2>
        <p className="leading-7">
          An embed is the same renderer Studio uses, with the editing chrome
          removed. It is the screen, nothing else: no toolbar, no comment pins,
          no inspector. Three things to know:
        </p>
        <div className="space-y-4 pl-1">
          <div>
            <h3 className="text-lg font-semibold">It is live, not a picture</h3>
            <p className="leading-7 text-muted-foreground">
              The screen renders and runs in the visitor&apos;s browser, so
              animations play and any interactive controls baked into the
              screen work. Responsive breakpoints evaluate against the
              iframe&apos;s own width, so the screen adapts to whatever box you
              give it.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">It stays in sync</h3>
            <p className="leading-7 text-muted-foreground">
              The embed points at the screen by id, so when you update the
              screen in Studio the embed reflects the new version on the next
              load. Pin the share link to a specific revision if you want it
              frozen instead.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">It is isolated</h3>
            <p className="leading-7 text-muted-foreground">
              The embed runs in a sandboxed iframe. It cannot read the host
              page&apos;s cookies, storage, or DOM, and the host page&apos;s
              styles never leak into the screen. The iframe boundary is the
              feature.
            </p>
          </div>
        </div>
      </section>

      {/* Before you start */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Before you start
        </h2>
        <p className="leading-7">
          An embed reuses a screen&apos;s <strong>share link</strong>. The same
          token that powers a public share at <Tok>/s/&lt;token&gt;</Tok> also
          powers the embed at <Tok>/e/&lt;token&gt;</Tok>. So the one thing you
          need is a share link for the screen you want to embed. If you can open
          the screen at a <Tok>/s/&lt;token&gt;</Tok> URL, you can embed it.
        </p>
      </section>

      {/* Get the code */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Get the embed code
        </h2>
        <ol className="list-decimal list-inside space-y-3 leading-7 pl-1">
          <li>
            <strong>Share the screen.</strong> In Studio, open the screen and
            choose <Tok>Share</Tok>. That creates a public link of the form{" "}
            <Tok>https://gradeui.com/s/&lt;token&gt;</Tok>.
          </li>
          <li>
            <strong>Take the token.</strong> The token is the last part of that
            URL, the bit after <Tok>/s/</Tok>.
          </li>
          <li>
            <strong>Point an iframe at <Tok>/e/</Tok>.</strong> Swap{" "}
            <Tok>/s/</Tok> for <Tok>/e/</Tok> and embed it. The{" "}
            <Tok>/e/</Tok> route renders the same screen with the chrome
            stripped.
          </li>
        </ol>
        <p className="leading-7">
          Paste this into any page, replacing <Tok>YOUR_TOKEN</Tok>:
        </p>
        <CodeBlock>{BASIC_SNIPPET}</CodeBlock>
        <p className="leading-7 text-muted-foreground">
          The wrapping <Tok>div</Tok> with <Tok>aspect-ratio</Tok> is what gives
          the iframe a height. An iframe has no natural height of its own, so
          the box around it decides the shape. Width is fluid; height follows
          the ratio.
        </p>
      </section>

      {/* Sizing */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sizing
        </h2>
        <p className="leading-7">
          There are two ways to size an embed. They behave differently, so pick
          the one that matches what you are showing.
        </p>

        <h3 className="text-lg font-semibold">Responsive (default)</h3>
        <p className="leading-7 text-muted-foreground">
          With no extra parameters the screen renders responsive and fills
          whatever box you give it. You control the shape from the host page
          through the wrapper&apos;s <Tok>aspect-ratio</Tok>. Because
          breakpoints evaluate against the iframe&apos;s own width, a narrow box
          shows the screen&apos;s mobile layout and a wide box shows its desktop
          layout, automatically. Use a landscape ratio like <Tok>16 / 10</Tok>{" "}
          for a hero, or a tall ratio with a capped width for a phone:
        </p>
        <CodeBlock>{PHONE_SNIPPET}</CodeBlock>

        <h3 className="text-lg font-semibold">
          Fixed resolution (scales to fit)
        </h3>
        <p className="leading-7 text-muted-foreground">
          Add <Tok>?w=&lt;width&gt;</Tok> and the screen renders at that virtual
          width and is scaled to fill the box, rather than reflowing.
          Breakpoints fire at the fixed width, so you get a faithful,
          proportionally-shrunk render: a real desktop layout miniaturised, not
          a mobile reflow. Width is the only knob you need; it pins the
          breakpoints and the screen fills whatever box you give it. This is the
          same model the Studio grid thumbnails use; the grid renders at{" "}
          <Tok>1280</Tok> wide.
        </p>
        <CodeBlock>{FIXED_RES_SNIPPET}</CodeBlock>
        <p className="leading-7 text-muted-foreground">
          Optionally add <Tok>&amp;h=&lt;height&gt;</Tok> for an exact
          contain-fit artboard: the screen renders at a fixed{" "}
          <Tok>w</Tok>×<Tok>h</Tok>, centred and letterboxed inside the box.
          Use this when you want a precise thumbnail with no cropping; match the
          wrapper&apos;s <Tok>aspect-ratio</Tok> to your <Tok>w</Tok>/
          <Tok>h</Tok> and it fills edge to edge.
        </p>
        <p className="leading-7 text-muted-foreground">
          Rule of thumb: reach for fixed resolution when you want the screen to
          look like a shrunken desktop (a thumbnail or showcase tile), and
          responsive when you want it to genuinely adapt to the space.
        </p>
      </section>

      {/* Zoom & focus */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Zoom and focus
        </h2>
        <p className="leading-7">
          To spotlight a detail rather than show the whole screen, add{" "}
          <Tok>?zoom=</Tok> and an optional focal point. <Tok>zoom</Tok>{" "}
          magnifies the screen ( <Tok>2</Tok> = 2×), and <Tok>cx</Tok>/
          <Tok>cy</Tok> set the point to centre in the box, as fractions of the
          screen ( <Tok>0</Tok> = left/top, <Tok>0.5</Tok> = centre,{" "}
          <Tok>1</Tok> = right/bottom). The host box then crops to that window.
        </p>
        <CodeBlock>{`<!-- Zoom 2x, focused a third of the way down, centred horizontally -->
<div style="position: relative; aspect-ratio: 16 / 10; width: 100%;">
  <iframe
    src="https://gradeui.com/e/YOUR_TOKEN?zoom=2&cx=0.5&cy=0.33"
    style="position: absolute; inset: 0; width: 100%; height: 100%; border: 0;"
    sandbox="allow-scripts"
    loading="lazy"
    title="Grade screen"
  ></iframe>
</div>`}</CodeBlock>
        <p className="leading-7 text-muted-foreground">
          The screen stays live and interactive under the zoom, this is a real
          magnified view, not an image crop. Combine with the sizing params,
          e.g. a fixed-resolution desktop render zoomed into its header:{" "}
          <Tok>?w=1280&amp;zoom=2.5&amp;cy=0</Tok>.
        </p>
      </section>

      {/* Camera */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Camera (chainable zoom)
        </h2>
        <p className="leading-7">
          A single <Tok>zoom</Tok> is one camera position. Add{" "}
          <Tok>?camera=</Tok> to chain several into a moving shot list: the
          camera holds on a shot, glides to the next, and loops, like an
          auto-zoom product tour. Each shot is{" "}
          <Tok>zoom,cx,cy,hold,trans</Tok> (hold and trans in seconds; cx, cy,
          hold, trans are optional), shots separated by <Tok>;</Tok>. It's
          meant to be hand-writable:
        </p>
        <CodeBlock>{`<!-- Overview → push into a detail → pull back, looping -->
<iframe
  src="https://gradeui.com/e/YOUR_TOKEN?camera=1,0.5,0.5,2 ; 2.4,0.3,0.25,3 ; 1,0.5,0.5,2"
  ...
></iframe>

<!-- reads as: full view hold 2s, glide to 2.4× on (0.3, 0.25) hold 3s,
     glide back to full hold 2s, repeat -->`}</CodeBlock>
        <p className="leading-7 text-muted-foreground">
          A play/pause control appears when there's more than one shot. The
          camera is motion, so it honours the viewer's reduced-motion preference
          (and <Tok>?motion=off</Tok>): under either it settles on the first
          shot and doesn&apos;t move. The screen stays live and interactive
          throughout, this is a directed view of a real running screen, not a
          video.
        </p>
      </section>

      {/* Theme */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Theme and appearance
        </h2>
        <p className="leading-7">
          The embed renders in the project&apos;s saved theme and in the
          light or dark mode stored on the share link. The theme travels as CSS
          variables, so a re-theme of the project flows through to the embed on
          the next load with no code change on the host side.
        </p>
      </section>

      {/* Motion */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Motion
        </h2>
        <p className="leading-7">
          By default the embed animates and honours the viewer&apos;s OS{" "}
          <Tok>prefers-reduced-motion</Tok> setting. To force a still embed,
          add <Tok>?motion=off</Tok>: shader / ThreeScene surfaces hold a single
          frame and CSS animation is suppressed. Useful for a calmer placement,
          or a still hero next to a live one.
        </p>
        <p className="leading-7 text-muted-foreground">
          The toggle is reduce-only: <Tok>?motion=off</Tok> stills the embed,
          but there is no way to force motion onto a viewer who has asked their
          OS for reduced motion. Combine it with the sizing params, e.g.{" "}
          <Tok>?w=1280&amp;motion=off</Tok> for a still desktop thumbnail.
        </p>
      </section>

      {/* Security */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Security
        </h2>
        <p className="leading-7">
          Keep the <Tok>sandbox=&quot;allow-scripts&quot;</Tok> attribute on the
          iframe. It lets the screen run its own scripts while denying it access
          to the host page, so an embedded screen can never reach your
          visitors&apos; cookies, storage, or DOM. The screen runs on the Grade
          origin, isolated from yours.
        </p>
        <p className="leading-7 text-muted-foreground">
          Revoking or expiring the share link immediately disables the embed:
          a revoked or expired token returns <Tok>404</Tok> at{" "}
          <Tok>/e/&lt;token&gt;</Tok>, so the embed stops rendering everywhere
          it was placed.
        </p>
      </section>

      {/* Not included */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          What is not included
        </h2>
        <p className="leading-7">
          An embed is read or tweak, never edit. The Studio surfaces do not come
          along: no selection inspector, no comment pins, no code view, no
          theme switcher. If you want viewers to flip themes or leave comments,
          use a <Tok>/s/&lt;token&gt;</Tok> share link instead, which keeps that
          chrome. The embed is the clean, full-bleed render for showcasing.
        </p>
      </section>

      {/* Self-host note */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Self-hosting
        </h2>
        <p className="leading-7 text-muted-foreground">
          The examples use <Tok>gradeui.com</Tok>. If you run your own Grade
          instance, the route is the same, just on your origin:{" "}
          <Tok>https://your-grade-site/e/&lt;token&gt;</Tok>.
        </p>
      </section>
    </div>
  );
}
