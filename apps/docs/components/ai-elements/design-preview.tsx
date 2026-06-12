"use client";

/**
 * DesignPreview — renders a JSX code block emitted by the model inside a
 * Sandpack iframe so the user sees the actual Grade DS components it describes.
 *
 * The preview only mounts once the code block is "sealed" (closing fence has
 * arrived). While streaming, we show a small skeleton so we don't spam
 * Sandpack with incomplete snippets that would error repeatedly.
 *
 * Theme tokens are pulled from the active GradeTheme so previews honour
 * whatever theme the user picked in the nav.
 */

import { useMemo, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { Code2, Eye, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGradeTheme } from "@/components/grade-theme-provider";
import {
  buildSandpackFiles,
  formatThemeVars,
  looksComplete,
  PLAYGROUND_DEPENDENCIES,
  PLAYGROUND_EXTERNAL_RESOURCES,
  prepareAppSource,
} from "@/lib/chat-sandpack";
import { downloadStandaloneHtml } from "@/lib/chat-export";
import { fontFaceCSS } from "@/lib/themes";

interface DesignPreviewProps {
  /** Raw JSX string the model emitted. Should be a full component body. */
  code: string;
  /** If true, the model is still streaming this block — show a placeholder. */
  streaming?: boolean;
  className?: string;
}

export function DesignPreview({ code, streaming, className }: DesignPreviewProps) {
  const { theme: activeTheme, isDark } = useGradeTheme();
  const [view, setView] = useState<"preview" | "code">("preview");

  const mode = isDark ? "dark" : "light";

  // The download handler still needs raw light/dark var blocks so it can
  // emit a standalone HTML file. Compute them here; buildSandpackFiles
  // will recompute them internally for the iframe, which is fine — both
  // calls go through the same formatter and memo keys.
  const { lightVars, darkVars, fontFaces } = useMemo(
    () => ({
      lightVars: formatThemeVars(activeTheme, "light"),
      darkVars: formatThemeVars(activeTheme, "dark"),
      fontFaces: fontFaceCSS(activeTheme.typography.fontFaces),
    }),
    [activeTheme]
  );

  const appSource = useMemo(() => prepareAppSource(code), [code]);
  const canRender = !streaming && looksComplete(code);

  const sandpackFiles = useMemo(
    () =>
      canRender
        ? buildSandpackFiles({
            appSource,
            appSourceIsPrepared: true,
            theme: activeTheme,
            mode,
          })
        : null,
    [canRender, appSource, activeTheme, mode]
  );

  return (
    <div
      className={cn(
        "my-3 rounded-lg border border-border bg-card overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {streaming ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating design…
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              Live preview
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView("preview")}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
              view === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setView("code")}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
              view === "code"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code2 className="h-3 w-3" />
            Code
          </button>
          {canRender && (
            <>
              <span className="mx-1 h-3 w-px bg-border" aria-hidden />
              <button
                type="button"
                onClick={() =>
                  downloadStandaloneHtml({
                    appSource,
                    lightVars,
                    darkVars,
                    fontFaces,
                    mode,
                    filename: "ramp-design",
                  })
                }
                title="Download as a standalone HTML file"
                className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-3 w-3" />
                HTML
              </button>
            </>
          )}
        </div>
      </div>

      {canRender && sandpackFiles ? (
        <SandpackProvider
          template="react-ts"
          theme={isDark ? "dark" : "light"}
          options={{
            externalResources: [...PLAYGROUND_EXTERNAL_RESOURCES],
          }}
          customSetup={{
            dependencies: { ...PLAYGROUND_DEPENDENCIES },
            entry: "/index.tsx",
          }}
          files={sandpackFiles}
        >
          <SandpackLayout
            style={{ height: 420, display: view === "code" ? "flex" : "none" }}
          >
            <SandpackCodeEditor showLineNumbers style={{ height: "100%" }} />
          </SandpackLayout>
          <SandpackLayout
            style={{ height: 420, display: view === "preview" ? "flex" : "none" }}
          >
            <SandpackPreview
              showOpenInCodeSandbox
              showRefreshButton
              style={{ height: "100%" }}
            />
          </SandpackLayout>
        </SandpackProvider>
      ) : (
        <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
          {streaming ? "Waiting for the model to finish…" : "No preview available."}
        </div>
      )}
    </div>
  );
}
