// @gradeui/ui/composer — the lexical-backed text composition surface, on its
// OWN entry rather than the main barrel.
//
// Why a subpath: Composer is the only component that depends on `lexical` +
// `lexical-beautiful-mentions`, whose published modules use extensionless /
// CJS shapes that strict ESM resolvers (Vite 8, plain Node) reject. Re-exporting
// Composer from `lib/index.ts` dragged lexical into the main barrel's static
// graph, so a consumer importing only `<Section>`/`<Button>` still loaded (and
// could crash on) lexical. Isolated here, the main entry is lexical-free and
// only `import … from "@gradeui/ui/composer"` pulls it in.
//
// The "use client" banner is injected by tsup's onSuccess (this entry is in the
// CLIENT_FILES list).
export {
  Composer,
  ComposerReply,
  type ComposerProps,
  type ComposerHandle,
  type ComposerContent,
  type ComposerStep,
  type ComposerFormat,
  type ComposerMentionItem,
  type ComposerTriggerConfig,
  type ComposerAttachmentConfig,
  type ComposerAttachment,
} from "../components/ui/composer";
