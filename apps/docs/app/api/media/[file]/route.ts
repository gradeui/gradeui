/**
 * GET /api/media/[file]
 *
 * Local-dev image serve route. The local-tmp storage driver writes generated
 * images to `os.tmpdir()/gradeui-media/` and returns URLs of the form
 * `/api/media/{hash}.{ext}` — this handler streams those bytes back.
 *
 * In production (storage driver = vercel-blob) the URLs returned by
 * `generateImage()` point straight at the blob CDN and never touch this
 * handler. So this route is functionally a dev-only helper that happens to
 * exist on the prod build too. We keep it deployed so the app behaves the
 * same way if someone forces `MEDIA_STORAGE_DRIVER=local-tmp` on a Vercel
 * preview (won't survive cold starts, but useful for one-off testing).
 */

import { promises as fs } from "node:fs";
import { NextRequest, NextResponse } from "next/server";
// `localTmpPath` lives on the storage barrel; the format-from-filename / mime
// helpers live on the media package root. We don't need `getStorage()` here
// because we know we want the filesystem path regardless of which driver is
// selected for writes.
import { localTmpPath } from "@gradeui/media/storage";
import { formatFromFilename, MIME_BY_FORMAT } from "@gradeui/media";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  const decoded = decodeURIComponent(file);

  const format = formatFromFilename(decoded);
  if (!format) {
    return NextResponse.json(
      { error: "Unrecognized file extension." },
      { status: 400 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(localTmpPath(decoded));
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Cast for the Web Response Body type (Buffer is a valid BodyInit at runtime
  // but the DOM lib doesn't know that).
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": MIME_BY_FORMAT[format],
      // Hash-addressed → bytes never change → cache aggressively.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
