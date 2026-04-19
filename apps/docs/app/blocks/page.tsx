"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlockPreview } from "@/components/block-preview";
import {
  blocksList,
  blockCategories,
  getBlocksByCategory,
} from "@/lib/blocks-list";
import { ArrowRight, Blocks, Copy, Check, Play, Layout } from "lucide-react";

export default function BlocksPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredBlocks = getBlocksByCategory(selectedCategory);

  const handleCopyCode = (blockId: string, code: string | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!code) return;

    navigator.clipboard.writeText(code);
    setCopiedId(blockId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 lg:py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Blocks className="h-8 w-8 text-primary" />
                <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
                  Blocks
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-3xl mt-2">
                Flexible marketing sections built with the SectionBlock component.
                Configure with props, add custom content, and maintain consistency
                across your site.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/blocks/play">
                <Button size="lg" variant="outline" className="hidden md:flex">
                  <Play className="h-4 w-4 mr-2" />
                  Playground
                </Button>
              </Link>
              <Link href="/blocks/builder">
                <Button size="lg" className="hidden md:flex">
                  <Layout className="h-4 w-4 mr-2" />
                  Page Builder
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex gap-2 md:hidden">
            <Link href="/blocks/play" className="flex-1">
              <Button size="sm" variant="outline" className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Playground
              </Button>
            </Link>
            <Link href="/blocks/builder" className="flex-1">
              <Button size="sm" className="w-full">
                <Layout className="h-4 w-4 mr-2" />
                Builder
              </Button>
            </Link>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {blockCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Blocks Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredBlocks.map((block) => (
            <Card
              key={block.id}
              className="overflow-hidden transition-all duration-200 border-border hover:border-primary hover:shadow-lg group"
            >
              {/* Preview */}
              <div className="border-b border-border bg-muted/10">
                <BlockPreview blockId={block.id} />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                      {block.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {block.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {block.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {block.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-md bg-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => handleCopyCode(block.id, block.codeExample, e)}
                  >
                    {copiedId === block.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <Link href={`/blocks/${block.id}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full">
                      <span>View Full</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredBlocks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No blocks found for the selected category.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSelectedCategory("All")}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
