import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { posts, getPost, formatPostDate } from "../posts";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found — Grade" };
  return {
    title: `${post.title} — Grade`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [{ url: post.image ?? "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.image ?? "/og.png"],
    },
  };
}

// Dependency-free prose styling: style descendant elements so a post Body can
// use plain h2/p/ul/code/a and read consistently. (No typography plugin.)
const PROSE = [
  "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
  // Body copy reads at near-full contrast (foreground/85), not the light
  // muted token — long-form needs to be comfortably readable.
  "[&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-foreground/85",
  // Figures wrap code blocks, embeds, and images, with an optional caption.
  "[&_figure]:my-7",
  "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted-foreground",
  "[&_img]:w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border/60",
  // Lead paragraph — the first paragraph reads larger and full-contrast, set
  // apart from the muted body, with a drop cap on its first letter. Purely a
  // wrapper concern, so a post author just writes a normal first paragraph.
  "[&>p:first-of-type]:text-lg [&>p:first-of-type]:leading-relaxed [&>p:first-of-type]:text-foreground",
  // Drop cap — boxed: a filled square the letter sits inside. `leading-none`
  // + matched py make the box height equal the cap, and `mt-[0.1em]` nudges
  // its top onto the body's first-line cap height so it lines up. Swap the
  // bg/text/border classes for a bordered or plain variant.
  "[&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-[0.05em] [&>p:first-of-type]:first-letter:rounded-md [&>p:first-of-type]:first-letter:bg-foreground [&>p:first-of-type]:first-letter:px-3 [&>p:first-of-type]:first-letter:py-2 [&>p:first-of-type]:first-letter:text-[2.4em] [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:leading-none [&>p:first-of-type]:first-letter:text-background",
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5",
  "[&_li]:leading-relaxed [&_li]:text-muted-foreground",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-foreground",
  "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:text-foreground/90",
].join(" ");

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const { Body } = post;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All posts
      </Link>

      <article className="mt-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {post.title}
          </h1>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            {post.readingMinutes ? <span>· {post.readingMinutes} min read</span> : null}
          </div>
        </header>
        <div className={PROSE}>
          <Body />
        </div>
      </article>
    </main>
  );
}
