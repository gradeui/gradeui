import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/* The Sites content model, file-backed for the POC.
   A page is an ordered stack of sections (STUDIO-SITES / STUDIO-SECTIONS).
   Each section is a typed object discriminated by `type`; the renderer maps
   it to a Grade composition. Swap this `glob` loader for a Payload loader
   later and nothing downstream changes. */

const action = z.object({
  label: z.string(),
  href: z.string().default("#"),
  variant: z.enum(["default", "outline", "raised"]).optional(),
});

// Shared per-section knobs: colour treatment (a surface `scope` OR the
// `expressive` accent layer) + the Container measure (`maxW`).
const colour = {
  // Container max-width for this band's measure (omit for the per-type default).
  maxW: z.enum(["sm", "md", "lg", "xl", "prose", "full"]).optional(),
  // Scroll-in reveal for this band (token-driven motion; omit for none).
  reveal: z.enum(["fade", "fade-up", "fade-down", "fade-left", "fade-right"]).optional(),
  scope: z.enum(["default", "inverse", "brand", "accent", "muted", "card"]).optional(),
  expressive: z
    .object({
      accent: z.enum(["accent1", "accent2", "accent3", "accent4", "accent5"]),
      tier: z.enum(["superlight", "light", "dark", "superdark"]).default("light"),
    })
    .optional(),
};

const section = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    ...colour,
    eyebrow: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    actions: z.array(action).optional(),
    media: z.object({ hint: z.string(), aspect: z.string().optional() }).optional(),
  }),
  z.object({
    type: z.literal("logos"),
    ...colour,
    title: z.string().optional(),
    items: z.array(z.string()),
  }),
  z.object({
    type: z.literal("features"),
    ...colour,
    eyebrow: z.string().optional(),
    title: z.string(),
    items: z.array(
      z.object({ title: z.string(), body: z.string(), hint: z.string().optional() }),
    ),
  }),
  z.object({
    type: z.literal("pricing"),
    ...colour,
    eyebrow: z.string().optional(),
    title: z.string(),
    plans: z.array(
      z.object({
        name: z.string(),
        price: z.string(),
        blurb: z.string().optional(),
        featured: z.boolean().default(false),
      }),
    ),
  }),
  z.object({
    type: z.literal("testimonial"),
    ...colour,
    quote: z.string(),
    author: z.string().optional(),
  }),
  z.object({
    type: z.literal("media"),
    ...colour,
    title: z.string().optional(),
    hint: z.string().default("landscape"),
    aspect: z.string().optional(),
  }),
  z.object({
    type: z.literal("cta"),
    ...colour,
    title: z.string(),
    body: z.string().optional(),
    action: action.optional(),
  }),
  // A LISTING band: pulls every entry from a collection (products, articles…)
  // and renders linked cards. Each entry also gets its own detail page. This is
  // the "many repeatable things" half of a CMS, the counterpart to bespoke pages.
  z.object({
    type: z.literal("collection"),
    ...colour,
    eyebrow: z.string().optional(),
    title: z.string(),
    source: z.enum(["products", "articles"]),
  }),
  // A normally-themed band whose CARDS each carry their own expressive accent —
  // proof the accent layer composes at any level, not just whole sections.
  z.object({
    type: z.literal("accentCards"),
    ...colour,
    eyebrow: z.string().optional(),
    title: z.string(),
    cards: z.array(
      z.object({
        title: z.string(),
        body: z.string(),
        accent: z.enum(["accent1", "accent2", "accent3", "accent4", "accent5"]),
        tier: z.enum(["superlight", "light", "dark", "superdark"]).default("light"),
      }),
    ),
  }),
]);

const pages = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    theme: z.string().optional(), // data-grade-theme id
    sections: z.array(section),
  }),
});

/* Repeatable entries. Each file is one product; it gets a detail page at
   /products/<filename> and can be listed by a `collection` section. `articles`
   is wired the same way (define a loader + drop files in src/content/articles). */
const products = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/products" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    price: z.string().optional(),
    hint: z.string().default("product"),
    body: z.string().optional(),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    hint: z.string().default("landscape"),
    body: z.string().optional(),
  }),
});

export const collections = { pages, products, articles };
