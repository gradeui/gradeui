"use client";

/**
 * Composer docs page — interactive playground covering the four
 * shapes the component is designed for:
 *
 *   1. Plain text chat composer  (formats={false})
 *   2. Rich text comment composer (formats subset + toolbar)
 *   3. Mentions + slash commands  (triggers)
 *   4. Image attachments          (attachments)
 *   5. Scripted demo playback     (steps + trigger)
 *
 * Each section is self-contained so toggling one doesn't affect the
 * others. The "scripted demo" section uses `trigger="inView"` + `loop`
 * so scrolling to it triggers the playback automatically.
 */

import * as React from "react";
import { Composer } from "@/components/ui/composer";
import type {
  ComposerContent,
  ComposerHandle,
  ComposerStep,
} from "@/components/ui/composer";
import { RotateCcw } from "lucide-react";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

const TEAM_MEMBERS = [
  { id: "u1", value: "alice" },
  { id: "u2", value: "ben" },
  { id: "u3", value: "carolina" },
  { id: "u4", value: "dimitri" },
  { id: "u5", value: "eshe" },
];

const SLASH_COMMANDS = [
  { id: "c1", value: "image" },
  { id: "c2", value: "video" },
  { id: "c3", value: "code" },
  { id: "c4", value: "poll" },
  { id: "c5", value: "table" },
];

// Demo script — types a chat-style message with a mention. The
// select+format dance is parked for now because it leaves a non-
// collapsed selection that the next type step would replace — needs
// either an explicit deselect step or smarter selection-collapse in
// the format interpreter. Keeping the demo focused on what reads
// clearly: type, mention, submit.
const DEMO_SCRIPT: ComposerStep[] = [
  { type: "type", text: "Hey " },
  { type: "mention", trigger: "@", value: "alice", query: "ali" },
  {
    type: "type",
    text: ", quick question on the launch copy. Can we cut the second paragraph? It reads heavy on the page.",
  },
  { type: "wait", ms: 800 },
  { type: "submit" },
];

