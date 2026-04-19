"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { SearchCommand, SearchTrigger } from "@/components/search-command";
import { MobileNav } from "@/components/mobile-nav";
import { RampThemeSwitcher } from "@/components/ramp-theme-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navItems = [
    { href: "/docs", label: "Docs" },
    { href: "/components", label: "Components" },
    { href: "/templates", label: "Templates" },
    { href: "/blocks", label: "Blocks" },
    { href: "/play", label: "Playground" },
    { href: "/brand", label: "Brand" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 md:px-8 relative">
          <div className="flex shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <Logo variant="full" size="xs" className="md:hidden" />
              <Logo variant="full" size="sm" className="hidden md:block" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname?.startsWith(item.href)
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <SearchTrigger onClick={() => setSearchOpen(true)} />

            <div className="hidden md:flex items-center gap-2">
              <RampThemeSwitcher />
              <ThemeToggle />
            </div>
            <MobileNav />
          </div>
        </div>
      </header>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
