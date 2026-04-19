import { SectionBlock } from "@/components/ui/section-block";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getBlockById, type Block } from "@/lib/blocks-list";

interface BlockPreviewProps {
  blockId: string;
  className?: string;
}

export function BlockPreview({ blockId, className }: BlockPreviewProps) {
  const block = getBlockById(blockId);

  if (!block) {
    return (
      <div className="w-full h-[400px] border border-border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Block not found</p>
      </div>
    );
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
                className="w-24 h-24 text-muted-foreground/40"
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
                Ramp is a comprehensive energy management platform that helps you
                monitor, optimize, and control your energy systems from a single
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
          </Accordion>
        );

      case "grid":
        return (
          <div className="grid gap-6 md:grid-cols-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-lg border bg-card space-y-2"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <div className="w-5 h-5 rounded bg-primary/30" />
                </div>
                <h3 className="font-semibold text-sm">Feature {i}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Description of the feature and its benefits
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
    <div
      className={`w-full h-[400px] border border-border rounded-lg overflow-hidden ${className}`}
    >
      <div className="w-full h-full overflow-auto bg-background">
        <div className="min-h-full flex items-center">
          <SectionBlock {...block.config}>{renderContent()}</SectionBlock>
        </div>
      </div>
    </div>
  );
}
