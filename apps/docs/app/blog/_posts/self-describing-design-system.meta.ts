import type { PostMeta } from "../posts";

// Plain metadata, kept separate from the (client) Body so the server pages
// can read it for SEO / listing without pulling any interactive embeds.
export const meta: PostMeta = {
  slug: "self-describing-design-system",
  title: "A design system that explains itself",
  date: "2026-06-24",
  excerpt:
    "An agent installed Grade and built a page out of raw divs, not because the components were missing, but because nothing in the package told it they existed. Here is how I made the package self-describing: a generated DESIGN.md, foundation rules that aren't components, a cache-shaped prompt, and a CI gate that fails if a consumer wouldn't get the full picture.",
  readingMinutes: 7,
};
