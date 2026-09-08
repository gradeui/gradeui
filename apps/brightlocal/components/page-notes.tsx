"use client";

/**
 * Page notes: the markdown README for the current route, rendered in a
 * DS Sheet. Opened from Cmd+K ("Page notes") or Cmd+. on any page.
 * Files live in notes/<route-with-dashes>.md; see notes/README.md.
 */

import * as React from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@brightlocal/ui-components/sheet";
import { useDemo } from "@/lib/demo";

export function PageNotes() {
  const { notesOpen, setNotesOpen } = useDemo();
  const pathname = usePathname();
  const [state, setState] = React.useState<{ md: string; found: boolean; name: string } | null>(null);

  React.useEffect(() => {
    if (!notesOpen) return;
    let live = true;
    fetch(`/api/notes?path=${encodeURIComponent(pathname)}`)
      .then((r) => r.json())
      .then((d) => live && setState(d))
      .catch(() => live && setState({ md: "Could not load the notes.", found: false, name: "" }));
    return () => {
      live = false;
    };
  }, [notesOpen, pathname]);

  return (
    <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
      <SheetContent dataHook="page-notes" side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Page notes</SheetTitle>
          <SheetDescription>
            {state?.found ? `notes/${state.name}.md` : `No notes for ${pathname} yet. Add notes/${state?.name ?? ""}.md.`}
          </SheetDescription>
        </SheetHeader>
        <div className="prose-bl px-4 pb-8 text-sm">
          {state ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.md}</ReactMarkdown> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
