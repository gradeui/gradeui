import Link from "next/link";
import { cardFor, CARDS } from "@/lib/cards";
import { CutSceneCard } from "@/components/cut-scene-card";

/** One cut-scene card, full frame. The same component the capture stage
 *  renders during a recording, so the two can never drift. */
export default async function CardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = cardFor(slug);
  if (!card) {
    return (
      <div className="flex min-h-screen flex-col gap-3 p-10">
        <p className="text-heading-page">Cards</p>
        <ul className="flex flex-col gap-1">
          {CARDS.map((c) => (
            <li key={c.slug}>
              <Link className="underline underline-offset-4" href={`/meta/cards/${c.slug}`}>{c.slug}</Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <CutSceneCard card={card} />
    </main>
  );
}
