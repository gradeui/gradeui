import Link from "next/link";
import { PERSONAS } from "@/lib/personas";
import { SCREENS, hrefFor } from "@/lib/screens";

/**
 * Demo home: pick a persona, land on the Reviews hub. Also lists every
 * promoted screen and variant so a reviewer can deep-link. Deliberately
 * plain: this page is the door, not the product.
 */
export default function Home() {
  const primary = SCREENS.filter((s) => !s.variantOf);
  const variants = SCREENS.filter((s) => s.variantOf);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">BrightLocal replatform prototype</p>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Reviews
        </h1>
        <p className="text-muted-foreground max-w-prose">
          A prototype of the Reviews area on the published BrightLocal component
          library. Pick who you are, then press <kbd className="rounded border px-1.5 py-0.5 text-xs">Cmd K</kbd>{" "}
          anywhere to switch persona, layout or screen.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Start as</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PERSONAS.map((p) => (
            <Link
              key={p.id}
              href={`/locations/${p.dataset}/reviews?persona=${p.id}`}
              className="bg-card hover:bg-accent flex flex-col gap-1 rounded-lg border p-4 transition-colors"
            >
              <span className="font-medium">{p.label}</span>
              <span className="text-muted-foreground text-sm">{p.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Screens</h2>
          <ul className="flex flex-col gap-1">
            {primary.map((s) => (
              <li key={s.path}>
                <Link className="text-link underline-offset-4 hover:underline" href={hrefFor(s, "minus-one-studios")}>
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Variations</h2>
          <ul className="flex flex-col gap-1">
            {variants.map((s) => (
              <li key={s.path}>
                <Link className="text-link underline-offset-4 hover:underline" href={hrefFor(s, "minus-one-studios")}>
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="text-muted-foreground flex gap-6 text-sm">
        <Link href="/settings" className="hover:underline">Settings</Link>
        <Link href="/docs" className="hover:underline">Proposed components and changes</Link>
      </footer>
    </main>
  );
}
