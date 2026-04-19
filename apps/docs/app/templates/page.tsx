"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplatePreview } from "@/components/template-preview";
import {
  templatesList,
  templateCategories,
  templateTags,
  getTemplatesByCategory,
  getTemplatesByTag,
} from "@/lib/templates-list";
import { ArrowRight, Sparkles } from "lucide-react";

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredTemplates = selectedTag
    ? getTemplatesByTag(selectedTag)
    : getTemplatesByCategory(selectedCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Templates</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Production-ready templates built with Grade Design System components. Copy, customize,
          and ship faster.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {templateCategories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedCategory(category);
              setSelectedTag(null);
            }}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Tag Filter (Optional) */}
      {selectedTag && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by tag:</span>
          <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedTag(null)}>
            {selectedTag} ×
          </Badge>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Link key={template.id} href={template.href} className="group block">
            <Card className="overflow-hidden transition-all duration-200 border-border group-hover:border-primary group-hover:shadow-lg">
              {/* Preview */}
              <div className="border-b border-border">
                <TemplatePreview templateId={template.id} />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    {template.featured && (
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <button
                      key={tag}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedTag(tag);
                        setSelectedCategory("All");
                      }}
                      className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{template.category}</span>
                  <div className="flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found for the selected filters.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSelectedCategory("All");
              setSelectedTag(null);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
