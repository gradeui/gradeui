import { loadSkill } from "../../loader";
import schema, {
  type SeedCorpusGeneratorInput,
  type SeedCorpusGeneratorOutput,
} from "./schema";

export type { SeedCorpusGeneratorInput, SeedCorpusGeneratorOutput };

export const loadSeedCorpusGeneratorSkill = () =>
  loadSkill<SeedCorpusGeneratorInput, SeedCorpusGeneratorOutput>(
    import.meta.url,
    schema,
  );
