import Link from "next/link";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <nav className="text-muted-foreground flex flex-wrap gap-5 text-sm">
        <Link href="/" className="hover:underline">Demo home</Link>
        <Link href="/docs" className="hover:underline">Docs</Link>
        <Link href="/docs/components" className="hover:underline">Proposed components</Link>
        <Link href="/docs/changes" className="hover:underline">Proposed changes to the DS</Link>
      </nav>
      {children}
    </main>
  );
}
