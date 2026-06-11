// Auto-generate <component>.contract.ts files from .md sidecars.
//
// For every `packages/ui/components/ui/*.md` that has a `props:`
// frontmatter list, emit a sibling `<component>.contract.ts` with a
// Zod-backed ComponentContract. The schema mirrors the parser in
// `@gradeui/studio/playbook` (PropManifest kinds), which keeps
// the contract surface, the legacy manifest API, and the model-facing
// prompt block all derived from the same descriptors.
//
// What this generator does:
//   - Strings become z.string()
//   - Booleans become z.boolean()
//   - Numbers become z.number()
//   - Enum shapes `(a | b | c)` become z.enum([...])
//   - Primitive unions (`boolean | string`, `string | string[]`) become
//     z.union([...]) so the panel sees both legal shapes. Without this
//     the parser falls through to the FIRST primitive match and
//     silently narrows the contract (caught by Message's `edited` prop
//     which accepts a custom label string at runtime).
//   - Unknown / complex types (ReactNode, () => void, generics) become
//     z.unknown() and are tagged `design: "plumbing"` so the panel
//     ignores them. The chat remains the escape hatch for these.
//
// What this generator does NOT do:
//   - Discriminated unions (MediaSurface's `source`) — hand-authored.
//   - Actions (`fill`, `refresh`, etc.) — hand-authored per-component.
//   - Custom labels / descriptions — uses the .md prose verbatim.
//   - Glyph picker / slider control overrides — added by hand later.
//
// A MEDIA SURFACE GUARD: media-surface.contract.ts is hand-written
// (it has the structured source union + actions). The generator
// detects an existing file with `/* hand-authored */` in its first
// few lines and skips it.
//
// Run from the repo root:
//   node packages/ui/scripts/generate-contracts.mjs
// or as part of @gradeui/ui's prebuild step.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, "..", "components", "ui");
const REGISTRY_FILE = join(__dirname, "..", "lib", "contracts.ts");

// ─── Plumbing / event / ref name lists ───────────────────────────────
//
// Names matched here are auto-tagged with the corresponding `design`
// axis regardless of their TypeScript shape. Most are exactly what
// the panel's PLUMBING_PROP_NAMES blacklist filters out today —
// putting them on the contract just makes the filtering principled
// rather than a side door.
const PLUMBING_NAMES = new Set([
  "asChild", "className", "style", "id", "key", "ref",
  "tabIndex", "role", "slot", "lang", "dir", "title",
  // children variants
  "children",
  // common React passthrough props
  "tabIndex", "autoFocus",
]);
const EVENT_PREFIX = "on"; // onClick, onChange, etc.

// Names whose strings tend to be CONTENT not knobs — alt text, URLs,
// labels, captions. Used to nudge `design: "content"` on string-shaped
// props. Anything not in this list (and a string) still defaults to
// "content" — the heuristic is "strings are user-facing content
// unless they look like plumbing."
const CONTENT_NAME_HINTS = [
  "alt", "src", "label", "title", "placeholder", "name", "description",
  "text", "value", "href", "url", "caption", "summary", "subtitle",
  "prompt", "content", "html",
];

function inferDesign(propName, propKind) {
  if (PLUMBING_NAMES.has(propName)) return "plumbing";
  if (propName.startsWith(EVENT_PREFIX) && propName.length > 2 && propName[2] === propName[2].toUpperCase()) {
    return "event";
  }
  if (propKind === "enum" || propKind === "boolean" || propKind === "number") return "knob";
  if (propKind === "string") return "content";
  // Primitive unions — bias the design hint by their composition.
  // Anything that includes a boolean reads as a knob (toggleable
  // with an optional custom label). Otherwise treat as content.
  if (propKind === "union") return "knob";
  // unknown — could be ReactNode (plumbing-ish), object, function. Safest
  // to mark plumbing so the panel doesn't try to render a control for it.
  return "plumbing";
}

