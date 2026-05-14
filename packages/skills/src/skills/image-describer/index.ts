/**
 * image-describer skill — barrel.
 *
 * Each skill exports a single `loadImageDescriberSkill()` (or named equivalent)
 * that the package-level registry calls once at startup. This keeps the
 * dependency graph statically traceable for bundlers.
 */

import { loadSkill } from "../../loader";
import schema, {
  type ImageDescriberInput,
  type ImageDescriberOutput,
} from "./schema";

export type { ImageDescriberInput, ImageDescriberOutput };

export const loadImageDescriberSkill = () =>
  loadSkill<ImageDescriberInput, ImageDescriberOutput>(import.meta.url, schema);