function SectionHeader({
  number,
  title,
  hint,
}: {
  number: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-mono text-muted-foreground">{number}</span>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function SubmittedOutput({ submitted }: { submitted: ComposerContent | null }) {
  if (!submitted) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Submit to see what onSubmit receives.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-xs">
        <span className="font-medium">text:</span>{" "}
        <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
          {submitted.text || "(empty)"}
        </code>
      </div>
      {submitted.mentions.length > 0 && (
        <div className="text-xs">
          <span className="font-medium">mentions:</span>{" "}
          {submitted.mentions.map((m, i) => (
            <code
              key={i}
              className="font-mono bg-muted px-1.5 py-0.5 rounded mr-1"
            >
              {m.trigger}
              {m.value}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComposerPage() {
  const [plainSubmitted, setPlainSubmitted] = React.useState<ComposerContent | null>(null);
  const [richSubmitted, setRichSubmitted] = React.useState<ComposerContent | null>(null);
  const [mentionSubmitted, setMentionSubmitted] = React.useState<ComposerContent | null>(null);
  const [attachSubmitted, setAttachSubmitted] = React.useState<{
    content: ComposerContent;
    fileCount: number;
  } | null>(null);

  // Ref for the scripted demo composer so the Replay button can
  // imperatively restart the playback.
  const demoRef = React.useRef<ComposerHandle>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Composer</h1>
        <p className="text-lg text-muted-foreground mt-2">
          The generic text composition surface. Plain text or rich, with mentions, slash commands, image attachments, and scripted demo playback. One primitive for AI chat, comments, post bodies, and copilot panels.
        </p>
      </div>

      {/* ── 01 Plain text ─────────────────────────────────────────── */}
      <div className="space-y-3 rounded-lg border border-border p-5">
        <SectionHeader
          number="01"
          title="Plain text"
          hint="formats={false} — half the bundle, no toolbar, no markup. The simplest chat input."
        />
        <Composer
          placeholder="Ask anything…"
          formats={false}
          autoFocus={false}
          onSubmit={(content) => setPlainSubmitted(content)}
        />
        <SubmittedOutput submitted={plainSubmitted} />
      </div>

      {/* ── 02 Rich text + toolbar ────────────────────────────────── */}
      <div className="space-y-3 rounded-lg border border-border p-5">
        <SectionHeader
          number="02"
          title="Rich text with toolbar"
          hint="Bold, italic, code, headings, blockquote, lists. Toolbar reads active formats from the editor selection."
        />
        <Composer
          placeholder="Write a comment… try **bold** or use the toolbar above."
          toolbar
          formats={[
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "code",
            "h2",
            "h3",
            "blockquote",
            "ul",
            "ol",
          ]}
          submitOnEnter={false}
          onSubmit={(content) => setRichSubmitted(content)}
          rightActions={
            <button
              type="button"
              onClick={() => {
                // No-op; this slot replaces the default Send. In real
                // hosts you would wire it to the same handler the
                // built-in button would call.
              }}
              className="text-xs text-muted-foreground"
            >
              Cmd+Enter or click in toolbar
            </button>
          }
        />
        <SubmittedOutput submitted={richSubmitted} />
      </div>

      {/* ── 03 Mentions + slash ──────────────────────────────────── */}
      <div className="space-y-3 rounded-lg border border-border p-5">
        <SectionHeader
          number="03"
          title="Mentions and slash commands"
          hint='Type "@" to tag a teammate or "/" for a command. Multiple trigger configs on one composer.'
        />
        <Composer
          placeholder="Try @alice or /poll"
          formats={false}
          triggers={[
            { char: "@", items: TEAM_MEMBERS },
            { char: "/", items: SLASH_COMMANDS, stripTrigger: true },
          ]}
          onSubmit={(content) => setMentionSubmitted(content)}
        />
        <SubmittedOutput submitted={mentionSubmitted} />
      </div>

      {/* ── 04 Attachments ───────────────────────────────────────── */}
      <div className="space-y-3 rounded-lg border border-border p-5">
        <SectionHeader
          number="04"
          title="Image attachments"
          hint="attachments={true} adds the paperclip + clipboard paste intake. Object URL lifecycle handled internally."
        />
        <Composer
          placeholder="Drop an image, paste from clipboard, or click the paperclip…"
          formats={false}
          attachments
          onSubmit={(content, atts) =>
            setAttachSubmitted({ content, fileCount: atts?.length ?? 0 })
          }
        />
        {attachSubmitted && (
          <div className="space-y-2">
            <SubmittedOutput submitted={attachSubmitted.content} />
            <div className="text-xs">
              <span className="font-medium">attachments:</span>{" "}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                {attachSubmitted.fileCount} file
                {attachSubmitted.fileCount === 1 ? "" : "s"}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* ── 05 Scripted demo ─────────────────────────────────────── */}
      <div className="space-y-3 rounded-lg border border-border p-5">
        <SectionHeader
          number="05"
          title="Scripted demo playback"
          hint="trigger='inView'. Types text, mentions, submits. Same step vocabulary as <Code>. Replay imperatively via ref."
        />
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => demoRef.current?.restart()}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Replay
          </button>
        </div>
        <Composer
          ref={demoRef}
          placeholder="Watch this fill itself in…"
          formats={false}
          triggers={[{ char: "@", items: TEAM_MEMBERS }]}
          steps={DEMO_SCRIPT}
          trigger="inView"
          speed="normal"
          readOnly
          onSubmit={() => {
            // No-op; the demo runs once and stops.
          }}
        />
        <InstallBlock>{`const DEMO_SCRIPT: ComposerStep[] = [
  { type: "type", text: "Hey " },
  { type: "mention", trigger: "@", value: "alice", query: "ali" },
  { type: "type", text: ", quick question on the launch copy. Can we cut the second paragraph? It reads heavy on the page." },
  { type: "wait", ms: 800 },
  { type: "submit" },
];

<Composer
  triggers={[{ char: "@", items: teamMembers }]}
  steps={DEMO_SCRIPT}
  trigger="inView"
  speed="normal"
  readOnly
/>`}</InstallBlock>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Features
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Lexical-backed rich text (bold, italic, underline, strike, code, h1/h2/h3, blockquote, pullquote, lists)</li>
          <li>Mentions and slash commands via lexical-beautiful-mentions, multiple trigger chars on one composer</li>
          <li>Image attachments with clipboard paste + paperclip intake (opt-in)</li>
          <li>Slot-based action row (leftActions / rightActions override the defaults)</li>
          <li>Scripted demo playback sharing the lib/demo step vocabulary with &lt;Code&gt;</li>
          <li>Plain text mode (formats=false) for the lightest possible chat input</li>
          <li>CSS-variable theme (--gds-composer-*) — rebrand without touching the component</li>
          <li>data-gds-part attributes on every internal element for headless theming</li>
          <li>ComposerHandle ref API: focus, clear, insert, getContent, getEditor (escape hatch)</li>
        </ul>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <InstallBlock>{`import { Composer, type ComposerContent } from "@gradeui/ui";

const [submitted, setSubmitted] = useState<ComposerContent | null>(null);

<Composer
  placeholder="Ask anything…"
  triggers={[
    { char: "@", items: teamMembers },
    { char: "/", items: commands, stripTrigger: true },
  ]}
  attachments
  onSubmit={(content, atts) => {
    sendToAssistant(content.text, content.mentions, atts?.map(a => a.file));
  }}
/>`}</InstallBlock>
      </div>

      {/* Dependencies */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Dependencies
        </h2>
        <InstallBlock>{`npm install lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/markdown @lexical/utils lexical-beautiful-mentions framer-motion lucide-react`}</InstallBlock>
      </div>

      <SidecarBlock slug="composer" />

      <ComponentNav currentHref="/components/composer" />
    </div>
  );
}
