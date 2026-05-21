import { loadSkill } from "../../loader";
import schema, {
  type AppBrief,
  type AppBriefInput,
  type AppBriefOutput,
} from "./schema";

export type { AppBrief, AppBriefInput, AppBriefOutput };

export const loadAppBriefSkill = () =>
  loadSkill<AppBriefInput, AppBriefOutput>(import.meta.url, schema);
