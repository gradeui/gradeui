import { loadSkill } from "../../loader";
import schema, {
  type LearnFromSessionInput,
  type LearnFromSessionOutput,
  type SessionEvent,
} from "./schema";

export type { LearnFromSessionInput, LearnFromSessionOutput, SessionEvent };

export const loadLearnFromSessionSkill = () =>
  loadSkill<LearnFromSessionInput, LearnFromSessionOutput>(
    import.meta.url,
    schema,
  );
