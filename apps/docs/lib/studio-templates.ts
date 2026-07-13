/**
 * Host-side studio templates — the playbook's pure-data templates joined
 * to their Lucide icons.
 *
 * The playbook (`@gradeui/studio/playbook`) ships the id/label/description/
 * prompt (pure data, zero-runtime-dep). The host app joins each entry to a
 * `LucideIcon` via `studio-template-icons.ts` and exposes the combined shape
 * here for UI consumers (`<EmptyState>`, `<TemplateChips>` in
 * `components/studio/studio-chat.tsx`).
 *
 * If you want to add a template: add the data entry to
 * `packages/studio/src/playbook/templates/index.ts`, then add its icon to
 * `studio-template-icons.ts`. Don't fork the list here.
 */
import type { LucideIcon } from "lucide-react";

import { STUDIO_TEMPLATES as PLAYBOOK_TEMPLATES } from "@gradeui/studio/playbook";
import type {
  DesignSystemRegistry,
  RegistryTemplate,
} from "@gradeui/studio/registry";

import {
  STUDIO_TEMPLATE_ICONS,
  DEFAULT_TEMPLATE_ICON,
} from "./studio-template-icons";

/**
 * A registry template augmented with an `icon` field resolved from the
 * host-side icon map. This is what the studio chat UI expects. Two
 * kinds ride the same shape: `prompt` templates seed the chat input
 * (gradeui's originals); `source` templates apply their JSX directly
 * as the screen (external scaffolds — see RegistryTemplate).
 */
export interface StudioTemplate extends RegistryTemplate {
  icon: LucideIcon;
}

function withIcons(templates: readonly RegistryTemplate[]): StudioTemplate[] {
  return templates.map((t) => ({
    ...t,
    icon: STUDIO_TEMPLATE_ICONS[t.id] ?? DEFAULT_TEMPLATE_ICON,
  }));
}

/** gradeui's canonical set — kept for callers that are explicitly
 *  gradeui-scoped (docs pages). Studio surfaces should use
 *  `resolveStudioTemplates(registry)` instead. */
export const STUDIO_TEMPLATES: StudioTemplate[] = withIcons(PLAYBOOK_TEMPLATES);

/** The ACTIVE registry's starter templates, icon-joined. Registries
 *  without templates fall back to none (an empty picker beats showing
 *  gradeui prompts to a BrightLocal project — those prompts name
 *  gradeui components the BL model may not have). */
export function resolveStudioTemplates(
  registry: DesignSystemRegistry,
): StudioTemplate[] {
  return withIcons(registry.templates ?? []);
}
