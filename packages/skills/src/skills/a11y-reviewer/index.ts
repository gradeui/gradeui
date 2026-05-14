import { loadSkill } from "../../loader";
import schema, {
  type A11yReviewerInput,
  type A11yReviewerOutput,
} from "./schema";

export type { A11yReviewerInput, A11yReviewerOutput };

export const loadA11yReviewerSkill = () =>
  loadSkill<A11yReviewerInput, A11yReviewerOutput>(import.meta.url, schema);
