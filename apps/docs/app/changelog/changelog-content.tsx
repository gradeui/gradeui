"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Rss, Search, Link as LinkIcon, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChangelogEntry, ChangeType, ChangeCategory } from "@/lib/changelog";

interface ChangelogContentProps {
  changelog: ChangelogEntry[];
}

const typeFilters: { value: ChangeType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "breaking", label: "Breaking" },
  { value: "added", label: "Added" },
  { value: "changed", label: "Changed" },
  { value: "fixed", label: "Fixed" },
  { value: "deprecated", label: "Deprecated" },
  { value: "removed", label: "Removed" },
];

const categoryFilters: { value: ChangeCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "component", label: "Components" },
  { value: "token", label: "Tokens" },
  { value: "brand", label: "Brand" },
  { value: "docs", label: "Docs" },
];

const typeBadgeVariant: Record<ChangeType, string> = {
  added: "success-soft",
  fixed: "info-soft",
  changed: "secondary",
  deprecated: "warning-soft",
  removed: "destructive-soft",
  breaking: "destructive-soft",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ChangelogContent({ changelog }: ChangelogContentProps) {
  const [typeFilter, setTypeFilter] = useState<ChangeType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ChangeCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [copiedVersion, setCopiedVersion] = useState<string | null>(null);

  const filteredChangelog = useMemo(() => {
    return changelog
      .map((entry) => {
        let filteredChanges = entry.changes;

        if (typeFilter !== "all") {
          filteredChanges = filteredChanges.filter((c) => c.type === typeFilter);
        }

        if (categoryFilter !== "all") {
          filteredChanges = filteredChanges.filter((c) => c.category === categoryFilter);
        }

        if (search) {
          const searchLower = search.toLowerCase();
          filteredChanges = filteredChanges.filter((c) =>
            c.description.toLowerCase().includes(searchLower)
          );
        }

        return {
          ...entry,
          changes: filteredChanges,
        };
      })
      .filter((entry) => entry.changes.length > 0);
  }, [changelog, typeFilter, categoryFilter, search]);

  const copyLink = async (version: string) => {
    const url = `${window.location.origin}/changelog#v${version}`;
    await navigator.clipboard.writeText(url);
    setCopiedVersion(version);
    setTimeout(() => setCopiedVersion(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
            Changelog
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            All notable changes to <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">@grade/ui</code>
          </p>
        </div>
        <Link
          href="/changelog.xml"
          target="_blank"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Rss className="h-4 w-4" />
          RSS Feed
        </Link>
      </div>

      {/* Subscribe Info */}
      <div className="rounded-lg border p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Stay updated:</strong> Subscribe to the RSS feed at{" "}
          <code className="text-xs font-mono bg-background px-1.5 py-0.5 rounded border">
            /changelog.xml
          </code>{" "}
          using Slack, Discord, Teams, or any RSS reader.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search changes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground py-1">Type:</span>
          {typeFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={typeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(filter.value)}
              className="h-7"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground py-1">Category:</span>
          {categoryFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={categoryFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(filter.value)}
              className="h-7"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(typeFilter !== "all" || categoryFilter !== "all" || search) && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredChangelog.reduce((acc, e) => acc + e.changes.length, 0)} changes across{" "}
          {filteredChangelog.length} versions
        </p>
      )}

      {/* Changelog entries */}
      <div className="space-y-12">
        {filteredChangelog.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No changes match your filters.</p>
            <Button
              variant="link"
              onClick={() => {
                setTypeFilter("all");
                setCategoryFilter("all");
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          filteredChangelog.map((entry) => (
            <article
              key={entry.version}
              id={`v${entry.version}`}
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-semibold">v{entry.version}</h2>
                <time className="text-sm text-muted-foreground">
                  {formatDate(entry.date)}
                </time>
                <button
                  onClick={() => copyLink(entry.version)}
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Copy link to version"
                >
                  {copiedVersion === entry.version ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="space-y-2 pl-4 border-l-2 border-border">
                {entry.changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-3 py-1">
                    <Badge
                      variant={typeBadgeVariant[change.type] as "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "success-soft" | "warning-soft" | "destructive-soft" | "info-soft"}
                      className="shrink-0 mt-0.5"
                    >
                      {change.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0 mt-1 font-mono">
                      [{change.category}]
                    </span>
                    <span className="text-sm">{change.description}</span>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-8 mt-12">
        <p className="text-sm text-muted-foreground text-center">
          This changelog follows{" "}
          <a
            href="https://keepachangelog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Keep a Changelog
          </a>{" "}
          and{" "}
          <a
            href="https://semver.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Semantic Versioning
          </a>
          .
        </p>
      </div>
    </div>
  );
}
