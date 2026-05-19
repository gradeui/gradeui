/**
 * @gradeui/contracts — public entry.
 *
 * One import, two things:
 *   1. The `contract()` helper for declaring component contracts.
 *   2. The types every consumer (Studio panel, playbook, runtime
 *      validation) reads.
 *
 * The package has zero runtime side effects — it's a vocabulary of
 * types + an identity-function helper. Importing it costs ~nothing
 * at runtime; the cost is whatever a consumer does WITH the contracts
 * it reads (Zod parsing, manifest flattening, etc.).
 *
 * Idiomatic usage:
 *
 *     // packages/ui/components/ui/button.contract.ts
 *     import { z } from "zod";
 *     import { contract } from "@gradeui/contracts";
 *
 *     export const ButtonContract = contract({
 *       name: "Button",
 *       description: "Any clickable action.",
 *       props: {
 *         variant: {
 *           schema: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]),
 *           design: "knob",
 *           default: "default",
 *           label: "Style",
 *         },
 *         size: {
 *           schema: z.enum(["default", "sm", "lg", "icon"]),
 *           design: "knob",
 *           default: "default",
 *           control: "toggle-group",
 *         },
 *         asChild: {
 *           schema: z.boolean().optional(),
 *           design: "plumbing",
 *         },
 *         onClick: {
 *           schema: z.function().optional(),
 *           design: "event",
 *         },
 *       },
 *     });
 */

export { contract } from "./contract";
export type {
  ActionContract,
  ComponentContract,
  Control,
  Design,
  InferProps,
  PropContract,
} from "./types";
