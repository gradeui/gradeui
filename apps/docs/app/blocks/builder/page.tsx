"use client";

import { useState } from "react";
import { useRampTheme } from "@/components/ramp-theme-provider";
import { SectionBlock } from "@/components/ui/section-block";
import { getBlockTheme, getBlockThemeOptions, applyBlockTheme, type BlockThemeId } from "@/lib/block-themes";
import type { SectionBlockProps } from "@/components/ui/section-block";
import { MediaBlock } from "@/components/ui/media-block";
import { CardBlock } from "@/components/ui/card-block";
import { FAQBlock } from "@/components/ui/faq-block";
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
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Code,
  Zap,
  Target,
  Link as LinkIcon,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PaddingVariant = "none" | "sm" | "md" | "lg" | "xl";
type BackgroundVariant =
  | "transparent"
  | "muted"
  | "card"
  | "gradient"
  | "primary";
type ContainerVariant = "default" | "wide" | "narrow" | "full";
type AlignmentVariant = "left" | "center" | "right";
type TitleSizeVariant = "sm" | "md" | "lg" | "xl";
type ContentBlockType = "none" | "media" | "cards" | "faq";
type MediaLayoutType = "single" | "carousel" | "grid" | "bento" | "sideBySide";
type CardLayoutType = "single" | "carousel" | "grid" | "bento" | "sideBySide";

interface BlockConfig {
  id: string;
  padding: PaddingVariant;
  background: BackgroundVariant;
  container: ContainerVariant;
  alignment: AlignmentVariant;
  titleSize: TitleSizeVariant;
  fullBleed: boolean;
  contentBlockType: ContentBlockType;
  mediaLayout?: MediaLayoutType;
  cardLayout?: CardLayoutType;
  mediaItemCount?: number;
  cardItemCount?: number;
  mediaItemsPerPage?: number;
  mediaScrollBy?: number;
  cardItemsPerPage?: number;
  cardScrollBy?: number;
  title: string;
  subtitle: string;
  showTitle: boolean;
  showSubtitle: boolean;
  showCTA1: boolean;
  showCTA2: boolean;
}

