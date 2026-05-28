/**
 * /docs/studio/how-it-works — the "Inside the Studio pipeline" page.
 *
 * Dual-purpose: (1) reference material for anyone extending the DS — what
 * the .md sidecars are, what shape they take, where the values land. (2) A
 * narrative pitch for why an AI-native design system lands differently
 * than a conventional one. Written in a tone that can be lifted wholesale
 * into a blog post or external writeup.
 *
 * Last refreshed May 2026: Fast Frame as the default renderer (Sandpack is
 * now the parity-check path); contracts system added; prose body pinning
 * (Fix A); contract-backed JSX validator (Fix B); allow-list moved into the
 * @gradeui/studio playbook.
 */

// Small helper for block code samples — matches the visual treatment used
// on the Installation sections of the component doc pages.
function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gds-gray-100 dark:bg-gds-gray-800 border border-gds-gray-200 dark:border-transparent p-4 font-mono text-sm text-gds-gray-900 dark:text-white overflow-x-auto">
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
subcomponents: []
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
  through the settings panel.
composes_with: [Button, Input, Stack (can wrap a Row), any content component]
aliases: [row, hstack, h-stack, horizontal, inline, horizontal layout, lazyhstack]
---

\`\`\`jsx
// Button group — justify="end" pushes the group to the right.
<Row gap="sm" justify="end">
  <Button variant="ghost">Cancel</Button>
  <Button>Save</Button>
</Row>
\`\`\`

### Anti-patterns

DO NOT add \`flex flex-row\` to className — Row already applies it.
DO NOT reach for inline \`justify-end\` on className — use the \`justify\`
prop so the settings panel can mutate it.`;

