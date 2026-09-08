import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** Page notes: GET /api/notes?path=/reviews/tracker reads
 *  notes/reviews-tracker.md; unknown paths fall back to notes/README.md. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  // /locations/<location>/reviews/tracker reads reviews-tracker.md; the
  // location hub (/locations/<location>) reads location.md.
  const raw = (url.searchParams.get("path") ?? "/").replace(/\?.*$/, "");
  const route = raw.replace(/^\/locations\/[^/]+\/?/, (m) => (m.endsWith("/") ? "/" : "/location"));
  const name = route === "/" ? "home" : route.replace(/^\/+|\/+$/g, "").replace(/\//g, "-");
  if (!/^[a-z0-9-]+$/i.test(name)) return NextResponse.json({ error: "bad path" }, { status: 400 });
  const dir = path.join(process.cwd(), "notes");
  let md: string;
  let found = true;
  try {
    md = await readFile(path.join(dir, `${name}.md`), "utf8");
  } catch {
    found = false;
    md = await readFile(path.join(dir, "README.md"), "utf8");
  }
  return NextResponse.json({ name, found, md });
}
