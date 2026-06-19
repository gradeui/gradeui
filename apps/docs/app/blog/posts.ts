/**
 * Blog registry. Each post is a `_posts/<slug>.tsx` module exporting `meta`
 * and a `Body` component. To add a post: create the file, then import it
 * here. Newest first. No CMS, no MDX pipeline — just typed TSX, styled by
 * the article wrapper in `[slug]/page.tsx`.
 */

import type { ComponentType } from "react";
import { meta as composableShaders } from "./_posts/composable-shaders.meta";
import { Body as ComposableShadersBody } from "./_posts/composable-shaders";

export interface PostMeta {
  slug: string;
  title: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  excerpt: string;
  readingMinutes?: number;
  /** Social share image (OpenGraph / Twitter), 1200×630. Path under
   *  `public/` (e.g. "/og/composable-shaders.png"). Falls back to the
   *  site-wide "/og.png" when unset. */
  image?: string;
}

export interface Post extends PostMeta {
  Body: ComponentType;
}

export const posts: Post[] = [
  { ...composableShaders, Body: ComposableShadersBody },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Human date, locale-pinned so SSR and client agree (no hydration drift). */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
