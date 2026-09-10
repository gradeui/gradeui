import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** The voice notes behind the Insights layer: what it is, how it talks,
 *  and how to give feedback. Renders notes/beacon-voice.md. */
export default async function BeaconNotesPage() {
  const md = await readFile(path.join(process.cwd(), "notes", "beacon-voice.md"), "utf8");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm"><Link href="/docs" className="hover:underline">Docs</Link></p>
        <h1 className="text-heading-page">How Insights writes</h1>
        <p className="text-body text-muted-foreground max-w-prose">
          Insights writes the summaries and plans from your own reviews. Every number links to the reviews behind it, and we want to hear where it gets the tone or the advice wrong. Leave a comment on any page with the toolbar, or tell us in the Cmd K menu under Page notes.
        </p>
      </div>
      <div className="prose-bl text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
      </div>
    </div>
  );
}
