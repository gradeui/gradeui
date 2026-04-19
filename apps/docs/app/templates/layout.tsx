"use client";

import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="max-w-7xl mx-auto flex-1 px-4 md:px-8 w-full">
        <main className="relative py-6 lg:py-8">
          <div className="w-full min-w-0">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
