/**
 * useGradeSerialize — derives the JSON payload and a canonicalised JSX view
 * from a single source string. Memoised on the source so the Code tab
 * doesn't re-parse on every Studio render.
 *
 * Returns the IR alongside json/jsx for callers that want to inspect
 * diagnostics, render their own UI, or skip CodeView entirely.
 */

import * as React from "react";
import { useMemo } from "react";
import { walk, type WalkOptions } from "./walk";
import { toJsx } from "./to-jsx";
import { toPayloadString } from "./to-payload";
import type { IRRoot } from "./ir";

export interface UseGradeSerializeResult {
  /** Parsed walker IR. */
  ir: IRRoot;
  /** Stringified Grade payload — ready for the clipboard / plugin. */
  json: string;
  /** Canonicalised JSX source — what the Code tab's JSX view shows. */
  jsx: string;
}

export function useGradeSerialize(
  source: string | null | undefined,
  opts: WalkOptions = {},
): UseGradeSerializeResult {
  // Memo key includes the source plus the structural opts. `opts` itself
  // is a fresh object on each render at the call site, so spread its
  // scalars into the dep array instead of comparing by reference.
  const name = opts.name;
  const permissive = opts.permissive;
  const excludeProps = opts.excludeProps;
  const excludeTypes = opts.excludeTypes;
  const rewriteTypes = opts.rewriteTypes;
  const unwrapTypes = opts.unwrapTypes;
  // Stringify caller-passed pattern arrays so a fresh array literal of
  // identical contents doesn't bust the memo. RegExp.toString(),
  // function identity, and string equality all serialise cleanly.
  const exclusionKey = React.useMemo(
    () =>
      [
        ...(excludeProps ?? []).map(stringifyPattern),
        "|t|",
        ...(excludeTypes ?? []).map(stringifyPattern),
        "|r|",
        ...(rewriteTypes ?? []).map(
          (r) =>
            `${stringifyMatch(r.match)}→${typeof r.to === "function" ? "fn" : r.to}:${r.propName ?? ""}${r.transform ? "*" : ""}`,
        ),
        "|u|",
        ...(unwrapTypes ?? []).map(stringifyMatch),
      ].join(","),
    [excludeProps, excludeTypes, rewriteTypes, unwrapTypes],
  );
  return useMemo(() => {
    const safe = source ?? "";
    const ir = walk(safe, {
      name,
      permissive,
      excludeProps,
      excludeTypes,
      rewriteTypes,
      unwrapTypes,
    });
    return {
      ir,
      json: toPayloadString(ir, name),
      jsx: toJsx(ir),
    };
    // exclusionKey captures all referenced array contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, name, permissive, exclusionKey]);
}

function stringifyPattern(p: string | RegExp): string {
  return typeof p === "string" ? p : p.toString();
}

function stringifyMatch(m: string | RegExp | ((name: string) => boolean)): string {
  if (typeof m === "string") return m;
  if (typeof m === "function") return `fn:${m.length}`;
  return m.toString();
}
