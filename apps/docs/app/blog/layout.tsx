import Link from "next/link";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight hover:opacity-80"
          >
            Grade
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/blog" className="hover:text-foreground">
              Blog
            </Link>
            <Link href="/docs" className="hover:text-foreground">
              Docs
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
