import { loadSkill } from "../../loader";
import schema, {
  type MobbinPatternExtractorInput,
  type MobbinPatternExtractorOutput,
} from "./schema";

export type { MobbinPatternExtractorInput, MobbinPatternExtractorOutput };

export const loadMobbinPatternExtractorSkill = () =>
  loadSkill<MobbinPatternExtractorInput, MobbinPatternExtractorOutput>(
    import.meta.url,
    schema,
  );
