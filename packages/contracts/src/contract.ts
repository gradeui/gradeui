/**
 * The `contract()` helper.
 *
 * Identity function with type narrowing — returns the input unchanged
 * but constrains it to `ComponentContract` so TypeScript reports errors
 * at the declaration site rather than the consumer site:
 *
 *     export const ButtonContract = contract({
 *       name: "Button",
 *       description: "Any clickable action.",
 *       props: {
 *         variant: { schema: z.enum([...]), design: "knob" },
 *         //                                ^ TS errors here if the
 *         //                                  taxonomy literal is wrong
 *         asChild: { schema: z.boolean(), design: "plumbing" },
 *       },
 *     });
 *
 * Why a helper at all (rather than just `as const`):
 *   - The Zod schemas are objects, not literals, so `as const` doesn't
 *     give us the generic narrowing we want. The helper preserves the
 *     per-prop generic so `z.infer<typeof contract.props.foo.schema>`
 *     keeps each prop's specific type.
 *   - Future versions can add validation here (e.g. "every prop with
 *     `design: 'knob'` needs a `label`") without changing the call site.
 */

import type { ComponentContract, PropContract } from "./types";

export function contract<P extends Record<string, PropContract>>(
  c: ComponentContract<P>,
): ComponentContract<P> {
  return c;
}