const CONTRACT_EXAMPLE = `// AUTO-GENERATED from row.md by scripts/generate-contracts.mjs.
// The sidecar is the source of truth; the contract is its typed projection.
import { z } from "zod";
import { contract } from "@gradeui/contracts";

export const RowContract = contract({
  name: "Row",
  description: "Horizontal composition...",
  import: "@gradeui/ui",
  aliases: ["row", "hstack", "h-stack", "horizontal", ...],
  props: {
    gap: {
      schema: z.enum(["none", "xs", "sm", "md", "lg", "xl", "2xl"]).optional(),
      design: "knob",
      description: "Inter-child spacing",
      default: "md",
    },
    justify: {
      schema: z.enum(["start", "center", "end", "between", "around", "evenly"]).optional(),
      design: "knob",
      description: "Main-axis distribution",
      default: "start",
    },
    // …
  },
});`;

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
          when to reach for it, and what props it takes — plus a Zod-backed
          contract that lets us validate the output. Those two artefacts
          drive the Studio chat, the in-preview targeted edits, the docs
          site, and (soon) the Grade MCP server. One source of truth per
          component, three downstream consumers, no drift.
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
          by treating model-facing documentation as a first-class artefact
          colocated with the component.
        </p>
        <p className="leading-7">
          Five properties make this work:
        </p>

        <div className="space-y-4 pl-1">
          <div>
            <h3 className="text-lg font-semibold">Single source of truth</h3>
            <p className="leading-7 text-muted-foreground">
              A component&apos;s <Tok>.md</Tok> sidecar lives next to its{" "}
              <Tok>.tsx</Tok> source, with a typed{" "}
              <Tok>.contract.ts</Tok> auto-generated from the .md alongside.
              When the code changes the sidecar changes in the same commit,
              and the contract regenerates on prebuild — so Studio, the
              docs site, and (soon) the MCP server never see a stale
              schema. The .md file IS the documentation, the contract IS
              the runtime type — neither is a derived artefact you have
              to remember to update.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Lazy retrieval (with canonical examples)</h3>
            <p className="leading-7 text-muted-foreground">
              Every chat turn scans the conversation, picks out which
              components are actually in play, and pastes only those
              sidecars into the system prompt. A fresh &ldquo;make me a
              login form&rdquo; ships Button, Input, Label, Card —{" "}
              <em>not</em> the full catalog. The pinned ref isn&apos;t just
              a prop list either: the sidecar&apos;s JSX example block and
              its <Tok>### Anti-patterns</Tok> section get pinned verbatim,
              so the model sees the canonical composition (compound
              subcomponent ordering, required wrappers, DO-NOT lines) rather
              than guessing it from training data. Typical turn carries
              1.5k–3k tokens of DS context — a fraction of the 200k window
              and worth it for the hallucination drop.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Pinned structural grammar</h3>
            <p className="leading-7 text-muted-foreground">
              Layout primitives —{" "}
              <Tok>Stack</Tok>, <Tok>Row</Tok>, <Tok>Grid</Tok>,{" "}
              <Tok>Flex</Tok>, <Tok>AppShell</Tok> — are pinned to{" "}
              <em>every</em> turn regardless of retrieval. Users almost
              never say &ldquo;stack&rdquo; or &ldquo;row&rdquo; out loud,
              so retrieval alone wouldn&apos;t fire, and the model would
              fall back to hand-rolling <Tok>flex flex-col gap-2</Tok>.
              Pinning the refs + a short before/after section in the
              system prompt shifted output from raw utilities to DS
              primitives in a single deploy.
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

          <div>
            <h3 className="text-lg font-semibold">Contract-validated output</h3>
            <p className="leading-7 text-muted-foreground">
              Once the model finishes streaming, the emitted JSX is parsed
              and every <Tok>&lt;Component prop=…/&gt;</Tok> call is
              validated against the typed contract. Unknown props, invalid
              enum values, missing required props all surface as
              structured violations with source locations. The validator
              runs server-side in <Tok>/api/chat</Tok> and logs to the
              server today; surfacing violations back into the chat UI is
              the next step. It catches what the prose body pinning
              doesn&apos;t prevent — the gap between &ldquo;the model saw
              the example&rdquo; and &ldquo;the model wrote the right
              code.&rdquo;
            </p>
          </div>
        </div>

        <p className="leading-7">
          The cumulative effect: the Studio can generate a login form, a
          stat dashboard, or an app shell with correct DS components
          first-try, and iterating on &ldquo;make this button bigger&rdquo;
          actually edits <em>that</em> button. Adding a new component is
          a .md file + a regenerate command + a changeset — the chat
          experience updates with the same publish that ships the code.
        </p>
      </section>

      {/* Sidecar format */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          The sidecar format
        </h2>
        <p className="leading-7">
          Each component has a sidecar at{" "}
          <Tok>packages/ui/components/ui/&lt;name&gt;.md</Tok>, right next
          to its <Tok>.tsx</Tok> source. The file is standard Markdown
          with a YAML frontmatter block followed by one or more fenced
          JSX examples and (optionally) a <Tok>### Anti-patterns</Tok>{" "}
          section. <em>Both halves matter</em>: the frontmatter is
          machine-readable (props, aliases, when-to-use), and the prose
          body is lifted verbatim into the system prompt so the model
          sees the canonical composition + DO-NOT rules alongside the
          schema.
        </p>

        <h3 className="text-lg font-semibold">Frontmatter fields</h3>
        <div className="leading-7 text-muted-foreground space-y-2">
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
            <Tok>subcomponents</Tok> — sub-exports the model should import
            alongside (<Tok>[CardHeader, CardContent, CardFooter]</Tok>).
            A mention of any subcomponent retrieves the parent&apos;s
            sidecar, so &ldquo;CardHeader&rdquo; pulls in the full Card
            reference.
          </p>
          <p>
            <Tok>variants</Tok> /{" "}
            <Tok>sizes</Tok> — discrete option lists for CVA-style
            variant slots. The model sees these as &ldquo;allowed
            values&rdquo; and the contracts generator turns them into Zod
            enums for runtime validation.
          </p>
          <p>
            <Tok>props</Tok> — bulleted list of props with type, default,
            and a one-line description. Written as tiny
            TypeScript-flavored pseudosyntax so the model can infer the
            shape without us parsing it. The contracts generator parses
            this list into the typed schema.
          </p>
          <p>
            <Tok>when_to_use</Tok> — prose description of when to reach
            for this component. The most important field — it steers the
            model toward the right choice in ambiguous cases and often
            contains anti-pattern callouts (&ldquo;reach for Row instead
            of <Tok>flex items-center gap-*</Tok>&rdquo;).
          </p>
          <p>
            <Tok>composes_with</Tok> — list of components that typically
            compose with this one. Hints at idiomatic combinations.
          </p>
          <p>
            <Tok>aliases</Tok> — informal synonyms the user might
            mention. Each component carries aliases drawn from web /
            shadcn convention, Apple HIG, React Native, and SwiftUI, so a
            designer working across mobile + web can describe the
            component in any of those vocabularies and retrieval still
            fires. Stack&apos;s aliases include &ldquo;vstack&rdquo;,{" "}
            &ldquo;vertical stack&rdquo;,{" "}
            &ldquo;lazyvstack&rdquo;.
          </p>
        </div>

        <h3 className="text-lg font-semibold">Body (pinned to the model)</h3>
        <p className="leading-7 text-muted-foreground">
          Everything after the closing <Tok>---</Tok> fence — the
          canonical JSX example(s) and the <Tok>### Anti-patterns</Tok>{" "}
          section. When the sidecar wins retrieval, this body gets pinned
          to the system prompt verbatim under a labelled{" "}
          &ldquo;Example &amp; anti-patterns for &lt;Component&gt; ↓&rdquo;{" "}
          marker. The model is told upfront to read the example block
          before emitting JSX and to treat <Tok>DO NOT</Tok> lines as
          hard rules.
        </p>

        <h3 className="text-lg font-semibold">Worked example: Row</h3>
        <p className="leading-7 text-muted-foreground">
          The full sidecar for the Row layout primitive — both halves:
        </p>
        <CodeBlock>{ROW_SIDECAR_EXAMPLE}</CodeBlock>
      </section>

      {/* Contracts */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Contracts — the typed projection
        </h2>
        <p className="leading-7">
          Each sidecar has a sibling{" "}
          <Tok>&lt;name&gt;.contract.ts</Tok> that&apos;s auto-generated
          from the .md by <Tok>scripts/generate-contracts.mjs</Tok>. The
          contract is the typed projection of the sidecar — same data,
          machine-checkable shape. Three things consume it:
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-1 leading-7 text-muted-foreground">
          <li>
            <strong>Studio&apos;s settings panel</strong> — reads{" "}
            <Tok>contract.props[name].design</Tok> to decide which control
            to render per prop (knob → Switch/Select/ToggleGroup, content →
            Input, plumbing → hidden).
          </li>
          <li>
            <strong>The JSX validator</strong> —{" "}
            <Tok>apps/docs/lib/qa/validate-jsx.ts</Tok> walks the
            model&apos;s output, calls{" "}
            <Tok>contract.props[name].schema.safeParse(value)</Tok> on
            every used prop, and reports unknown props / invalid enum
            values / missing required props.
          </li>
          <li>
            <strong>The component&apos;s own TS types</strong> — eventually
            via <Tok>type Props = InferProps&lt;typeof Contract&gt;</Tok>{" "}
            on the consuming component, so the React API type IS the
            contract&apos;s projection. MediaSurface uses this today;
            other components will migrate.
          </li>
        </ol>
        <CodeBlock>{CONTRACT_EXAMPLE}</CodeBlock>
        <p className="leading-7 text-muted-foreground">
          Hand-authored contracts (Carousel, MediaSurface — anything with
          discriminated-union props or imperative actions) are preserved
          by the generator on every run via a{" "}
          <Tok>// AUTO-GENERATED</Tok> marker check.
        </p>
      </section>

      {/* The pipeline */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          The pipeline
        </h2>
        <p className="leading-7">
          A chat turn in Studio moves through six distinct layers. Each
          one owns a specific transformation — keeping the boundaries
          sharp is why the system stays debuggable as it grows.
        </p>

        <CodeBlock>{`  user prompt + selection
          │
          ▼
  [1]  buildSystemPrompt()             packages/studio/src/playbook/prompts/system.ts
          │   rules + LAYOUT PRIMITIVES block
          │   ALLOWED_COMPONENTS injected from the playbook allowlist
          ▼
  [2]  useChat → POST /api/chat        apps/docs/components/studio/studio-chat.tsx
          │
          ▼
  [3]  server composition              apps/docs/app/api/chat/route.ts
          │   system = systemPrompt + refsBlock + selectionBlock
          │      ├─ refsBlock:  relevantComponentNames + PINNED_COMPONENTS
          │      │              (formats frontmatter + pins prose body
          │      │               verbatim — Fix A, May 2026)
          │      └─ selectionBlock: targeted-edit stanza
          ▼
  [4]  streamText (AI SDK)             provider of choice
          │
          ▼
  [5]  Fast Frame preview              apps/docs/app/fast-sandbox/page.tsx
          │   eager-imports * from @gradeui/ui at build time;
          │   sucrase-compiles model JSX inside the iframe;
          │   resolves imports against the pre-loaded namespaces.
          │   No npm fetch per turn; no Sandpack round-trip.
          ▼
  [6]  Validator pass                  apps/docs/lib/qa/validate-jsx.ts
              On streamText.onFinish: extract the fenced jsx block,
              walk every <Component> against COMPONENT_CONTRACTS,
              log unknown props / invalid enums / missing required
              props server-side. Surfacing into the chat UI is the
              next step.`}</CodeBlock>

        <h3 className="text-lg font-semibold">[1] The base system prompt</h3>
        <p className="leading-7 text-muted-foreground">
          Built once in{" "}
          <Tok>buildSystemPrompt()</Tok> in{" "}
          <Tok>packages/studio/src/playbook/prompts/system.ts</Tok>. Ten
          numbered OUTPUT RULES (respond with a sentence + one fenced jsx
          block, import from the @gradeui/ui barrel, use only
          allowlisted components, etc.) followed by the LAYOUT PRIMITIVES
          section with concrete <Tok>flex…</Tok> → <Tok>&lt;Row…&gt;</Tok>{" "}
          mappings. The <Tok>ALLOWED_COMPONENTS</Tok> list (now in{" "}
          <Tok>packages/studio/src/playbook/components/allowlist.ts</Tok>)
          is inlined so the model sees exactly what&apos;s available.
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
          suffix.{" "}
          <Tok>renderComponentRefsBlock</Tok> then formats each matched
          component&apos;s sidecar — frontmatter fields as a compact
          one-line-per-field block, followed by the full prose body
          (JSX example + anti-patterns) under a labelled section. That
          last part is Fix A: previously the body only rendered to
          humans on the docs page; now the model sees the canonical
          composition verbatim, which closed the &ldquo;guessed
          props&rdquo; failure mode for compound components like Carousel
          and MultiSelect.
        </p>

        <h3 className="text-lg font-semibold">[4] Targeted edits</h3>
        <p className="leading-7 text-muted-foreground">
          When the user clicks an element in the preview with the Select
          tool active, the iframe walks up the DOM to the nearest{" "}
          <Tok>[data-gds-part]</Tok>, derives the owning DS component
          name, and postMessages the element&apos;s <Tok>outerHTML</Tok>{" "}
          + the PascalCase component identifier to the parent. On the
          next send, <Tok>renderSelectionBlock</Tok> wraps that payload
          in a &ldquo;TARGETED EDIT — find the matching{" "}
          <Tok>&lt;ComponentName&gt;</Tok> JSX and modify its props in
          place&rdquo; stanza. The model edits <em>that</em> instance
          instead of rewriting the whole composition.
        </p>

        <h3 className="text-lg font-semibold">[5] Fast Frame</h3>
        <p className="leading-7 text-muted-foreground">
          Studio&apos;s preview is{" "}
          <Tok>apps/docs/app/fast-sandbox/page.tsx</Tok> — a normal Next
          route mounted in an iframe by{" "}
          <Tok>components/studio/fast-frame.tsx</Tok>. It eager-imports
          the entire <Tok>@gradeui/ui</Tok> namespace plus{" "}
          <Tok>lucide-react</Tok>, <Tok>recharts</Tok>, etc. at build
          time. When the model emits JSX, sucrase compiles it inside the
          iframe and any <Tok>import</Tok> paths the snippet uses get
          resolved against those pre-loaded namespaces. No npm fetch per
          compile, no Sandpack round-trip — first page load is one Next
          chunk; subsequent compiles are instant.
        </p>
        <p className="leading-7 text-muted-foreground">
          The Sandpack-based renderer still exists (<Tok>sandpack-frame.tsx</Tok>)
          as a parity check — flip the renderer over when something
          looks suspicious in Fast Frame to confirm the bug reproduces
          against a real <Tok>npm install @gradeui/ui</Tok>. Not the
          default path, not deleted on purpose.
        </p>

        <h3 className="text-lg font-semibold">[6] Validator pass</h3>
        <p className="leading-7 text-muted-foreground">
          On <Tok>streamText.onFinish</Tok>, the chat route extracts the
          fenced jsx block from the response and runs{" "}
          <Tok>validateJsx(jsx, {`{ contracts: COMPONENT_CONTRACTS }`})</Tok>.
          The validator parses the JSX with the TypeScript compiler API,
          walks every <Tok>&lt;Component prop=…/&gt;</Tok>, looks up the
          contract from the registry, and validates each used prop
          against the Zod schema. Output is structured (severity + kind +
          component/prop + source location) and logged server-side as
          a one-liner per violation. Fix B is the safety net for what
          Fix A doesn&apos;t prevent — the model still drifts sometimes,
          and the validator catches it before the consumer does.
        </p>
      </section>

      {/* Authoring */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Adding an AI-ready component
        </h2>
        <p className="leading-7">
          A new component needs six things to show up end-to-end in the
          Studio. None of them are optional, but together they take
          maybe 20 minutes.
        </p>

        <ol className="list-decimal list-inside space-y-3 leading-7 pl-1">
          <li>
            <strong>The component itself</strong> —{" "}
            <Tok>packages/ui/components/ui/&lt;name&gt;.tsx</Tok>{" "}
            plus the docs mirror at{" "}
            <Tok>apps/docs/components/ui/&lt;name&gt;.tsx</Tok>. Stamp{" "}
            <Tok>data-gds-part=&quot;&lt;name&gt;&quot;</Tok> on the root
            so targeted edits can find it. Use semantic theme tokens
            (<Tok>bg-card</Tok>, <Tok>text-foreground</Tok>,{" "}
            <Tok>border-border</Tok>) and expose sizing knobs as{" "}
            <Tok>--gds-&lt;name&gt;-*</Tok> CSS variables.
          </li>
          <li>
            <strong>The sidecar</strong> —{" "}
            <Tok>packages/ui/components/ui/&lt;name&gt;.md</Tok> next to
            the <Tok>.tsx</Tok>, with the frontmatter fields above plus
            at least one <Tok>```jsx</Tok> example and (strongly
            recommended) an <Tok>### Anti-patterns</Tok> section. Pick
            aliases that span web/HIG/RN vocabularies so retrieval fires
            no matter how the user describes the component.
          </li>
          <li>
            <strong>The contract</strong> — auto-generated by{" "}
            <Tok>pnpm -F @gradeui/ui generate:contracts</Tok>. For
            components with discriminated-union props, imperative
            actions, or unusual control kinds (glyph picker, colour
            picker), hand-author the contract and the generator will
            preserve it via the{" "}
            <Tok>// AUTO-GENERATED</Tok> marker check. MediaSurface and
            Carousel are the worked examples.
          </li>
          <li>
            <strong>Allow-list + barrel + nav</strong> — add the name to{" "}
            <Tok>ALLOWED_COMPONENTS</Tok> in{" "}
            <Tok>packages/studio/src/playbook/components/allowlist.ts</Tok>{" "}
            so Studio will emit it, export it from{" "}
            <Tok>packages/ui/lib/index.ts</Tok>, and add it to{" "}
            <Tok>componentsList</Tok> in{" "}
            <Tok>apps/docs/lib/components-list.ts</Tok> + the nav in{" "}
            <Tok>apps/docs/components/docs-sidebar.tsx</Tok> so the human
            docs pick it up. Update{" "}
            <Tok>packages/ui/COMPONENTS.md</Tok> for the inventory.
          </li>
          <li>
            <strong>A doc page</strong> —{" "}
            <Tok>apps/docs/app/components/&lt;name&gt;/page.tsx</Tok> with
            the usual header + usage + props table + composition demos.
            The <Tok>&lt;SidecarBlock slug=&quot;&lt;name&gt;&quot; /&gt;</Tok>{" "}
            renders the .md file inline at the bottom so the prose stays
            in sync with what the model sees.
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
          <Tok>PINNED_COMPONENTS</Tok> in the playbook. Pin sparingly —
          every pinned component pays token cost on every turn. Today
          only the five layout primitives are pinned.
        </p>
      </section>

      {/* What's next */}
      <section className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          What&apos;s next
        </h2>
        <p className="leading-7">
          The sidecars + contracts are authored once and consumed by an
          expanding set of surfaces. Four upcoming consumers / refinements:
        </p>

        <div className="space-y-3 pl-1">
          <div>
            <h3 className="text-lg font-semibold">@gradeui/mcp</h3>
            <p className="leading-7 text-muted-foreground">
              An MCP server exposing the same playbook (sidecars +
              contracts + reference layouts) as tools and resources. Drop
              it into Claude Desktop, Cursor, Windsurf, or any
              MCP-capable client, and the assistant there gains the same
              Grade vocabulary the Studio has — outside the Studio, in
              the user&apos;s own editor or chat.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Validator → chat surface</h3>
            <p className="leading-7 text-muted-foreground">
              Today Fix B logs violations to the server. The next step is
              surfacing them as a small ⚠ chip on the assistant message
              with the count, click-to-expand the full list. The metadata
              channel that carries <Tok>usage</Tok> and <Tok>refs</Tok>{" "}
              already does this for token + ref data — the violations
              fit the same pipe.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Subcomponent contracts</h3>
            <p className="leading-7 text-muted-foreground">
              The validator skips <Tok>&lt;Carousel.Slide&gt;</Tok>-style
              compound calls today because their props don&apos;t live
              on the root contract. Splitting each compound component
              into per-subcomponent contracts lets the validator catch
              drift on subcomponent props too — at the cost of more
              contract files. A pragmatic middle ground: declare
              subcomponent prop maps inline on the root contract under
              a new <Tok>subcontracts</Tok> field.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Auto-rendered ComponentProps</h3>
            <p className="leading-7 text-muted-foreground">
              Replace the hand-authored{" "}
              <Tok>&lt;PropsTable /&gt;</Tok> on every component docs
              page with{" "}
              <Tok>&lt;ComponentProps contract={`{ButtonContract}`} /&gt;</Tok>{" "}
              that reads the registry directly. Docs update when the
              contract changes; no per-page maintenance.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
