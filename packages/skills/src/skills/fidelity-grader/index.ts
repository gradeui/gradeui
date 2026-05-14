import { loadSkill } from "../../loader";
import schema, {
  type FidelityGraderInput,
  type FidelityGraderOutput,
} from "./schema";

export type { FidelityGraderInput, FidelityGraderOutput };

export const loadFidelityGraderSkill = () =>
  loadSkill<FidelityGraderInput, FidelityGraderOutput>(import.meta.url, schema);
