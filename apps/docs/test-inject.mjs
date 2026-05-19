import { readFileSync } from "node:fs";
import ts from "typescript";

const KNOWN_KINDS = new Set([
  "album", "portrait", "landscape", "poster", "product", "food",
  "video", "audio", "embed", "3d", "generic"
]);

function isMediaSurfaceTag(tagName) {
  return ts.isIdentifier(tagName) && tagName.text === "MediaSurface";
}

function injectMediaSourceAttrs(jsx) {
  const sf = ts.createSourceFile("App.tsx", jsx, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const injections = [];
  function visit(node) {
    let opening = null;
    let selfClosing = false;
    if (ts.isJsxSelfClosingElement(node) && isMediaSurfaceTag(node.tagName)) {
      opening = node; selfClosing = true;
    } else if (ts.isJsxElement(node) && isMediaSurfaceTag(node.openingElement.tagName)) {
      opening = node.openingElement;
    }
    if (opening) {
      let sourceAttr = null;
      let hasData = false;
      for (const attr of opening.attributes.properties) {
        if (!ts.isJsxAttribute(attr) || !attr.name || !ts.isIdentifier(attr.name)) continue;
        if (attr.name.text === "source") sourceAttr = attr;
        if (attr.name.text === "data-media-source") hasData = true;
      }
      if (sourceAttr && !hasData) {
        const init = sourceAttr.initializer;
        if (init && ts.isJsxExpression(init) && init.expression) {
          const exprText = jsx.slice(init.expression.getStart(sf), init.expression.getEnd());
          const insertAt = opening.end - (selfClosing ? 2 : 1);
          injections.push({ insertAt, text: ` data-media-source={JSON.stringify(${exprText})}` });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  injections.sort((a, b) => b.insertAt - a.insertAt);
  let out = jsx;
  for (const inj of injections) out = out.slice(0, inj.insertAt) + inj.text + out.slice(inj.insertAt);
  return out;
}

const src = readFileSync("/sessions/compassionate-tender-shannon/mnt/ramp-ds/gradeui/packages/studio/src/playbook/layouts/scaffolds/music-app.jsx", "utf8");
const out = injectMediaSourceAttrs(src);
// Print the lines around each MediaSurface to verify the injection landed.
const lines = out.split("\n");
lines.forEach((l, i) => { if (l.includes("MediaSurface") || l.includes("data-media-source")) console.log(`${i+1}: ${l}`); });
