import { loadSkill } from "../../loader";
import schema, {
  type BrandReviewerInput,
  type BrandReviewerOutput,
} from "./schema";

export type { BrandReviewerInput, BrandReviewerOutput };

export const loadBrandReviewerSkill = () =>
  loadSkill<BrandReviewerInput, BrandReviewerOutput>(import.meta.url, schema);
