/**
 * Prompt-composition surface.
 *
 * Currently: just the base system prompt. Future additions land here —
 * selection-block formatters, edit-stanza builders, anything else that
 * shapes what the model reads per turn.
 */

export { buildSystemPrompt, EDIT_MODE_PROMPT } from "./system";
