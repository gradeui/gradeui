"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code } from "@/components/ui/code";
import { cn } from "@/lib/utils";

/**
 * ComponentPreview — the canonical "Preview / Code" tabbed surface used
 * across every component docs page.
 *
 * Code-tab render uses the DS `<Code>` primitive (May 2026 swap-in) so
 * docs syntax highlighting matches Studio's Source panel + marketing
 * heroes + scaffold playground — single highlighter, single palette.
 * Previously a raw `<pre className="bg-gds-gray-800">` block; the new
 * version inherits `--gds-code-*` tokens automatically so themes carry
 * through.
 */

interface ComponentPreviewProps {
  children: React.ReactNode;
  code: string;
  /** Prism language id for the snippet. Defaults to `tsx`. */
  language?: React.ComponentProps<typeof Code>["language"];
  className?: string;
}

export function ComponentPreview({
  children,
  code,
  language = "tsx",
  className,
}: ComponentPreviewProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative my-4 rounded-lg border overflow-hidden", className)}>
      <Tabs defaultValue="preview" className="w-full">
        <div className="flex items-center justify-between border-b px-4">
          <TabsList className="h-10 bg-transparent p-0">
            <TabsTrigger
              value="preview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
            >
              Code
            </TabsTrigger>
          </TabsList>
          <button
            onClick={copyToClipboard}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <TabsContent value="preview" className="p-6">
          <div className="flex items-center justify-center min-h-[100px]">
            {children}
          </div>
        </TabsContent>
        <TabsContent value="code" className="p-0">
          <Code
            source={code}
            language={language}
            bare
            wrap={false}
            className="p-4"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
