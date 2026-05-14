import { loadSkill } from "../../loader";
import schema, {
  type ResponsiveReviewerInput,
  type ResponsiveReviewerOutput,
  type ViewportSnapshot,
} from "./schema";

export type {
  ResponsiveReviewerInput,
  ResponsiveReviewerOutput,
  ViewportSnapshot,
};

export const loadResponsiveReviewerSkill = () =>
  loadSkill<ResponsiveReviewerInput, ResponsiveReviewerOutput>(
    import.meta.url,
    schema,
  );
