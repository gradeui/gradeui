"use client";

/**
 * SharedComponentsPage — the "Shared components" rail section: a
 * read-only list of the project's @project/components modules
 * (shared_components table) with a full-height Sheet source viewer.
 *
 * Stage 1 of STUDIO.md's shared-components direction: VISIBILITY, not
 * authoring — editing goes through chat/MCP (save_shared_component),
 * and the viewer says so. The Sheet + CodeView composition mirrors
 * ProjectSettingsSheet (chrome) and the screen Code view's read-only
 * surface (code-view.tsx wraps @gradeui/ui <Code bare>).
 */

import * as React from "react";
import { Package, Code2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Badge,
  Card,
} from "@gradeui/ui";
import { CodeView } from "@/components/studio/code-view";
import type { SharedComponent } from "@/lib/studio-storage/types";

function formatVersion(updatedAt: number): string {
  try {
    return new Date(updatedAt).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(updatedAt);
  }
}

export function SharedComponentsPage({
  components,
  usage,
}: {
  components: SharedComponent[] | null;
  /** name → number of screens importing it (parsed from the
   *  @project/components import lists client-side). */
  usage: Record<string, number>;
}) {
  const [viewing, setViewing] = React.useState<SharedComponent | null>(null);

  if (!components || components.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 rounded-xl border-dashed p-10 text-center">
        <Package className="h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">
          No shared components yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Shared components are reusable modules screens import from
          &quot;@project/components&quot;. Create one from chat or via the
          MCP save_shared_component tool. (Cloud projects only.)
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {components.map((c) => {
          const usedIn = usage[c.name] ?? 0;
          return (
            <Card
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-xl p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm font-medium text-foreground">
                      {c.name}
                    </span>
                    <Badge variant="secondary" rounded="full">
                      {usedIn === 1 ? "1 screen" : `${usedIn} screens`}
                    </Badge>
                  </div>
                  {c.description ? (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    Version {c.updatedAt} · updated {formatVersion(c.updatedAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewing(c)}
              >
                <Code2 className="h-3.5 w-3.5" />
                View source
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Read-only source viewer — full-height right Sheet, CodeView
          owns its own scrolling inside the flex-1 body. */}
      <Sheet
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-[88vw] max-w-2xl flex-col gap-0"
        >
          <SheetHeader>
            <SheetTitle className="font-mono">{viewing?.name}</SheetTitle>
            <SheetDescription>
              {viewing?.description ?? "Shared component"} — read-only.
              Edited via chat/MCP; screens pick changes up on next render.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 pt-2">
            {viewing ? <CodeView code={viewing.source} language="tsx" /> : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
