"use client";

import { useState } from "react";
import { SectionBlock } from "@/components/ui/section-block";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/copy-button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PaddingVariant = "none" | "sm" | "md" | "lg" | "xl";
type BackgroundVariant = "transparent" | "muted" | "card" | "gradient" | "primary";
type ContainerVariant = "default" | "wide" | "narrow" | "full";
type AlignmentVariant = "left" | "center" | "right";
type TitleSizeVariant = "sm" | "md" | "lg" | "xl";
type ContentType = "none" | "image" | "accordion" | "grid";

export default function BlocksPlaygroundPage() {
  // Configuration state
  const [padding, setPadding] = useState<PaddingVariant>("lg");
  const [background, setBackground] = useState<BackgroundVariant>("transparent");
  const [container, setContainer] = useState<ContainerVariant>("default");
  const [alignment, setAlignment] = useState<AlignmentVariant>("left");
  const [titleSize, setTitleSize] = useState<TitleSizeVariant>("lg");
  const [fullBleed, setFullBleed] = useState(false);
  const [contentType, setContentType] = useState<ContentType>("none");

  // Content state
  const [title, setTitle] = useState("Welcome to Ramp");
  const [subtitle, setSubtitle] = useState(
    "Modern design system — pick three hues, get an entire OKLCH-based design language"
  );
  const [showTitle, setShowTitle] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [showCTA1, setShowCTA1] = useState(true);
  const [showCTA2, setShowCTA2] = useState(true);

  // Render content based on type
  const renderContent = () => {
    switch (contentType) {
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
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            <AccordionItem value="1">
              <AccordionTrigger>What is Ramp?</AccordionTrigger>
              <AccordionContent>
                Ramp is a comprehensive design system that helps you
                build beautiful, accessible interfaces faster.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>How does it work?</AccordionTrigger>
              <AccordionContent>
                Our platform integrates with your existing infrastructure to provide
                real-time insights and automated optimization.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Is there a free trial?</AccordionTrigger>
              <AccordionContent>
                Yes! We offer a 14-day free trial with full access to all features.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );

      case "grid":
        return (
          <div className="grid gap-6 md:grid-cols-3 mt-8">
            {[
              { title: "Beautiful by Default", desc: "Components re-skin instantly when you swap themes" },
              { title: "Smart Optimization", desc: "AI-powered cost reduction" },
              { title: "Easy Integration", desc: "Connect existing systems" },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-lg border bg-card space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <div className="w-6 h-6 rounded bg-primary/30" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Generate code string
  const generateCode = () => {
    const props = [];
    if (padding !== "lg") props.push(`padding="${padding}"`);
    if (background !== "transparent") props.push(`background="${background}"`);
    if (container !== "default") props.push(`container="${container}"`);
    if (alignment !== "left") props.push(`alignment="${alignment}"`);
    if (titleSize !== "lg") props.push(`titleSize="${titleSize}"`);
    if (fullBleed) props.push(`fullBleed`);
    if (showTitle && title) props.push(`title="${title}"`);
    if (showSubtitle && subtitle) props.push(`subtitle="${subtitle}"`);
    if (showCTA1) props.push(`cta1={{ text: "Get Started", variant: "default" }}`);
    if (showCTA2) props.push(`cta2={{ text: "Learn More", variant: "outline" }}`);

    const propsString = props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : "";
    const contentString = contentType !== "none" ? `\n  {/* Add your content here */}\n` : "";

    return `<SectionBlock${propsString}>${contentString}</SectionBlock>`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <Link href="/blocks">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blocks
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">SectionBlock Playground</h1>
          <p className="text-sm text-muted-foreground">
            Experiment with different configurations in real-time
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
          {/* Controls */}
          <div className="space-y-6">
            <Card className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Layout</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Padding</Label>
                    <Select value={padding} onValueChange={(v) => setPadding(v as PaddingVariant)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Container</Label>
                    <Select value={container} onValueChange={(v) => setContainer(v as ContainerVariant)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (1280px)</SelectItem>
                        <SelectItem value="wide">Wide (1536px)</SelectItem>
                        <SelectItem value="narrow">Narrow (896px)</SelectItem>
                        <SelectItem value="full">Full Width</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Full Bleed</Label>
                    <Switch checked={fullBleed} onCheckedChange={setFullBleed} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Visual</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Background</Label>
                    <Select value={background} onValueChange={(v) => setBackground(v as BackgroundVariant)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transparent">Transparent</SelectItem>
                        <SelectItem value="muted">Muted</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Alignment</Label>
                    <Select value={alignment} onValueChange={(v) => setAlignment(v as AlignmentVariant)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Title Size</Label>
                    <Select value={titleSize} onValueChange={(v) => setTitleSize(v as TitleSizeVariant)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Content</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Title</Label>
                    <Switch checked={showTitle} onCheckedChange={setShowTitle} />
                  </div>

                  {showTitle && (
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title"
                      className="h-8 text-xs"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Subtitle</Label>
                    <Switch checked={showSubtitle} onCheckedChange={setShowSubtitle} />
                  </div>

                  {showSubtitle && (
                    <Input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Subtitle"
                      className="h-8 text-xs"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show CTA 1</Label>
                    <Switch checked={showCTA1} onCheckedChange={setShowCTA1} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show CTA 2</Label>
                    <Switch checked={showCTA2} onCheckedChange={setShowCTA2} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Content Slot</Label>
                    <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="accordion">Accordion (FAQ)</SelectItem>
                        <SelectItem value="grid">Feature Grid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Code Output */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Generated Code</h3>
                <CopyButton value={generateCode()} />
              </div>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                <code>{generateCode()}</code>
              </pre>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold">Live Preview</h3>
                <p className="text-xs text-muted-foreground">
                  Changes update in real-time
                </p>
              </div>
              <div className="border rounded-lg overflow-hidden bg-background">
                <SectionBlock
                  padding={padding}
                  background={background}
                  container={container}
                  alignment={alignment}
                  titleSize={titleSize}
                  fullBleed={fullBleed}
                  title={showTitle ? title : undefined}
                  subtitle={showSubtitle ? subtitle : undefined}
                  cta1={showCTA1 ? { text: "Get Started", variant: "default" } : undefined}
                  cta2={showCTA2 ? { text: "Learn More", variant: "outline" } : undefined}
                >
                  {renderContent()}
                </SectionBlock>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
