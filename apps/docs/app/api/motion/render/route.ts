/**
 * POST /api/motion/render — DETERMINISTIC in-app video render (D7 v2, local).
 *
 * This is the "video capture working in the app" path: the dock's Export
 * button posts the film's source + the live theme here, and the SERVER
 * drives the deterministic Playwright/ffmpeg pipeline
 * (`scripts/render-motion.mjs`) against its own dev server, then streams
 * the finished file back for download. No browser MediaRecorder, no tab
 * capture — perfect locked-fps output regardless of scene weight.
 *
 * Body:
 *   {
 *     source: string,                 // the <Motion> JSX (appSource)
 *     theme?: { vars: Record<string,string>, mode?: "light"|"dark" },
 *     fps?: number,                   // default 30
 *     res?: 0.5 | 1 | 2,              // tier, default 1
 *     seconds?: number,               // cap → preview loop (webm)
 *     poster?: boolean,               // single frame → webp
 *     width?: number,                 // override width (posters/loops)
 *     designId?: string,              // filename provenance
 *   }
 *
 * LOCAL ONLY. Spawning headless Chromium from a route is the dev/desktop
 * path; on gradeui.com this becomes a queued worker (STUDIO-DIRECTOR D7
 * v3) — same kernel, relocated. In production this route returns 501.
 */

import { NextResponse, type NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve as resolvePath } from "node:path";

/** Locate the Playwright CLI on disk WITHOUT require.resolve — the
 *  bundler tries to follow a module specifier at build time and fails.
 *  A filesystem walk is invisible to it. */
function findPlaywrightCli(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    for (const pkg of ["playwright", "playwright-core"]) {
      const candidate = join(dir, "node_modules", pkg, "cli.js");
      if (existsSync(candidate)) return candidate;
    }
    const parent = resolvePath(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Headless render can take a while for a long film — give it room.
export const maxDuration = 300;

/** Walk up from cwd to find the repo root that holds scripts/render-motion.mjs. */
function findRenderScript(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "scripts", "render-motion.mjs");
    if (existsSync(candidate)) return candidate;
    const parent = resolvePath(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "In-app render is local-only. Hosted rendering (the queued worker) is STUDIO-DIRECTOR D7 v3.",
      },
      { status: 501 },
    );
  }

  const script = findRenderScript();
  if (!script) {
    return NextResponse.json(
      { error: "render-motion.mjs not found from the server cwd." },
      { status: 500 },
    );
  }

  let body: {
    source?: string;
    theme?: { vars?: Record<string, string>; mode?: string };
    fps?: number;
    res?: number;
    seconds?: number;
    poster?: boolean;
    width?: number;
    designId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.source || !body.source.includes("<Motion")) {
    return NextResponse.json(
      { error: "Body.source must be a <Motion> app." },
      { status: 400 },
    );
  }

  const work = await mkdtemp(join(tmpdir(), "grade-render-"));
  const srcFile = join(work, "film.jsx");
  const themeFile = join(work, "theme.json");
  const poster = !!body.poster;
  const ext = poster ? "webp" : body.seconds ? "webm" : "mp4";
  const outFile = join(work, `out.${ext}`);

  try {
    await writeFile(srcFile, body.source, "utf8");

    // The headless render drives THIS server's /fast-sandbox — point it at
    // our own origin so the port always matches.
    const origin = new URL(req.url).origin;

    const args = [
      script,
      "--source", srcFile,
      "--out", outFile,
      "--url", origin,
      "--fps", String(body.fps ?? 30),
      "--res", String(body.res ?? 1),
    ];
    if (body.width) args.push("--width", String(body.width));
    if (body.seconds) args.push("--seconds", String(body.seconds));
    if (poster) args.push("--poster");
    if (body.theme?.vars && Object.keys(body.theme.vars).length) {
      await writeFile(
        themeFile,
        JSON.stringify({ vars: body.theme.vars, mode: body.theme.mode ?? "light" }),
        "utf8",
      );
      args.push("--theme", themeFile);
    }

    // STREAM progress to the browser as newline-delimited JSON. The script
    // prints `@@GRADE {phase,frame,total}` lines (GRADE_RENDER_JSON=1); we
    // forward them as { type:"progress", ... } events, then a final
    // { type:"done", file:<base64>, name, contentType } (or { type:"error" }).
    // Films are short, so base64 in the last event is fine on localhost.
    const enc = new TextEncoder();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (o: unknown) =>
          controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));

        // Run the render script once; resolve { code, errTail }. stdout
        // @@GRADE lines are forwarded as progress events as they arrive.
        const runOnce = () =>
          new Promise<{ code: number; errTail: string }>((resolveRun) => {
            const proc = spawn("node", args, {
              stdio: ["ignore", "pipe", "pipe"],
              env: { ...process.env, GRADE_RENDER_JSON: "1" },
            });
            let buf = "";
            proc.stdout.on("data", (chunk: Buffer) => {
              buf += chunk.toString();
              let nl: number;
              while ((nl = buf.indexOf("\n")) !== -1) {
                const line = buf.slice(0, nl);
                buf = buf.slice(nl + 1);
                const m = line.match(/^@@GRADE (.+)$/);
                if (m) {
                  try {
                    send({ type: "progress", ...JSON.parse(m[1]) });
                  } catch {
                    /* ignore malformed */
                  }
                }
              }
            });
            let errTail = "";
            proc.stderr.on("data", (c: Buffer) => {
              errTail = (errTail + c.toString()).slice(-1200);
            });
            proc.on("close", (code) => resolveRun({ code: code ?? 1, errTail }));
            proc.on("error", (e) => resolveRun({ code: 1, errTail: e.message }));
          });

        // Chromium is a PROVISIONED dependency, not a runtime install —
        // locally `pnpm motion:setup`, on gradeui.com the same command in
        // the worker image build. So a missing browser is a clear setup
        // error, NOT auto-magic (which would make localhost behave unlike
        // live — the exact divergence we're avoiding). `findPlaywrightCli`
        // stays available for the setup script.
        void findPlaywrightCli;
        const missingBrowser = (s: string) =>
          /Executable doesn't exist|playwright install|download new browsers/i.test(s);

        try {
          const result = await runOnce();

          const landed = existsSync(outFile)
            ? outFile
            : existsSync(outFile.replace(/\.mp4$/, ".webm"))
              ? outFile.replace(/\.mp4$/, ".webm")
              : null;

          if (result.code !== 0 || !landed) {
            send({
              type: "error",
              message: missingBrowser(result.errTail)
                ? "Renderer not provisioned. Run once:  pnpm motion:setup  (the same step the live worker image runs)."
                : `Render failed (exit ${result.code}). Check the dev-server terminal.`,
              detail: result.errTail.trim() || undefined,
            });
          } else {
            const data = await readFile(landed);
            const finalExt = landed.endsWith(".webm") ? "webm" : ext;
            const ct =
              finalExt === "webp"
                ? "image/webp"
                : finalExt === "webm"
                  ? "video/webm"
                  : "video/mp4";
            send({
              type: "done",
              name: `grade-motion_${body.designId ?? "film"}_${stamp}.${finalExt}`,
              contentType: ct,
              bytes: data.byteLength,
              file: data.toString("base64"),
            });
          }
        } catch (e) {
          send({ type: "error", message: (e as Error).message });
        } finally {
          await rm(work, { recursive: true, force: true }).catch(() => {});
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    await rm(work, { recursive: true, force: true }).catch(() => {});
    return NextResponse.json(
      { error: `Render error: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
