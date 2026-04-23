/**
 * /docs/studio/how-it-works — the "Inside the Studio pipeline" page.
 *
 * Dual-purpose: (1) reference material for anyone extending the DS — what
 * the .md sidecars are, what shape they take, where the values land. (2) A
 * narrative pitch for why an AI-native design system lands differently
 * than a conventional one. Written in a tone that can be lifted wholesale
 * into a blog post or external writeup.
 */

// Small helper for block code samples — matches the visual treatment used
// on the Installation sections of the component doc pages.
function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
      <pre className="whitespace-pre">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// Inline helper for file/code mentions inside prose. Kept local rather
// than pulling a shared `<InlineCode>` because the repo hasn't
// standardised one and this is the third doc page to hand-roll the same
// pattern — a candidate for a shared primitive if it keeps spreading.
function Tok({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>;
}

const ROW_SIDECAR_EXAMPLE = `---
name: Row
import: "@gradeui/ui"
role: layout
props:
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "md")
  - align?: "start" | "center" | "end" | "stretch" | "baseline" (default "center")
  - justify?: "start" | "center" | "end" | "between" | "around" | "evenly" (default "start")
  - wrap?: boolean (default false)
  - asChild?: boolean (default false)
  - className?: string
  - children: React.ReactNode
when_to_use: Horizontal composition — button groups, inline form rows,
  logo + nav rows, anything on one line. Reach for Row instead of
  \`flex items-center gap-*\` so the alignment and spacing are editable
  through the settings panel. For two-pane layouts with an explicit ratio
  use Split instead — Row evenly flows whatever children it holds.
composes_with: [Button, Input, NavItem, Stack (can wrap a Row), any content component]
aliases: [row, hstack, horizontal, inline, horizontal layout]
---

\`\`\`jsx
// Button group — justify="end" pushes the group to the right.
<Row gap="sm" justify="end">
  <Button variant="ghost">Cancel</Button>
  <Button>Save</Button>
</Row>
\`\`\``;

export default function StudioHowItWorksPage() {
  return (
    <div className="space-y-10">
      {/* Hook */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          How Studio works
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Every component in Grade ships with a small Markdown sidecar that
          teaches both humans and language models what the component is,
          when to reach for it, and what props it takes. Those sidecars
          drive the Studio chat, the in-preview targeted edits, and the
          Grade MCP server. One file per component. One source of truth.
        </p>
      </div>

      {/* Sales piece — why this works */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Why it lands
        </h2>
        <p className="leading-7">
          Most design systems are documented for humans and then translated
          by hand into prompts, examples, and screenshots whenever someone
          wants an LLM to use them. The translation is brittle — it drifts
          from the source, it bloats every prompt with the full catalog,
          and it never quite covers the 10% of generation where the model
          reaches for raw Tailwind instead of the DS. Grade closes that gap
          by treating model-facing documentation as a first-class artifact
          colocated with the component.
        </p>
        <p className="leading-7">
          Four properties make this work:
        </p>

        <div className="space-y-4 pl-1">
          <div>
            <h3 className="text-lg font-semibold">Single source of truth</h3>
            <p className="leading-7 text-muted-foreground">
              A component&apos;s <Tok>.md</Tok> sidecar lives next to its{" "}
              <Tok>.tsx</Tok> source. When the code changes the sidecar
              changes in the same commit, so the Studio, the human docs
              site, and (soon) the MCP server never see a stale schema.
              The .md file is the documentation — not a derived artifact.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Lazy retrieval</h3>
            <p className="leading-7 text-muted-foreground">
              Every chat turn scans the conversation, picks out which
              components are actually in play, and pastes only those
              sidecars into the system prompt. A fresh &ldquo;make me a
              login form&rdquo; ships Button, Input, Label, Card —{" "}
              <em>not</em> the full catalog. Follow-up prompts add
              components as the user asks for them. Typical turn carries
              800–1500 tokens of DS context instead of the 2k+ a
              front-loaded catalog would cost.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Pinned structural grammar</h3>
            <p className="leading-7 text-muted-foreground">
              Layout primitives —{" "}
              <Tok>Stack</Tok>, <Tok>Row</Tok>, <Tok>Grid</Tok>,{" "}
              <Tok>Flex</Tok> — are pinned to <em>every</em> turn regardless
              of retrieval. Users almost never say &ldquo;stack&rdquo; or
              &ldquo;row&rdquo; out loud, so retrieval alone wouldn&apos;t
              fire, and the model would fall back to hand-rolling{" "}
              <Tok>flex flex-col gap-2</Tok>. Pinning the refs + a short
              before/after section in the system prompt shifted output
              from raw utilities to DS primitives in a single deploy.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Targeted edits from the preview</h3>
            <p className="leading-7 text-muted-foreground">
              Every DS component stamps a <Tok>data-gds-part</Tok>{" "}
              attribute on its root. Clicking any rendered element in the
              Studio preview walks up the DOM, finds the nearest DS part,
              and ships a selection marker on the next request.
              The server wraps that marker in a &ldquo;find this JSX node
              and modify it in place&rdquo; stanza, so the model edits
              exactly the component the user pointed at — no guessing
              which div they meant.
            </p>
          </div>
        </div>

        <p className="leading-7">
          The cumulative effect: the Studio can generate a login form, a
          stat dashboard, or an app shell with correct DS components
          first-try, and iterating on &ldquo;make this button bigger&rdquo;
          actually edits <em>that</em> button. Adding a new component is
          a .md file and a changeset — the chat experience updates with
          the same publish that ships the code.
        </p>
      </section>

      {/* Sidecar format */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          The sidecar format
        </h2>
        <p className="leading-7">
          Each component has a sidecar at{" "}
          <Tok>apps/docs/components/ui/&lt;name&gt;.md</Tok>. The file is
          standard Markdown with a YAML frontmatter block followed by one
          or more fenced JSX examples. Both halves matter: the frontmatter
          is machine-readable (props, aliases, when-to-use), and the
          examples are lifted verbatim into the system prompt so the model
          sees idiomatic usage alongside the schema.
        </p>

        <h3 className="text-lg font-semibold">Frontmatter fields</h3>
        <div className="leading-7 text-muted-foreground">
          <p>
            <Tok>name</Tok> — canonical PascalCase component identifier.
            This is what the retrieval regex matches against in
            conversation text.
          </p>
          <p>
            <Tok>import</Tok> — the import path the model should write.
            Almost always <Tok>&quot;@gradeui/ui&quot;</Tok>.
          </p>
          <p>
            <Tok>role</Tok> — semantic category.{" "}
            <Tok>layout</Tok> flags layout primitives (Stack, Row, Grid,
            Flex, AppShell). Other roles used today:{" "}
            <Tok>form</Tok>,{" "}
            <Tok>feedback</Tok>,{" "}
            <Tok>media</Tok>. The role gets used for categorisation in
            the future Studio settings panel.
          </p>
          <p>
            <Tok>props</Tok> — a bulleted list of props with type, default,
            and a one-line description. Written as tiny TypeScript-flavored
            pseudosyntax so the model can infer the shape without us
            parsing it.
          </p>
          <p>
            <Tok>when_to_use</Tok> — prose description of when to reach
            for this component. This is the most important field — it
            steers the model toward the right choice in ambiguous cases
            and often contains anti-pattern callouts (&ldquo;reach for Row
            instead of <Tok>flex items-center gap-*</Tok>&rdquo;).
          </p>
          <p>
            <Tok>composes_with</Tok> — list of components that typically
            compose with this one. Hints at idiomatic combinations.
          </p>
          <p>
            <Tok>aliases</Tok> — informal synonyms the user might mention.
            Stack&apos;s aliases include &ldquo;vstack&rdquo;,{" "}
            &ldquo;vertical&rdquo;, &ldquo;column&rdquo;. Retrieval matches
            aliases too, so a user saying &ldquo;vertical stack of
            fields&rdquo; pulls Stack&apos;s ref without saying
            &ldquo;Stack&rdquo;.
          </p>
          <p>
            <Tok>subcomponents</Tok> — sub-exports like{" "}
            <Tok>[CardHeader, CardContent, CardFooter]</Tok>. A mention of
            any subcomponent retrieves the parent&apos;s sidecar, so
            &ldquo;CardHeader&rdquo; pulls in the full Card reference.
          </p>
        </div>

        <h3 className="text-lg font-semibold">Worked example: Row</h3>
        <p className="leading-7 text-muted-foreground">
          The sidecar for the Row layout primitive, in full:
        </p>
        <CodeBlock>{ROW_SIDECAR_EXAMPLE}</CodeBlock>
      </section>

      {/* The pipeline */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          The pipeline
        </h2>
        <p className="leading-7">
          A chat turn in Studio moves through five distinct layers. Each
          one owns a specific transformation — keeping the boundaries
          sharp is why the system stays debuggable as it grows.
        </p>

        <CodeBlock>{`  user prompt + selection
          │
          ▼
  [1]  buildSystemPrompt()             apps/docs/app/studio/page.tsx
          │   rules + LAYOUT PRIMITIVES block
          ▼
  [2]  useChat → POST /api/chat        apps/docs/components/studio/studio-chat.tsx
          │
          ▼
  [3]  server composition              apps/docs/app/api/chat/route.ts
          │   system = systemPrompt + refsBlock + selectionBlock
          │      ├─ refsBlock:  relevantComponentNames + PINNED
          │      └─ selectionBlock: targeted-edit stanza
          ▼
  [4]  streamText (AI SDK)             provider of choice
          │
          ▼
  [5]  Sandpack preview                apps/docs/lib/chat-sandpack.ts
              iframe installs @gradeui/ui from npm, renders JSX,
              postMessages selection events back on click`}</CodeBlock>

        <h3 className="text-lg font-semibold">[1] The client system prompt</h3>
        <p className="leading-7 text-muted-foreground">
          Built once per page-load in{" "}
          <Tok>buildSystemPrompt()</Tok>. Ten numbered OUTPUT RULES
          (respond with a sentence + one fenced jsx block, import from the
          @gradeui/ui barrel, use only allowlisted components, etc.)
          followed by the LAYOUT PRIMITIVES section with concrete{" "}
          <Tok>flex…</Tok> → <Tok>&lt;Row…&gt;</Tok> mappings. The
          ALLOWED_COMPONENTS list is inlined so the model sees exactly
          what&apos;s available.
        </p>

        <h3 className="text-lg font-semibold">[2] Chat UI → /api/chat</h3>
        <p className="leading-7 text-muted-foreground">
          <Tok>studio-chat.tsx</Tok> wraps the AI SDK&apos;s{" "}
          <Tok>useChat</Tok> hook. Each send ships the message history,
          the active provider + model, any BYOK API key, the system
          prompt, and — when the user has clicked the &ldquo;Select&rdquo;
          tool in the preview — the selection payload.
        </p>

        <h3 className="text-lg font-semibold">[3] Server composition</h3>
        <p className="leading-7 text-muted-foreground">
          The system message that actually reaches the model is three
          blocks joined with blank lines: the client-built rules +
          layout section, the component-refs block, and (optionally) the
          selection block. The refs block is where the interesting
          stitching happens:
        </p>
        <CodeBlock>{`const relevant = Array.from(new Set([
  // Always-on structural grammar — pinned regardless of retrieval.
  ...PINNED_COMPONENTS.filter(inAllowlist),
  // Lazy retrieval — pulls in whatever matches the conversation.
  ...relevantComponentNames(textFromMessages(messages)).filter(inAllowlist),
]));
const refsBlock = renderComponentRefsBlock({ onlyFor: relevant });`}</CodeBlock>
        <p className="leading-7 text-muted-foreground">
          <Tok>relevantComponentNames</Tok> regex-matches each sidecar&apos;s{" "}
          <Tok>name</Tok> + <Tok>subcomponents</Tok> +{" "}
          <Tok>aliases</Tok> against the full conversation text,
          word-boundary, case-insensitive, with a lightweight plural
          suffix. Aliases are sorted longest-first so{" "}
          <Tok>CardHeader</Tok> matches before{" "}
          <Tok>Card</Tok>.{" "}
          <Tok>renderComponentRefsBlock</Tok> then reads each matched
          component&apos;s .md, strips frontmatter into a compact
          one-line-per-field format, and emits a Markdown block the model
          reads like documentation.
        </p>

        <h3 className="text-lg font-semibold">[4] Targeted edits</h3>
        <p className="leading-7 text-muted-foreground">
          When the user clicks an element in the preview with the Select
          tool active, the Sandpack iframe walks up the DOM to the
          nearest <Tok>[data-gds-part]</Tok>, derives the owning DS
          component name, and postMessages the element&apos;s{" "}
          <Tok>outerHTML</Tok> + the PascalCase component identifier to
          the parent. On the next send,{" "}
          <Tok>renderSelectionBlock</Tok> wraps that payload in a{" "}
          &ldquo;TARGETED EDIT — find the matching{" "}
          <Tok>&lt;ComponentName&gt;</Tok> JSX and modify its props
          in place&rdquo; stanza. The model edits <em>that</em> instance
          instead of rewriting the whole composition.
        </p>

        <h3 className="text-lg font-semibold">[5] Sandpack</h3>
        <p className="leading-7 text-muted-foreground">
          <Tok>chat-sandpack.ts</Tok> builds an iframe file tree — fake{" "}
          <Tok>package.json</Tok>, Tailwind config, index.html, and a{" "}
          <Tok>/App.tsx</Tok> slot for the model&apos;s output. The
          iframe installs <Tok>@gradeui/ui</Tok> from npm at a pinned
          version (bumped in lockstep with minor releases), so previews
          run against the real published package — same code a consumer
          would get. A small in-iframe agent listens for clicks when the
          Select tool is active and handles the postMessage handshake.
        </p>
      </section>

      {/* Authoring */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Adding an AI-ready component
        </h2>
        <p className="leading-7">
          A new component needs five things to show up end-to-end in the
          Studio. None of them are optional, but together they take
          maybe 15 minutes.
        </p>

        <ol className="list-decimal list-inside space-y-3 leading-7 pl-1">
          <li>
            <strong>The component itself</strong> —{" "}
            <Tok>packages/ui/components/ui/&lt;name&gt;.tsx</Tok>{" "}
            plus the docs mirror at{" "}
            <Tok>apps/docs/components/ui/&lt;name&gt;.tsx</Tok>. Stamp{" "}
            <Tok>data-gds-part=&quot;&lt;name&gt;&quot;</Tok> on the root
            so targeted edits can find it.
          </li>
          <li>
            <strong>The sidecar</strong> —{" "}
            <Tok>apps/docs/components/ui/&lt;name&gt;.md</Tok> with the
            frontmatter fields above and at least one{" "}
            <Tok>```jsx</Tok> example. Pick aliases that match how a user
            would describe the component out loud — this is what makes
            retrieval fire.
          </li>
          <li>
            <strong>Allowlist + catalog</strong> — add the name to{" "}
            <Tok>ALLOWED_COMPONENTS</Tok> in{" "}
            <Tok>apps/docs/lib/chat-sandpack.ts</Tok> so Studio will emit
            it, plus <Tok>componentsList</Tok> in{" "}
            <Tok>apps/docs/lib/components-list.ts</Tok> and the nav in{" "}
            <Tok>apps/docs/components/docs-sidebar.tsx</Tok> so the human
            docs pick it up.
          </li>
          <li>
            <strong>A doc page</strong> —{" "}
            <Tok>apps/docs/app/components/&lt;name&gt;/page.tsx</Tok> with
            the usual header + usage + props table + composition demos.
          </li>
          <li>
            <strong>A changeset</strong> —{" "}
            <Tok>pnpm changeset</Tok> with a minor bump and a one-line
            changelog entry. The release bot handles npm publish.
          </li>
        </ol>

        <p className="leading-7 text-muted-foreground">
          If the component is structurally universal (the model would want
          it on most turns even when the user doesn&apos;t name it),
          consider adding it to{" "}
          <Tok>PINNED_COMPONENTS</Tok> in the chat route. Pin sparingly —
          every pinned component pays token cost on every turn. Today
          only the four layout primitives are pinned.
        </p>
      </section>

      {/* What's next */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          What&apos;s next
        </h2>
        <p className="leading-7">
          The sidecars are authored once and consumed by an expanding set
          of surfaces. Three upcoming consumers:
        </p>

        <div className="space-y-3 pl-1">
          <div>
            <h3 className="text-lg font-semibold">@gradeui/mcp</h3>
            <p className="leading-7 text-muted-foreground">
              An MCP server exposing the same sidecar knowledge base as
              tools and resources. Drop it into Claude Desktop, Cursor,
              Windsurf, or any MCP-capable client, and the assistant
              there gains the same Grade vocabulary the Studio has —
              outside the Studio, in the user&apos;s own editor or chat.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Reference layout corpus</h3>
            <p className="leading-7 text-muted-foreground">
              Hand-authored idiomatic compositions — dashboard, marketing
              page, settings form — retrievable by prompt shape. When a
              user says &ldquo;build me a dashboard&rdquo; the retriever
              pulls in the matching reference as a worked example
              alongside the component refs.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Starter compositions in templates</h3>
            <p className="leading-7 text-muted-foreground">
              The Studio template drawer currently seeds a chat with a
              prompt. Graduating templates to seed with both a prompt{" "}
              <em>and</em> the reference JSX lets the user&apos;s first{" "}
              &ldquo;make it more X&rdquo; iteration riff against real
              structure instead of starting blank.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
