import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionBlock } from "@/components/ui/section-block";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getBlockById } from "@/lib/blocks-list";
import { ArrowLeft, Copy } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

interface BlockDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BlockDetailPage({ params }: BlockDetailPageProps) {
  const { id } = await params;
  const block = getBlockById(id);

  if (!block) {
    notFound();
  }

  // Render appropriate content based on contentExample type
  const renderContent = () => {
    if (!block.contentExample) return null;

    switch (block.contentExample) {
      case "image":
        return (
          <div className="mt-8 rounded-lg overflow-hidden border bg-muted/30">
            <div className="w-full aspect-[2/1] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <svg
                className="w-32 h-32 text-muted-foreground/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        );

      case "accordion":
        return (
          <Accordion
            type="single"
            collapsible
            className="w-full max-w-3xl mx-auto"
          >
            <AccordionItem value="1">
              <AccordionTrigger>What is Ramp?</AccordionTrigger>
              <AccordionContent>
                Ramp is a comprehensive design system that helps you
                build beautiful, accessible interfaces from a single
                dashboard.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>How does pricing work?</AccordionTrigger>
              <AccordionContent>
                We offer flexible pricing based on your usage and requirements.
                Contact our sales team for a custom quote.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Is there a free trial?</AccordionTrigger>
              <AccordionContent>
                Yes! We offer a 14-day free trial with full access to all
                features.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="4">
              <AccordionTrigger>What support do you offer?</AccordionTrigger>
              <AccordionContent>
                We provide 24/7 email support, live chat during business hours,
                and dedicated account management for enterprise customers.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );

      case "grid":
        return (
          <div className="grid gap-6 md:grid-cols-3 mt-8">
            {[
              {
                title: "Beautiful by Default",
                description:
                  "Track projects, deploys, and usage in real-time",
              },
              {
                title: "Smart Optimization",
                description:
                  "AI-powered suggestions to improve your workflow",
              },
              {
                title: "Easy Integration",
                description:
                  "Connect with existing systems and devices seamlessly",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-lg border bg-card space-y-3"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <div className="w-6 h-6 rounded bg-primary/30" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/blocks">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blocks
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">{block.name}</h1>
              <p className="text-sm text-muted-foreground">
                {block.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Preview</h2>
          </div>
          <div className="border rounded-lg overflow-hidden bg-background">
            <SectionBlock {...block.config}>{renderContent()}</SectionBlock>
          </div>
        </div>

        {/* Code */}
        {block.codeExample && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Code</h2>
              <CopyButton value={block.codeExample} />
            </div>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-muted/50 border overflow-x-auto">
                <code className="text-sm font-mono">{block.codeExample}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Usage Notes */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h3 className="font-semibold mb-2">Usage Notes</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              Import the SectionBlock component from{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                @/components/ui/section-block
              </code>
            </li>
            <li>Customize props to match your design requirements</li>
            <li>
              Use the <code className="text-xs bg-muted px-1 py-0.5 rounded">children</code> prop to
              add custom content
            </li>
            <li>All variants support responsive design out of the box</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
