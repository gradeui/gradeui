/**
 * Uploaded font assets → theme-ready CustomFontFace entries.
 *
 * The bridge STUDIO-STORAGE.md S4 promised: a font in the user's asset
 * library (migration 0014, `type: 'font'`, public bucket URL) becomes a
 * face a ThemeInput can carry. Everything here is derivation — family
 * name from the filename, @font-face format from the extension, category
 * from naming convention — because font binary parsing (the real name
 * table) is a later enrichment pass; the asset's `enrichment` JSONB can
 * override any guess once that lands.
 */

import type { Asset } from "@/lib/studio-storage";
import type { CustomFontFace } from "@/lib/themes";

/** "PebbleSans-Bold_v2.woff2" → "Pebble Sans Bold v2". */
export function fontFamilyFromFileName(fileName: string): string {
  return (
    fileName
      // Drop the extension.
      .replace(/\.(woff2?|ttf|otf)$/i, "")
      // Separators → spaces.
      .replace(/[-_+.]+/g, " ")
      // Split camelCase / PascalCase runs ("PebbleSans" → "Pebble Sans").
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim() || fileName
  );
}

/** @font-face `format()` hint from the file extension. */
export function fontFormatFromFileName(
  fileName: string,
): CustomFontFace["format"] {
  const ext = fileName.toLowerCase().match(/\.(woff2|woff|ttf|otf)$/)?.[1];
  switch (ext) {
    case "woff2":
      return "woff2";
    case "woff":
      return "woff";
    case "ttf":
      return "truetype";
    case "otf":
      return "opentype";
    default:
      return undefined;
  }
}

/** Naming-convention category guess; the fallback stack hangs off this. */
function guessCategory(name: string): NonNullable<CustomFontFace["category"]> {
  const n = name.toLowerCase();
  if (/mono|code|console/.test(n)) return "mono";
  if (/serif(?!\s*sans)|georgia|times|garamond|caslon/.test(n)) return "serif";
  return "sans";
}

/** Weight guess from conventional filename suffixes. Unmatched names get
 *  the full variable range — correct for variable fonts, and for static
 *  files it just means the browser synthesises off-weights (visible but
 *  never broken). */
function guessWeight(name: string): string | undefined {
  const n = name.toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/thin/, "100"],
    [/extra\s*light|ultralight/, "200"],
    [/(?<!semi)(?<!demi)\blight/, "300"],
    [/regular|book|normal/, "400"],
    [/medium/, "500"],
    [/semi\s*bold|demi\s*bold/, "600"],
    [/extra\s*bold|ultrabold/, "800"],
    [/\bbold/, "700"],
    [/black|heavy/, "900"],
  ];
  for (const [re, w] of map) if (re.test(n)) return w;
  return undefined;
}

/**
 * Convert a font asset to the CustomFontFace a theme carries. The asset's
 * `url` is the permanent public bucket URL (supabase-adapter mints it on
 * list), so the face stays renderable in shares and cross-origin embeds
 * without signing.
 */
export function assetToFontFace(asset: Asset): CustomFontFace | null {
  if (!asset.url) return null;
  const family = fontFamilyFromFileName(asset.name);
  return {
    family,
    url: asset.url,
    format: fontFormatFromFileName(asset.name),
    weight: guessWeight(family),
    category: guessCategory(family),
    assetId: asset.id,
  };
}
