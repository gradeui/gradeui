import { loadSkill } from "../../loader";
import schema, {
  type QaReviewerInput,
  type QaReviewerOutput,
} from "./schema";

export type { QaReviewerInput, QaReviewerOutput };

export const loadQaReviewerSkill = () =>
  loadSkill<QaReviewerInput, QaReviewerOutput>(import.meta.url, schema);