export default function BlockBuilderPage() {
  const { isDark, setMode } = useRampTheme();
  const [blockTheme, setBlockTheme] = useState<BlockThemeId>("default");
  const [displayFont, setDisplayFont] = useState<string>("var(--font-sans)");
  const [headingFont, setHeadingFont] = useState<string>("var(--font-sans)");
  const [bodyFont, setBodyFont] = useState<string>("var(--font-sans)");
  const [blocks, setBlocks] = useState<BlockConfig[]>([
    {
      id: "1",
      padding: "xl",
      background: "transparent",
      container: "default",
      alignment: "center",
      titleSize: "xl",
      fullBleed: false,
      contentBlockType: "none",
      mediaLayout: "grid",
      cardLayout: "grid",
      mediaItemCount: 3,
      cardItemCount: 3,
      mediaItemsPerPage: 1,
      mediaScrollBy: 1,
      cardItemsPerPage: 1,
      cardScrollBy: 1,
      title: "Welcome to Ramp",
      subtitle: "Modern design system",
      showTitle: true,
      showSubtitle: true,
      showCTA1: true,
      showCTA2: true,
    },
  ]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("1");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  // Get current theme config and styles
  const currentTheme = getBlockTheme(blockTheme);
  const themeStyles = {
    ...applyBlockTheme(currentTheme, isDark),
    "--font-display": displayFont,
    "--font-heading": headingFont,
    "--font-body": bodyFont,
  } as React.CSSProperties;

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  // Update selected block
  const updateBlock = (updates: Partial<BlockConfig>) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === selectedBlockId ? { ...b, ...updates } : b
      )
    );
  };

  // Add new block
  const addBlock = () => {
    const newBlock: BlockConfig = {
      id: Date.now().toString(),
      padding: "lg",
      background: "transparent",
      container: "default",
      alignment: "left",
      titleSize: "lg",
      fullBleed: false,
      contentBlockType: "none",
      mediaLayout: "grid",
      cardLayout: "grid",
      mediaItemCount: 3,
      cardItemCount: 3,
      mediaItemsPerPage: 1,
      mediaScrollBy: 1,
      cardItemsPerPage: 1,
      cardScrollBy: 1,
      title: "New Section",
      subtitle: "Add your content here",
      showTitle: true,
      showSubtitle: true,
      showCTA1: false,
      showCTA2: false,
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  // Delete block
  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    if (selectedBlockId === id && newBlocks.length > 0) {
      setSelectedBlockId(newBlocks[0].id);
    }
  };

  // Move block up/down
  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    ) {
      return;
    }
    const newBlocks = [...blocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [
      newBlocks[newIndex],
      newBlocks[index],
    ];
    setBlocks(newBlocks);
  };

  // Render content based on type
  const renderContent = (block: BlockConfig) => {
    switch (block.contentBlockType) {
      case "media":
        const mediaCount = block.mediaItemCount || 3;
        const mediaItems = Array.from({ length: mediaCount }, (_, i) => ({
          type: "image" as const,
          src: `https://placehold.co/800x600/e5e7eb/6b7280?text=Image+${i + 1}`,
          aspectRatio: "video" as const,
        }));
        return (
          <MediaBlock
            layout={block.mediaLayout || "grid"}
            items={mediaItems}
            rounded="lg"
            showBorder
            itemsPerPage={block.mediaItemsPerPage || 1}
            scrollBy={block.mediaScrollBy || 1}
          />
        );

      case "cards":
        const cardCount = block.cardItemCount || 3;
        const cardTitles = [
          "Beautiful by Default",
          "Smart Optimization",
          "Easy Integration",
          "Usage Analytics",
          "Cost Tracking",
          "Custom Alerts",
          "Device Management",
          "Historical Data",
        ];
        const cardDescriptions = [
          "Track usage as it happens",
          "AI-powered cost reduction",
          "Connect existing systems",
          "Detailed insights and trends",
          "Monitor spending patterns",
          "Get notified of issues",
          "Control all devices",
          "Access complete history",
        ];
        const cardIcons = [
          <Zap className="h-5 w-5 text-primary" />,
          <Target className="h-5 w-5 text-primary" />,
          <LinkIcon className="h-5 w-5 text-primary" />,
          <Zap className="h-5 w-5 text-primary" />,
          <Target className="h-5 w-5 text-primary" />,
          <LinkIcon className="h-5 w-5 text-primary" />,
          <Zap className="h-5 w-5 text-primary" />,
          <Target className="h-5 w-5 text-primary" />,
        ];
        const cardItems = Array.from({ length: cardCount }, (_, i) => ({
          icon: cardIcons[i % cardIcons.length],
          title: cardTitles[i % cardTitles.length],
          description: cardDescriptions[i % cardDescriptions.length],
        }));
        return (
          <CardBlock
            layout={block.cardLayout || "grid"}
            columns={3}
            items={cardItems}
            itemsPerPage={block.cardItemsPerPage || 1}
            scrollBy={block.cardScrollBy || 1}
          />
        );

      case "faq":
        return (
          <FAQBlock
            type="single"
            items={[
              {
                question: "What is Ramp?",
                answer: "Ramp is a comprehensive design system that helps you build beautiful, accessible interfaces faster.",
              },
              {
                question: "How does pricing work?",
                answer: "We offer flexible pricing based on your usage and requirements. Contact our sales team for a custom quote.",
              },
              {
                question: "Is there a free trial?",
                answer: "Yes! We offer a 14-day free trial with full access to all features.",
              },
            ]}
          />
        );

      default:
        return null;
    }
  };

  // Generate code for all blocks
  const generateCode = () => {
    return blocks
      .map((block) => {
        const props = [];
        if (block.padding !== "lg") props.push(`padding="${block.padding}"`);
        if (block.background !== "transparent")
          props.push(`background="${block.background}"`);
        if (block.container !== "default")
          props.push(`container="${block.container}"`);
        if (block.alignment !== "left")
          props.push(`alignment="${block.alignment}"`);
        if (block.titleSize !== "lg")
          props.push(`titleSize="${block.titleSize}"`);
        if (block.fullBleed) props.push(`fullBleed`);
        if (block.showTitle && block.title)
          props.push(`title="${block.title}"`);
        if (block.showSubtitle && block.subtitle)
          props.push(`subtitle="${block.subtitle}"`);
        if (block.showCTA1)
          props.push(`cta1={{ text: "Get Started", variant: "default" }}`);
        if (block.showCTA2)
          props.push(`cta2={{ text: "Learn More", variant: "outline" }}`);

        const propsString =
          props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : "";

        let contentString = "";
        if (block.contentBlockType === "media") {
          contentString = `\n  <MediaBlock\n    layout="${block.mediaLayout}"\n    items={[/* your media items */]}\n  />\n`;
        } else if (block.contentBlockType === "cards") {
          contentString = `\n  <CardBlock\n    layout="${block.cardLayout}"\n    items={[/* your card items */]}\n  />\n`;
        } else if (block.contentBlockType === "faq") {
          contentString = `\n  <FAQBlock\n    items={[/* your FAQ items */]}\n  />\n`;
        }

        return `<SectionBlock${propsString}>${contentString}</SectionBlock>`;
      })
      .join("\n\n");
  };

  if (!selectedBlock) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/blocks">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold">Page Builder</h1>
                <p className="text-xs text-muted-foreground">
                  Stack blocks and build your page
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode(isDark ? "light" : "dark")}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Select value={blockTheme} onValueChange={(v) => setBlockTheme(v as BlockThemeId)}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getBlockThemeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={viewMode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant={viewMode === "code" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("code")}
              >
                <Code className="h-4 w-4 mr-2" />
                Code
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          {/* Controls Sidebar */}
          <div className="space-y-3">
            {/* Blocks List */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Blocks ({blocks.length})</h3>
                <Button size="sm" variant="outline" onClick={addBlock}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-1.5">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={cn(
                      "p-2 rounded-md border cursor-pointer transition-colors",
                      selectedBlockId === block.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {block.title || `Block ${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {block.background !== "transparent"
                            ? block.background
                            : "transparent"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, "up");
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, "down");
                          }}
                          disabled={index === blocks.length - 1}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBlock(block.id);
                          }}
                          disabled={blocks.length === 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Block Settings */}
            <Card className="p-3 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto" data-lenis-prevent>
              <div>
                <h3 className="font-semibold mb-2 text-sm">Layout</h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Padding</Label>
                    <Select
                      value={selectedBlock.padding}
                      onValueChange={(v) =>
                        updateBlock({ padding: v as PaddingVariant })
                      }
                    >
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

                  <div className="space-y-1">
                    <Label className="text-xs">Container</Label>
                    <Select
                      value={selectedBlock.container}
                      onValueChange={(v) =>
                        updateBlock({ container: v as ContainerVariant })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="wide">Wide</SelectItem>
                        <SelectItem value="narrow">Narrow</SelectItem>
                        <SelectItem value="full">Full Width</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 text-sm">Visual</h3>
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Background</Label>
                    <Select
                      value={selectedBlock.background}
                      onValueChange={(v) =>
                        updateBlock({ background: v as BackgroundVariant })
                      }
                    >
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
                    <Select
                      value={selectedBlock.alignment}
                      onValueChange={(v) =>
                        updateBlock({ alignment: v as AlignmentVariant })
                      }
                    >
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
                    <Select
                      value={selectedBlock.titleSize}
                      onValueChange={(v) =>
                        updateBlock({ titleSize: v as TitleSizeVariant })
                      }
                    >
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
                <h3 className="font-semibold mb-2 text-sm">Typography</h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Display Font</Label>
                    <Select value={displayFont} onValueChange={setDisplayFont}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="var(--font-sans)">Satoshi (Default)</SelectItem>
                        <SelectItem value="var(--font-inter)">Inter</SelectItem>
                        <SelectItem value="var(--font-fraunces)">Fraunces</SelectItem>
                        <SelectItem value="var(--font-space-grotesk)">Space Grotesk</SelectItem>
                        <SelectItem value="var(--font-plus-jakarta)">Plus Jakarta Sans</SelectItem>
                        <SelectItem value="var(--font-outfit)">Outfit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Heading Font</Label>
                    <Select value={headingFont} onValueChange={setHeadingFont}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="var(--font-sans)">Satoshi (Default)</SelectItem>
                        <SelectItem value="var(--font-inter)">Inter</SelectItem>
                        <SelectItem value="var(--font-fraunces)">Fraunces</SelectItem>
                        <SelectItem value="var(--font-space-grotesk)">Space Grotesk</SelectItem>
                        <SelectItem value="var(--font-plus-jakarta)">Plus Jakarta Sans</SelectItem>
                        <SelectItem value="var(--font-outfit)">Outfit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Body Font</Label>
                    <Select value={bodyFont} onValueChange={setBodyFont}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="var(--font-sans)">Satoshi (Default)</SelectItem>
                        <SelectItem value="var(--font-inter)">Inter</SelectItem>
                        <SelectItem value="var(--font-fraunces)">Fraunces</SelectItem>
                        <SelectItem value="var(--font-space-grotesk)">Space Grotesk</SelectItem>
                        <SelectItem value="var(--font-plus-jakarta)">Plus Jakarta Sans</SelectItem>
                        <SelectItem value="var(--font-outfit)">Outfit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 text-sm">Content</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Title</Label>
                    <Switch
                      checked={selectedBlock.showTitle}
                      onCheckedChange={(checked) =>
                        updateBlock({ showTitle: checked })
                      }
                    />
                  </div>

                  {selectedBlock.showTitle && (
                    <Input
                      value={selectedBlock.title}
                      onChange={(e) => updateBlock({ title: e.target.value })}
                      placeholder="Title"
                      className="h-8 text-xs"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Subtitle</Label>
                    <Switch
                      checked={selectedBlock.showSubtitle}
                      onCheckedChange={(checked) =>
                        updateBlock({ showSubtitle: checked })
                      }
                    />
                  </div>

                  {selectedBlock.showSubtitle && (
                    <Input
                      value={selectedBlock.subtitle}
                      onChange={(e) =>
                        updateBlock({ subtitle: e.target.value })
                      }
                      placeholder="Subtitle"
                      className="h-8 text-xs"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show CTA 1</Label>
                    <Switch
                      checked={selectedBlock.showCTA1}
                      onCheckedChange={(checked) =>
                        updateBlock({ showCTA1: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show CTA 2</Label>
                    <Switch
                      checked={selectedBlock.showCTA2}
                      onCheckedChange={(checked) =>
                        updateBlock({ showCTA2: checked })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Content Block</Label>
                    <Select
                      value={selectedBlock.contentBlockType}
                      onValueChange={(v) =>
                        updateBlock({ contentBlockType: v as ContentBlockType })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="cards">Cards</SelectItem>
                        <SelectItem value="faq">FAQ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedBlock.contentBlockType === "media" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Media Layout</Label>
                        <Select
                          value={selectedBlock.mediaLayout}
                          onValueChange={(v) =>
                            updateBlock({ mediaLayout: v as MediaLayoutType })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="grid">Grid</SelectItem>
                            <SelectItem value="carousel">Carousel</SelectItem>
                            <SelectItem value="bento">Bento</SelectItem>
                            <SelectItem value="sideBySide">Side by Side</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Number of Images</Label>
                        <Select
                          value={String(selectedBlock.mediaItemCount || 3)}
                          onValueChange={(v) =>
                            updateBlock({ mediaItemCount: parseInt(v) })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedBlock.mediaLayout === "carousel" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Items Per Page</Label>
                            <Select
                              value={String(selectedBlock.mediaItemsPerPage || 1)}
                              onValueChange={(v) =>
                                updateBlock({ mediaItemsPerPage: parseFloat(v) })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 (full)</SelectItem>
                                <SelectItem value="1.5">1.5 (glimpse)</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="2.33">2.33 (glimpse)</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Scroll By</Label>
                            <Select
                              value={String(selectedBlock.mediaScrollBy || 1)}
                              onValueChange={(v) =>
                                updateBlock({ mediaScrollBy: parseInt(v) })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 item</SelectItem>
                                <SelectItem value="2">2 items</SelectItem>
                                <SelectItem value="3">3 items</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {selectedBlock.contentBlockType === "cards" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Card Layout</Label>
                        <Select
                          value={selectedBlock.cardLayout}
                          onValueChange={(v) =>
                            updateBlock({ cardLayout: v as CardLayoutType })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="grid">Grid</SelectItem>
                            <SelectItem value="carousel">Carousel</SelectItem>
                            <SelectItem value="bento">Bento</SelectItem>
                            <SelectItem value="sideBySide">Side by Side</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Number of Cards</Label>
                        <Select
                          value={String(selectedBlock.cardItemCount || 3)}
                          onValueChange={(v) =>
                            updateBlock({ cardItemCount: parseInt(v) })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedBlock.cardLayout === "carousel" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Items Per Page</Label>
                            <Select
                              value={String(selectedBlock.cardItemsPerPage || 1)}
                              onValueChange={(v) =>
                                updateBlock({ cardItemsPerPage: parseFloat(v) })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 (full)</SelectItem>
                                <SelectItem value="1.5">1.5 (glimpse)</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="2.33">2.33 (glimpse)</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Scroll By</Label>
                            <Select
                              value={String(selectedBlock.cardScrollBy || 1)}
                              onValueChange={(v) =>
                                updateBlock({ cardScrollBy: parseInt(v) })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 item</SelectItem>
                                <SelectItem value="2">2 items</SelectItem>
                                <SelectItem value="3">3 items</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Preview/Code Area */}
          <div>
            {viewMode === "preview" ? (
              <div
                className="border rounded-lg overflow-hidden bg-background"
                style={{
                  ...themeStyles,
                  fontFamily: bodyFont,
                }}
              >
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={cn(
                      "relative cursor-pointer transition-all",
                      selectedBlockId === block.id &&
                        "ring-2 ring-primary ring-inset"
                    )}
                  >
                    {selectedBlockId === block.id && (
                      <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Selected
                      </div>
                    )}
                    <SectionBlock
                      padding={block.padding}
                      background={block.background}
                      container={block.container}
                      alignment={block.alignment}
                      titleSize={block.titleSize}
                      fullBleed={block.fullBleed}
                      title={block.showTitle ? block.title : undefined}
                      subtitle={
                        block.showSubtitle ? block.subtitle : undefined
                      }
                      cta1={
                        block.showCTA1
                          ? { text: "Get Started", variant: "default" }
                          : undefined
                      }
                      cta2={
                        block.showCTA2
                          ? { text: "Learn More", variant: "outline" }
                          : undefined
                      }
                    >
                      {renderContent(block)}
                    </SectionBlock>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Generated Code</h3>
                  <CopyButton value={generateCode()} />
                </div>
                <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
                  <code>{generateCode()}</code>
                </pre>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
