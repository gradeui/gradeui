"use client";

/**
 * MediaExplorer — single-column UI for `/media`.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  Prompt textarea                                         │
 *   │  ─────────────────                                       │
 *   │  Aspect | Format | Quality | maxWidth                    │
 *   │  Style (optional)                                        │
 *   │            [ Generate ]                                  │
 *   ├─────────────────────────────────────────────────────────┤
 *   │  Latest result — large preview, URL, cache flag, format  │
 *   ├─────────────────────────────────────────────────────────┤
 *   │  History (this session) — thumbnails of prior gens       │
 *   └─────────────────────────────────────────────────────────┘
 *
 * No persistence in v0; history clears on refresh. Cache hits surface
 * with a "(cached)" badge so the user can tell when they're paying for
 * a generation vs reading from the content-hash cache.
 *
 * The form mirrors `MediaRequest` from `@gradeui/media` exactly so the
 * server-side route and the client-side controls share one mental model.
 */

import { useCallback, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GenerateResult {
  url: string;
  key: string;
  format: "webp" | "avif" | "png" | "jpeg";
  cached: boolean;
  /**
   * Provider id that produced this image — e.g. "pollinations:flux" or
   * "gemini:gemini-2.5-flash-image". Surfaced here so the user can tell
   * which provider answered each generation, especially when the default
   * gets switched mid-session.
   */
  provider: string;
}

interface HistoryEntry extends GenerateResult {
  prompt: string;
  aspect: string;
  generatedAt: number;
}

const ASPECTS = ["1:1", "4:3", "3:4", "16:9", "9:16"] as const;
const FORMATS = ["webp", "avif", "png", "jpeg"] as const;

export function MediaExplorer() {
  // Form state — mirrors MediaRequest fields. Defaults match @gradeui/media's
  // own applyDefaults() so the user sees the same defaults as direct API calls.
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("16:9");
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("webp");
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState<number | "">("");
  const [style, setStyle] = useState("");

  // Run state.
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        aspect,
        format,
        quality,
      };
      if (maxWidth !== "" && maxWidth >= 16) body.maxWidth = maxWidth;
      if (style.trim()) body.style = style.trim();

      const res = await fetch("/api/media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as GenerateResult | { error: string };
      if (!res.ok) {
        const msg = "error" in json ? json.error : `Failed: ${res.status}`;
        throw new Error(msg);
      }
      const ok = json as GenerateResult;
      const entry: HistoryEntry = {
        ...ok,
        prompt: prompt.trim(),
        aspect,
        generatedAt: Date.now(),
      };
      setLatest(entry);
      // Prepend so the most recent is first; cap at 12 to keep the page
      // from growing unbounded.
      setHistory((prev) => [entry, ...prev].slice(0, 12));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setRunning(false);
    }
  }, [prompt, aspect, format, quality, maxWidth, style, running]);

  const handleCopy = useCallback((url: string) => {
    void navigator.clipboard.writeText(window.location.origin + url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl((u) => (u === url ? null : u)), 1500);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-6">
      {/* ── Prompt + controls ───────────────────────────────────── */}
      <section className="rounded-lg border bg-card p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="media-prompt">Prompt</Label>
            <Textarea
              id="media-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A surfboard on a sun-bleached wooden floor, soft daylight, minimal styling"
              rows={3}
              disabled={running}
              className="resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="media-aspect" className="text-xs">
                Aspect
              </Label>
              <Select
                value={aspect}
                onValueChange={(v) => setAspect(v as (typeof ASPECTS)[number])}
              >
                <SelectTrigger id="media-aspect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECTS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-format" className="text-xs">
                Format
              </Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as (typeof FORMATS)[number])}
              >
                <SelectTrigger id="media-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-quality" className="text-xs">
                Quality (1-100)
              </Label>
              <Input
                id="media-quality"
                type="number"
                min={1}
                max={100}
                value={quality}
                onChange={(e) =>
                  setQuality(Math.max(1, Math.min(100, Number(e.target.value) || 80)))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-maxwidth" className="text-xs">
                Max width <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="media-maxwidth"
                type="number"
                min={16}
                max={4096}
                value={maxWidth}
                onChange={(e) =>
                  setMaxWidth(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g. 1600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="media-style" className="text-xs">
              Style hint <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="media-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g. photoreal, flat illustration, minimal product photography"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {prompt.trim().length}/2000 characters
            </p>
            <Button
              onClick={handleGenerate}
              disabled={running || !prompt.trim()}
              size="default"
            >
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Latest result ──────────────────────────────────────── */}
      {latest && (
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium">Latest</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {latest.cached && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  cached
                </span>
              )}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                {latest.provider}
              </code>
              <span className="uppercase tracking-wider">{latest.format}</span>
              <span>{latest.aspect}</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={latest.url}
              alt={latest.prompt}
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <code className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-[11px]">
              {latest.url}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(latest.url)}
              className="shrink-0"
            >
              {copiedUrl === latest.url ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy URL
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{latest.prompt}</p>
        </section>
      )}

      {/* ── History ────────────────────────────────────────────── */}
      {history.length > 1 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            This session ({history.length})
          </h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
            {history.slice(1).map((entry) => (
              <button
                key={entry.key + entry.generatedAt}
                type="button"
                onClick={() => setLatest(entry)}
                className={cn(
                  "group relative overflow-hidden rounded-md border bg-card text-left transition",
                  "hover:border-primary",
                )}
                title={entry.prompt}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.url}
                  alt={entry.prompt}
                  className="aspect-square w-full object-cover"
                />
                {entry.cached && (
                  <span className="absolute right-1 top-1 rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary-foreground">
                    cached
                  </span>
                )}
                <p className="line-clamp-2 px-2 py-1.5 text-[11px] text-muted-foreground">
                  {entry.prompt}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
