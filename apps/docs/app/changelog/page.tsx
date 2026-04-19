import { SiteHeader } from "@/components/site-header";
import { parseChangelog } from "@/lib/changelog";
import { ChangelogContent } from "./changelog-content";

export const metadata = {
  title: "Changelog | Grade Design System",
  description: "All notable changes to @gradeui/ui",
};

export default function ChangelogPage() {
  const changelog = parseChangelog();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto py-8 px-4 md:px-8 w-full">
        <ChangelogContent changelog={changelog} />
      </main>
    </div>
  );
}
