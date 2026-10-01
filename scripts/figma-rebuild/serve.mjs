// The Figma plugin sandbox cannot read the disk, and pushing a 200KB spec
// through a figma_execute argument costs a fortune in tokens. So the build
// runs off this server instead: the plugin fetch()es the builder and the
// specs from here, and POSTs its PNG exports back for checking.
//
//   node scripts/figma-rebuild/serve.mjs <dataDir> [port]
//
// GET  /builder.js            scripts/figma-rebuild/build.js (always fresh)
// GET  /extract.js            scripts/figma-rebuild/extract.js
// GET  /<path>                <dataDir>/<path>  (specs, screenshots)
// GET  /proxy?url=<http url>  fetches a localhost asset (an <img> src) for the plugin
// POST /<path>                writes the body to <dataDir>/<path> (exports)
//
// The port has to be one the bridge plugin's manifest allows; 9228 is free
// of the figma-console bridge's own sockets (9223-9232 are shared, check
// with lsof before picking another). Binds dual-stack, because the plugin
// resolves localhost to ::1.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(process.argv[2] || ".");
const PORT = Number(process.argv[3] || 9228);
const TYPES = { ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain" };

const send = (res, code, body, type = "text/plain") => {
  res.writeHead(code, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Cache-Control": "no-store",
  });
  res.end(body);
};

const safe = (p) => {
  const full = path.resolve(DATA, "." + decodeURIComponent(p));
  if (!full.startsWith(DATA)) throw new Error("outside data dir");
  return full;
};

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (req.method === "OPTIONS") return send(res, 204, "");
    if (req.method === "POST") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const file = safe(url.pathname);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.concat(chunks));
      return send(res, 200, "ok");
    }
    if (url.pathname === "/builder.js") return send(res, 200, fs.readFileSync(path.join(HERE, "build.js")), TYPES[".js"]);
    // plugin-side helpers live in the repo (plugin/), data in the data dir
    const pluginFile = url.pathname.startsWith("/lib/") && path.join(HERE, "plugin", path.basename(url.pathname));
    if (pluginFile && pluginFile.endsWith(".js") && fs.existsSync(pluginFile)) return send(res, 200, fs.readFileSync(pluginFile), TYPES[".js"]);
    if (url.pathname === "/extract.js") return send(res, 200, fs.readFileSync(path.join(HERE, "extract.js")), TYPES[".js"]);
    if (url.pathname === "/proxy") {
      const target = url.searchParams.get("url");
      if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(target || "")) return send(res, 400, "localhost only");
      const r = await fetch(target);
      const buf = Buffer.from(await r.arrayBuffer());
      return send(res, r.status, buf, r.headers.get("content-type") || "application/octet-stream");
    }
    const file = safe(url.pathname);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, "not found");
    return send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] || "application/octet-stream");
  } catch (e) {
    return send(res, 500, String(e && e.message || e));
  }
}).listen(PORT, "::", () => console.log(`figma-rebuild server on :${PORT}, data ${DATA}`));
