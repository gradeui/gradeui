"use client";

import React, { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TemplatePreview } from "@/components/template-preview";
import { getTemplateById, templatesList } from "@/lib/templates-list";
import { getTemplateCode } from "@/lib/template-code";
import { ArrowLeft, Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";

interface TemplatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TemplatePage({ params }: TemplatePageProps) {
  const { id } = React.use(params);
  const template = getTemplateById(id);
  const [copied, setCopied] = useState(false);

  if (!template) {
    notFound();
  }

  const templateCodeStr = getTemplateCode(id);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(templateCodeStr);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/templates">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
                {template.name}
              </h1>
              {template.featured && (
                <Badge variant="secondary">Featured</Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {template.description}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Preview</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleCopyCode}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
            <Link href={`/templates/${id}/view`}>
              <Button size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Full Page
              </Button>
            </Link>
          </div>
        </div>

        <Card className="overflow-hidden">
          <TemplatePreview templateId={template.id} />
        </Card>
      </div>

      {/* Implementation */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Implementation</h2>
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Components Used</h3>
              <p className="text-sm text-muted-foreground">
                This template uses the following components from the Grade Design System:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {getComponentsForTemplate(template.id).map((component) => (
                  <Link key={component} href={`/components/${component.toLowerCase()}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {component}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Installation</h3>
              <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                <code>npm install @grade/ui</code>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Usage</h3>
              <p className="text-sm text-muted-foreground">
                Copy the code below and customize it to fit your needs. All components are
                fully documented in the Components section.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Related Templates */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Related Templates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templatesList
            .filter(
              (t) =>
                t.id !== template.id &&
                (t.category === template.category ||
                  t.tags.some((tag) => template.tags.includes(tag)))
            )
            .slice(0, 3)
            .map((relatedTemplate) => (
              <Link key={relatedTemplate.id} href={`/templates/${relatedTemplate.id}`}>
                <Card className="overflow-hidden transition-all duration-200 border-border hover:border-primary hover:shadow-lg">
                  <div className="border-b border-border">
                    <TemplatePreview templateId={relatedTemplate.id} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-base mb-1">
                      {relatedTemplate.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {relatedTemplate.description}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to determine which components are used in each template
function getComponentsForTemplate(templateId: string): string[] {
  const componentMap: Record<string, string[]> = {
    "usage-dashboard": ["Card", "Badge", "Button", "Chart", "Progress"],
    "site-overview": ["Card", "Badge", "Button"],
    "analytics-dashboard": ["Card", "Chart", "Badge", "Button", "Select"],
    "settings-page": ["Card", "Input", "Label", "Button", "Tabs", "Separator"],
    "user-profile": ["Card", "Avatar", "Badge", "Button", "Input"],
    "login-page": ["Card", "Input", "Label", "Button"],
    "signup-page": ["Card", "Input", "Label", "Button", "Checkbox"],
    "device-list": ["Card", "Badge", "Button", "Table", "Input"],
    "site-details": ["Card", "Tabs", "Badge", "Progress"],
    "ai-assistant": ["Card", "Input", "Badge", "AIChat", "Button"],
    "notifications-center": ["Card", "Badge", "Button", "Separator"],
    "product-landing": ["SectionBlock", "CardBlock", "Button", "Badge"],
    "pricing-page": ["SectionBlock", "CardBlock", "FAQBlock", "Button", "Badge"],
  };

  return componentMap[templateId] || ["Card", "Button"];
}
