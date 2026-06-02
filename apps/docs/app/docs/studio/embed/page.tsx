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
          You control the shape from the host page through the wrapper&apos;s{" "}
          <Tok>aspect-ratio</Tok>. The screen itself renders responsive and
          fills whatever box it is given.
        </p>
        <div className="space-y-2 leading-7 text-muted-foreground">
          <p>
            <strong>Wide / hero:</strong> use a landscape ratio like{" "}
            <Tok>16 / 10</Tok> or <Tok>16 / 9</Tok> (the snippet above).
          </p>
          <p>
            <strong>Phone:</strong> use a tall ratio and cap the width.
          </p>
        </div>
        <CodeBlock>{PHONE_SNIPPET}</CodeBlock>
        <p className="leading-7 text-muted-foreground">
          Tip: because breakpoints evaluate against the iframe&apos;s width, a
          narrow box shows the screen&apos;s mobile layout and a wide box shows
          its desktop layout, automatically.
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