function zodForProp(prop) {
  const opt = prop.optional ? ".optional()" : "";
  if (prop.kind === "enum" && prop.enum && prop.enum.length) {
    // Only string enums survive — numeric enums would need z.union of
    // z.literal(n) which isn't worth the complexity for a generator.
    const strs = prop.enum.filter((v) => typeof v === "string");
    if (strs.length === prop.enum.length && strs.length > 0) {
      return `z.enum([${strs.map((s) => JSON.stringify(s)).join(", ")}])${opt}`;
    }
  }
  if (prop.kind === "boolean") return `z.boolean()${opt}`;
  if (prop.kind === "number") return `z.number()${opt}`;
  if (prop.kind === "string") return `z.string()${opt}`;
  if (prop.kind === "union" && Array.isArray(prop.union) && prop.union.length) {
    return `z.union([${prop.union.join(", ")}])${opt}`;
  }
  return `z.unknown()${opt}`;
}

// ─── Frontmatter + prop parser ───────────────────────────────────────
//
// Minimal port of the parser in @gradeui/studio/playbook/components/refs.ts.
// Handles the shapes that appear in practice across the @gradeui/ui
// sidecars: `name?: type`, `name? (a | b | c)`, `name?: boolean — note`.

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return null;
  const block = raw.slice(3, end).replace(/^\r?\n/, "");
  const lines = block.split(/\r?\n/);

  const out = {};
  let currentKey = null;
  let collectingList = null;
  let collectingBlock = null;
  let blockIndent = -1;

  const closeCollectors = () => {
    if (collectingList && currentKey) {
      out[currentKey] = collectingList;
    } else if (collectingBlock && currentKey) {
      let text = collectingBlock.join("\n");
      if (text.endsWith("\n")) text = text.slice(0, -1);
      out[currentKey] = text;
    }
    collectingList = null;
    collectingBlock = null;
    currentKey = null;
  };

  for (const line of lines) {
    if (collectingBlock !== null) {
      if (line.trim() === "") {
        collectingBlock.push("");
        continue;
      }
      const leading = line.match(/^ */)[0].length;
      if (blockIndent === -1) blockIndent = leading;
      if (leading >= blockIndent) {
        collectingBlock.push(line.slice(blockIndent));
        continue;
      }
      closeCollectors();
    }
    if (collectingList && /^\s*-\s+/.test(line)) {
      collectingList.push(line.replace(/^\s*-\s+/, "").trim());
      continue;
    }
    if (collectingList && currentKey) closeCollectors();

    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const rest = m[2];

    if (rest.trim() === "|") {
      currentKey = key;
      collectingBlock = [];
      blockIndent = -1;
      continue;
    }
    if (rest.startsWith("[") && rest.endsWith("]")) {
      const inner = rest.slice(1, -1).trim();
      out[key] = inner
        ? inner.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      continue;
    }
    if (rest.trim() === "") {
      currentKey = key;
      collectingList = [];
      continue;
    }
    out[key] = rest.trim().replace(/^['"]|['"]$/g, "");
  }
  closeCollectors();
  return out;
}

// Split a sidecar prop line into individual prop signatures, honoring
// paren/quote nesting. Sidecars routinely pack several props onto one
// line in two shapes the one-prop-per-line parser silently mangled
// (June 2026 — found via the MCP save gate rejecting REAL props):
//
//   1. Semicolon-separated full signatures:
//        `DropdownMenuContent: align? "start" | "end"; side? "top"; sideOffset? number`
//      → only the first signature parsed; the rest were swallowed
//        into its tail.
//   2. Bare comma lists:
//        `DropdownMenu: open?, defaultOpen?, onOpenChange?, modal? (default true)`
//      → only `open` survived; defaultOpen/onOpenChange/modal were
//        DROPPED from the contract entirely, so the validator rejected
//        props the component genuinely supports.
//
// Returns an array of `Prefix: signature` strings (prefix re-attached
// so downstream prefix handling still works per segment).
function splitPropLine(line) {
  const raw = line.trim();
  if (!raw) return [];
  const subPrefix = raw.match(/^([A-Z][A-Za-z0-9]*)\s*:\s+(.+)$/);
  const prefix =
    subPrefix && !/^[A-Z][A-Za-z0-9]*\s*:\s+["'(]/.test(raw) ? subPrefix[1] : null;
  const body = prefix ? subPrefix[2].trim() : raw;

  // Top-level split on a separator char, protecting (), [], {}, quotes.
  // `boundary` (optional) must match the TRIMMED start of the chunk
  // following a separator for the split to count — this is how prose
  // semicolons inside descriptions ("…; a brief description") are told
  // apart from signature separators ("…; side? \"top\""): a signature
  // starts `name?` or `name:`, prose doesn't.
  const topSplit = (text, sep, boundary) => {
    const parts = [];
    let depth = 0;
    let quote = null;
    let cur = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quote) {
        cur += ch;
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
        cur += ch;
        continue;
      }
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      else if (ch === ")" || ch === "]" || ch === "}") depth--;
      if (
        ch === sep &&
        depth === 0 &&
        (!boundary || boundary.test(text.slice(i + 1).trimStart()))
      ) {
        parts.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    parts.push(cur);
    return parts.map((s) => s.trim()).filter(Boolean);
  };

  // Pass 1 — semicolons separate full signatures, but only when the
  // next chunk actually opens like one. `name?` is unambiguous; a bare
  // `name:` is only a signature if a TYPE follows the colon (keyword,
  // quote, paren, or a PascalCase type name) — otherwise it's prose
  // like field.md's "…; setting: text leads, control pinned trailing",
  // which must stay inside the previous prop's description.
  const SIG_START =
    /^[A-Za-z_$][A-Za-z0-9_$-]*\s*(\?|:\s*(string|number|boolean|bigint|symbol|object|unknown|any|never|void|\(|["'`]|[A-Z][A-Za-z0-9]*(\[\])?\b))/;
  const semiParts = topSplit(body, ";", SIG_START);

  // Pass 2 — within a segment, split on commas ONLY when every piece
  // reads as a bare prop name (`name?`), optionally with a trailing
  // `(default …)` or a simple one-word type. This deliberately does
  // NOT split `value?: string | string[]` or `(a, b) => void` shapes.
  const BARE = /^[A-Za-z_$][A-Za-z0-9_$-]*\??(\s*\(default[^)]*\))?(\s*:\s*[A-Za-z][A-Za-z0-9<>\[\]]*)?$/;
  const segments = [];
  for (const part of semiParts) {
    // Keep any ` — description` on the LAST comma piece only; strip it
    // for the bare-list test so described lines still qualify.
    const emIdx = part.indexOf(" — ");
    const testable = emIdx === -1 ? part : part.slice(0, emIdx);
    const commaParts = topSplit(testable, ",");
    if (commaParts.length > 1 && commaParts.every((p) => BARE.test(p))) {
      const desc = emIdx === -1 ? "" : part.slice(emIdx);
      commaParts.forEach((p, i) => {
        segments.push(i === commaParts.length - 1 ? p + desc : p);
      });
    } else {
      segments.push(part);
    }
  }

  return segments.map((s) => (prefix ? `${prefix}: ${s}` : s));
}

function parsePropSignature(line, rootName) {
  let raw = line.trim();
  if (!raw) return null;
  if (/^all\s/i.test(raw)) return null;

  // Strip subcomponent prefix (`Accordion:`, `AccordionItem:`,
  // `DialogTrigger:`, etc.) — these namespace which sub-export the
  // prop belongs to, but for contract generation we flatten into a
  // single per-component bag. Without this, "Accordion: type" and
  // "Accordion: value" both parse with `name="Accordion"` and the
  // emitted object literal trips on duplicate keys. Pattern: starts
  // with PascalCase identifier, followed by `:`, followed by space.
  //
  // REQUIREDNESS RULE (June 2026): a prop that belongs to a
  // SUB-component is forced optional in the flattened bag. The bag
  // can't express per-sub-export requiredness, and leaking it made
  // the validator demand TabsTrigger's required `value: string` on
  // <Tabs> itself. Root-prefixed (or unprefixed) lines keep their
  // declared requiredness — that's how <Code source> stays required.
  let forceOptional = false;
  const subPrefix = raw.match(/^([A-Z][A-Za-z0-9]*)\s*:\s+(.+)$/);
  if (subPrefix && !/^[A-Z][A-Za-z0-9]*\s*:\s+["'(]/.test(raw)) {
    // Guard against false positives like an enum-shape value that
    // happens to start uppercase — but in practice enums start with
    // `(` or `"`. The negative lookahead above keeps us safe.
    if (rootName && subPrefix[1] !== rootName) forceOptional = true;
    raw = subPrefix[2].trim();
  }

  // Split description.
  let head = raw;
  let description;
  const emIdx = raw.indexOf(" — ");
  const hyphenIdx = raw.indexOf(" - ");
  const splitIdx = emIdx !== -1 ? emIdx : hyphenIdx !== -1 ? hyphenIdx : -1;
  if (splitIdx !== -1) {
    head = raw.slice(0, splitIdx).trim();
    description = raw.slice(splitIdx + 3).trim();
  }

  // Pull (default X) out. Guarded against enum tails whose first
  // option literally starts with "default" — e.g.
  // `variant? (default | destructive | outline | …)`. The extractor
  // would otherwise consume the whole `(default | … | …)` paren
  // group, leave `variant?` with an empty tail, and fall through to
  // `z.unknown()` / `design: "plumbing"` — silently hiding the prop
  // from the Studio inspector.
  //
  // Rule: a real "(default X)" annotation has a single value between
  // the open paren and close paren. A `|` inside the parens means
  // we're looking at an enum, not a default annotation — abort the
  // extraction and let the enum branch downstream pick it up.
  let defaultValue;
  const defIdx = head.toLowerCase().lastIndexOf("(default");
  if (defIdx !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = defIdx; i < head.length; i++) {
      const ch = head[i];
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      const candidate = head.slice(defIdx + "(default".length, end).trim();
      // Pipe inside the parens → this is an enum tail, not a
      // default annotation. Leave `head` untouched so the enum
      // branch can pick the (...) up later.
      if (!candidate.includes("|")) {
        defaultValue = candidate;
        head = (head.slice(0, defIdx) + head.slice(end + 1)).trim();
      }
    }
  }

  // Name extraction.
  const nameMatch = head.match(/^([A-Za-z_$][A-Za-z0-9_$-]*)(\?)?(\s*:\s*|\s+|$)(.*)$/);
  if (!nameMatch) {
    const bare = head.match(/^([A-Za-z_$][A-Za-z0-9_$-]*)(\?)?/);
    if (!bare) return null;
    return {
      name: bare[1],
      optional: Boolean(bare[2]) || forceOptional,
      kind: "unknown",
      defaultValue,
      description,
      raw,
    };
  }

  const name = nameMatch[1];
  const optional = Boolean(nameMatch[2]) || forceOptional;
  const tail = (nameMatch[4] ?? "").trim();

  // Parens enum.
  if (tail.startsWith("(") && tail.endsWith(")")) {
    const inner = tail.slice(1, -1).trim();
    const parts = inner.split("|").map((s) => s.trim()).filter(Boolean);
    if (parts.length) {
      return {
        name,
        optional,
        kind: "enum",
        enum: parts.map((p) => p.replace(/^['"]|['"]$/g, "")),
        defaultValue,
        description,
        raw,
      };
    }
  }

  // Quoted enum: "a" | "b"
  const quotedEnumMatch = tail.match(/^["']([^"']+)["'](?:\s*\|\s*["']([^"']+)["'])+$/);
  if (quotedEnumMatch) {
    const vals = Array.from(tail.matchAll(/["']([^"']+)["']/g)).map((m) => m[1]);
    return {
      name,
      optional,
      kind: "enum",
      enum: vals,
      defaultValue,
      description,
      raw,
    };
  }
  // More tolerant string union: anything with `|` between quoted strings.
  if (/^["'][^"']+["'](\s*\|\s*["'][^"']+["'])+/.test(tail)) {
    const vals = Array.from(tail.matchAll(/["']([^"']+)["']/g)).map((m) => m[1]);
    if (vals.length) {
      return {
        name,
        optional,
        kind: "enum",
        enum: vals,
        defaultValue,
        description,
        raw,
      };
    }
  }

  // Primitive union, e.g. `boolean | string`, `string | string[]`.
  // MUST come before the singular primitive checks below — otherwise
  // `^boolean\b` swallows `boolean | string` and the contract
  // silently narrows to z.boolean(). Match against the leading run
  // so a trailing prose annotation ("— renders ...") doesn't break
  // the regex.
  const PRIM = "(?:boolean|number|string(?:\\[\\])?)";
  const unionRe = new RegExp(`^(${PRIM})(?:\\s*\\|\\s*${PRIM})+`, "i");
  const unionMatch = tail.match(unionRe);
  if (unionMatch) {
    const members = unionMatch[0]
      .split("|")
      .map((s) => s.trim().toLowerCase());
    const zodMembers = members.map((m) => {
      if (m === "boolean") return "z.boolean()";
      if (m === "number") return "z.number()";
      if (m === "string") return "z.string()";
      if (m === "string[]") return "z.array(z.string())";
      return "z.unknown()";
    });
    return {
      name,
      optional,
      kind: "union",
      union: zodMembers,
      defaultValue,
      description,
      raw,
    };
  }

  if (/^boolean\b/i.test(tail)) return { name, optional, kind: "boolean", defaultValue, description, raw };
  if (/^number\b/i.test(tail)) return { name, optional, kind: "number", defaultValue, description, raw };
  if (/^string\b/i.test(tail)) return { name, optional, kind: "string", defaultValue, description, raw };

  return { name, optional, kind: "unknown", defaultValue, description, raw };
}

// ─── Contract emitter ────────────────────────────────────────────────

// ─── Style-defaults extraction ───────────────────────────────────────
//
// Parse the component .tsx SOURCE for each exported part's baked-in
// Tailwind classes:
//   - plain components: the first string literal inside `cn("…", …)`
//   - cva components: the cva base string + the defaultVariants
//     resolution (base + variants[axis][defaultVariants[axis]] per axis)
// The result ships on the contract as `styleDefaults` so the Studio
// inspector can show REAL default chips (CardContent → "p-6 pt-0")
// instead of pretending unset means zero. Static + best-effort: when a
// shape doesn't match, we emit nothing for that part rather than guess.

function sliceBalanced(src, openIdx, open, close) {
  let depth = 0;
  let inString = null;
  let escaped = false;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") escaped = true;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return src.slice(openIdx + 1, i);
    }
  }
  return null;
}

function firstStringLiteral(src) {
  const m = /"((?:[^"\\]|\\.)*)"/.exec(src);
  return m ? m[1] : null;
}

function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveCva(callBody) {
  // callBody = the inside of cva( … ): `"base", { variants, defaultVariants }`
  const base = firstStringLiteral(callBody) ?? "";
  const out = [base];
  const defaults = {};
  const dvIdx = callBody.indexOf("defaultVariants");
  if (dvIdx === -1) return { classes: out.join(" ").trim(), defaults };
  const dvOpen = callBody.indexOf("{", dvIdx);
  if (dvOpen === -1) return { classes: out.join(" ").trim(), defaults };
  const dvBody = sliceBalanced(callBody, dvOpen, "{", "}") ?? "";
  const pairs = [
    ...dvBody.matchAll(/(["']?)([\w-]+)\1\s*:\s*["']([\w-]+)["']/g),
  ].map((m) => [m[2], m[3]]);
  for (const [axis, key] of pairs) defaults[axis] = key;
  const vIdx = callBody.indexOf("variants");
  if (vIdx === -1 || pairs.length === 0)
    return { classes: out.join(" ").trim(), defaults };
  const vOpen = callBody.indexOf("{", vIdx);
  const vBody = vOpen === -1 ? "" : (sliceBalanced(callBody, vOpen, "{", "}") ?? "");
  for (const [axis, key] of pairs) {
    const axisM = new RegExp(`(["']?)${escapeForRegex(axis)}\\1\\s*:\\s*\\{`).exec(vBody);
    if (!axisM) continue;
    const axisOpen = vBody.indexOf("{", axisM.index);
    if (axisOpen === -1) continue;
    const axisBody = sliceBalanced(vBody, axisOpen, "{", "}") ?? "";
    const valM = new RegExp(
      `(["']?)${escapeForRegex(key)}\\1\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`,
    ).exec(axisBody);
    if (valM) out.push(valM[2]);
  }
  return { classes: out.join(" ").trim(), defaults };
}

function extractStyleDefaults(tsxSource) {
  // cva assignments: varName → { classes (default resolution), defaults }.
  const cvaByVar = {};
  const cvaRe = /const\s+(\w+)\s*=\s*cva\s*\(/g;
  let m;
  while ((m = cvaRe.exec(tsxSource)) !== null) {
    const openParen = tsxSource.indexOf("(", m.index + m[0].length - 1);
    const body = sliceBalanced(tsxSource, openParen, "(", ")");
    if (body) cvaByVar[m[1]] = resolveCva(body);
  }
  // PascalCase declaration blocks (components only — cva vars are
  // camelCase and `function main` etc. are lowercase).
  const declRe = /(?:^|\n)(?:export\s+)?(?:const|function)\s+([A-Z]\w*)/g;
  const decls = [];
  while ((m = declRe.exec(tsxSource)) !== null) {
    decls.push({ name: m[1], start: m.index });
  }
  const out = {};
  const variantDefaultsByName = {};
  for (let i = 0; i < decls.length; i++) {
    const { name, start } = decls[i];
    const end = i + 1 < decls.length ? decls[i + 1].start : tsxSource.length;
    const block = tsxSource.slice(start, end);
    // cva-backed component (cn(buttonVariants({…}), className))?
    const ref = /(\w+Variants)\s*\(/.exec(block);
    if (ref && cvaByVar[ref[1]]) {
      const resolved = cvaByVar[ref[1]];
      if (resolved.classes.trim()) out[name] = resolved.classes;
      if (Object.keys(resolved.defaults).length) {
        variantDefaultsByName[name] = resolved.defaults;
      }
      continue;
    }
    // Plain cn("literal", …).
    const cnM = /\bcn\(\s*\n?\s*"((?:[^"\\]|\\.)*)"/.exec(block);
    if (cnM && cnM[1].trim()) out[name] = cnM[1];
  }
  return { styleDefaults: out, variantDefaultsByName };
}

function emitContract(componentName, fm, propLines, styleDefaults, variantDefaults) {
  const parsed = propLines
    .flatMap(splitPropLine)
    .map((l) => parsePropSignature(l, componentName))
    .filter(Boolean);

  // Resolve "(see list above)" / "(see above)" enum references against the
  // frontmatter lists. Sidecar authors write `variant? (see list above)` to
  // avoid duplicating the `variants:` line — the parens-enum branch used to
  // take that literally and emit z.enum(["see list above"]), which made
  // EVERY legitimate value a contract violation (caught live by the MCP
  // save gate on Badge, June 2026). `size` props resolve against `sizes:`,
  // everything else against `variants:`. No matching list → fall back to
  // z.unknown() rather than ship a bogus enum.
  const LIST_REF_RE = /^see (?:the )?(?:list )?above$/i;
  for (const p of parsed) {
    if (
      p.kind === "enum" &&
      Array.isArray(p.enum) &&
      p.enum.length === 1 &&
      LIST_REF_RE.test(p.enum[0])
    ) {
      const source =
        p.name === "size" && Array.isArray(fm.sizes) ? fm.sizes : fm.variants;
      if (Array.isArray(source) && source.length > 0) {
        p.enum = source.map((v) => String(v));
      } else {
        p.kind = "unknown";
        p.enum = undefined;
      }
    }
  }
  // Dedup by name — when the .md namespaces props by subcomponent
  // (`Accordion: value`, `AccordionItem: value`), the parser flattens
  // the prefix away, and identical short names collide. First entry
  // wins because it's typically the root component's prop and the
  // most fundamental. Sub-component variants of the same name can be
  // refined later by hand-editing.
  const seen = new Set();
  const props = [];
  for (const p of parsed) {
    if (seen.has(p.name)) continue;
    seen.add(p.name);
    props.push(p);
  }
  const propEntries = props.map((p) => {
    const design = inferDesign(p.name, p.kind);
    const schema = zodForProp(p);
    const lines = [`    schema: ${schema}`, `    design: "${design}"`];
    if (p.description) {
      lines.push(`    description: ${JSON.stringify(p.description)}`);
    }
    if (p.defaultValue && (p.kind === "string" || p.kind === "enum")) {
      const val = p.defaultValue.replace(/^['"]|['"]$/g, "");
      lines.push(`    default: ${JSON.stringify(val)}`);
    }
    if (p.defaultValue && p.kind === "boolean") {
      lines.push(`    default: ${p.defaultValue === "true"}`);
    }
    return `  ${JSON.stringify(p.name)}: {\n${lines.map((l) => `  ${l}`).join(",\n")},\n  }`;
  });

  const description = JSON.stringify(fm.when_to_use ?? fm.description ?? `${componentName} component.`);
  const aliases = Array.isArray(fm.aliases) ? fm.aliases : [];
  const composesWith = Array.isArray(fm.composes_with) ? fm.composes_with : [];
  const subcomponents = Array.isArray(fm.subcomponents) ? fm.subcomponents : [];
  const importPath = fm.import ?? "@gradeui/ui";

  // Empty props produce `props: {}` rather than `props: { , }`. JS
  // tolerates trailing-comma-in-empty-object only with an actual
  // entry preceding it; safer to special-case.
  const propsBlock =
    propEntries.length === 0
      ? `  props: {},\n`
      : `  props: {\n${propEntries.join(",\n")},\n  },\n`;

  // Baked-in classes per exported part, extracted from the .tsx source.
  const styleDefaultsBlock =
    styleDefaults && Object.keys(styleDefaults).length
      ? `  styleDefaults: ${JSON.stringify(styleDefaults)},\n`
      : "";

  // The primary cva's defaultVariants ({ variant: "default", size: "md" })
  // so the inspector can ghost the REAL resolved value on unset enum
  // props instead of "(default)".
  const variantDefaultsBlock =
    variantDefaults && Object.keys(variantDefaults).length
      ? `  variantDefaults: ${JSON.stringify(variantDefaults)},\n`
      : "";

  return `// AUTO-GENERATED by scripts/generate-contracts.mjs from the .md sidecar.
// Hand edits will be overwritten on the next run. To customise this
// component's contract (add actions, structured props, custom control
// kinds, glyph pickers), remove this file's auto-generated marker and
// hand-author it — the generator skips files without the marker.

import { z } from "zod";
import { contract } from "@gradeui/contracts";

export const ${componentName}Contract = contract({
  name: ${JSON.stringify(componentName)},
  description: ${description},
  import: ${JSON.stringify(importPath)},
${aliases.length ? `  aliases: ${JSON.stringify(aliases)},\n` : ""}${subcomponents.length ? `  subcomponents: ${JSON.stringify(subcomponents)},\n` : ""}${composesWith.length ? `  composesWith: ${JSON.stringify(composesWith)},\n` : ""}${styleDefaultsBlock}${variantDefaultsBlock}${propsBlock}});
`;
}

// ─── Driver ──────────────────────────────────────────────────────────

const HAND_AUTHORED_MARKER = "AUTO-GENERATED by scripts/generate-contracts.mjs";

function shouldSkip(filePath) {
  if (!existsSync(filePath)) return false;
  const head = readFileSync(filePath, "utf8").slice(0, 400);
  // Skip files that DON'T have our marker — they're hand-authored
  // (MediaSurfaceContract being the canonical case).
  return !head.includes(HAND_AUTHORED_MARKER);
}

function pascalCase(kebab) {
  return kebab
    .split(/[-_]/)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("");
}

function main() {
  const files = readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith(".md"));
  const generated = [];
  const skipped = [];
  const dropped = [];

  for (const mdFile of files) {
    const base = mdFile.replace(/\.md$/, "");
    const componentName = pascalCase(base);
    const mdPath = join(COMPONENTS_DIR, mdFile);
    const contractPath = join(COMPONENTS_DIR, `${base}.contract.ts`);

    // Empty / whitespace-only .md means the component has been retired
    // (rename, deletion). Don't register it. The .contract.ts may still
    // be on disk because the sandbox blocked `rm` — we treat the
    // zero-byte .md as authoritative "this no longer exists".
    const raw = readFileSync(mdPath, "utf8");
    if (!raw.trim()) {
      dropped.push(componentName);
      continue;
    }

    if (shouldSkip(contractPath)) {
      // Hand-authored — but a zero-byte hand-authored contract is also
      // a retired component (same truncate-as-delete pattern).
      const contractContent = existsSync(contractPath)
        ? readFileSync(contractPath, "utf8")
        : "";
      if (!contractContent.trim()) {
        dropped.push(componentName);
        continue;
      }
      skipped.push(componentName);
      continue;
    }

    const fm = parseFrontmatter(raw);
    if (!fm) continue;
    const propLines = Array.isArray(fm.props) ? fm.props : [];
    if (propLines.length === 0) {
      // No props to surface — emit nothing.
      continue;
    }

    const tsxPath = join(COMPONENTS_DIR, `${base}.tsx`);
    const extracted = existsSync(tsxPath)
      ? extractStyleDefaults(readFileSync(tsxPath, "utf8"))
      : { styleDefaults: {}, variantDefaultsByName: {} };
    // The contract's variantDefaults belong to the ROOT component — the
    // one whose name matches the contract. Sub-part cvas (if any) are
    // not surfaced here.
    const contractCode = emitContract(
      componentName,
      fm,
      propLines,
      extracted.styleDefaults,
      extracted.variantDefaultsByName[componentName],
    );
    writeFileSync(contractPath, contractCode, "utf8");
    generated.push(componentName);
  }

  // Update the registry to import every generated contract.
  updateRegistry(generated, skipped);

  const droppedNote = dropped.length
    ? `; dropped ${dropped.length} retired (${dropped.join(", ")})`
    : "";
  console.log(
    `[generate-contracts] generated ${generated.length} contracts, skipped ${skipped.length} hand-authored (${skipped.join(", ") || "none"})${droppedNote}`,
  );
}

function updateRegistry(generated, skipped) {
  const all = [...generated, ...skipped].sort();
  const imports = all
    .map((name) => {
      const kebab = name.replace(/[A-Z]/g, (m, i) => (i ? "-" : "") + m.toLowerCase());
      return `import { ${name}Contract } from "../components/ui/${kebab}.contract";`;
    })
    .join("\n");
  const entries = all.map((name) => `  ${name}: ${name}Contract,`).join("\n");

  const code = `/**
 * Component contract registry — auto-managed by
 * scripts/generate-contracts.mjs. Hand-authored contracts (MediaSurface,
 * etc.) are also wired in here; the generator preserves them on each
 * run.
 */

import type { ComponentContract } from "@gradeui/contracts";
${imports}

export const COMPONENT_CONTRACTS: Readonly<Record<string, ComponentContract>> = {
${entries}
};

export function getComponentContract(
  componentName: string | null | undefined,
): ComponentContract | null {
  if (!componentName) return null;
  return COMPONENT_CONTRACTS[componentName] ?? null;
}

export function listContractedComponents(): string[] {
  return Object.keys(COMPONENT_CONTRACTS);
}
`;
  writeFileSync(REGISTRY_FILE, code, "utf8");
}

main();
