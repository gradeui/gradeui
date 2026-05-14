/**
 * <SidecarBlock slug="button" /> — renders a component's sidecar (the
 * `<name>.md` file that lives next to its `.tsx` in `@gradeui/ui`) as a
 * code block at the bottom of the component's docs page.
 *
 * Pulls from the same `SIDECARS` inlined-string map that Studio's system
 * prompt uses — so what the human reader sees on the docs page IS what
 * the model sees in the prompt. Single source of truth across the AI
 * surface and the public-facing docs.
 *
 * Missing-sidecar behaviour: the section still renders with a dashed-
 * border placeholder explaining that the brief hasn't been authored yet.
 * Silently dropping the section made gaps invisible; the placeholder
 * tracks them publicly so they get filled in.
 */

import { SIDECARS } from "@gradeui/studio";

interface SidecarBlockProps {
  /** Kebab-case component slug — matches the .md filename, e.g. "button" → button.md. */
  slug: string;
  /**
   * Optional title override. Defaults to "Sidecar" since the section is
   * about the machine-readable doc the model consumes, not the component
   * itself.
   */
  title?: string;
}

export function SidecarBlock({ slug, title = "Sidecar" }: SidecarBlockProps) {
  const source = SIDECARS[`${slug}.md`]?.trimEnd() ?? null;

  return (
    // `min-w-0` is the critical bit — without it, the long lines inside
    // `<pre>` set the section's intrinsic width and the whole component
    // docs page balloons horizontally. With min-w-0 the container can
    // shrink below its content and the pre takes over with its own
    // scroll. `max-w-full` belt-and-braces for non-flex parents.
    <section className="space-y-4 min-w-0 max-w-full">
      <div className="space-y-2">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="leading-7 text-muted-foreground">
          The Markdown sidecar Studio (and the Grade MCP server, when it
          ships) reads to understand this component — frontmatter, when-
          to-use guidance, and canonical examples. Authored once at{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">
            packages/ui/components/ui/{slug}.md
          </code>{" "}
          and shipped inside the published @gradeui/ui tarball.
        </p>
      </div>

      {source ? (
        // `whitespace-pre-wrap` lets long lines wrap inside the panel
        // instead of pushing the page wider than the docs grid column.
        // The docs main grid track is `1fr` (not `minmax(0, 1fr)`), so a
        // `<pre>` with `whitespace-pre` would force the whole column —
        // and the body — to grow to its longest line. Wrapping is the
        // cheapest fix and keeps the markdown legible because the file
        // is naturally short-lined.
        <div className="rounded-lg border bg-muted/30 min-w-0 max-w-full">
          <pre className="p-4 text-sm leading-relaxed font-mono">
            <code className="block whitespace-pre-wrap break-words">{source}</code>
          </pre>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          <p>
            No sidecar authored yet for{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">
              {slug}
            </code>
            . The Markdown brief that Studio reads for AI-driven generation
            will live here once it lands.
          </p>
        </div>
      )}
    </section>
  );
}
