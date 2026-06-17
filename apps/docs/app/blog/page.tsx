import type { Metadata } from "next";
import Link from "next/link";
import { posts, formatPostDate } from "./posts";

export const metadata: Metadata = {
  title: "Blog — Grade",
  description: "Notes on building Grade: shaders, theming, design systems.",
};

export default function BlogIndex() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Notes on building Grade: shaders, theming, and design systems.
        </p>
      </header>

      <ul className="flex flex-col divide-y divide-border">
        {posts.map((post) => (
          <li key={post.slug} className="py-6 first:pt-0">
            <Link href={`/blog/${post.slug}`} className="group block">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-tight group-hover:underline">
                  {post.title}
                </h2>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatPostDate(post.date)}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
              {post.readingMinutes ? (
                <span className="mt-2 inline-block text-xs text-muted-foreground/70">
                  {post.readingMinutes} min read
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
