import type { PostMeta } from "../posts";

// Plain metadata, kept separate from the (client) Body so the server pages
// can read it for SEO / listing without pulling the interactive embeds.
export const meta: PostMeta = {
  slug: "composable-shaders",
  title: "Shaders as a design-system primitive",
  date: "2026-06-18",
  excerpt:
    "How I turned generative shaders in Grade from one-off backgrounds into a composable, contract-driven system: a few base fields, a few stackable layers, and one schema that drives the uniforms, the controls, and AI generation alike.",
  readingMinutes: 6,
};
