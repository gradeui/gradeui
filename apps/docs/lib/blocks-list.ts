import type { SectionBlockProps } from "@/components/ui/section-block";

export interface Block {
  id: string;
  name: string;
  description: string;
  category: "Hero" | "Content" | "FAQ" | "CTA";
  tags: string[];
  config: SectionBlockProps;
  contentExample?: React.ReactNode | string;
  codeExample?: string;
}

export const blocksList: Block[] = [
  // Hero Blocks
  {
    id: "hero-centered",
    name: "Hero - Centered",
    description:
      "Centered hero section with large title, subtitle, and two CTA buttons",
    category: "Hero",
    tags: ["Hero", "CTA", "Centered"],
    config: {
      padding: "xl",
      alignment: "center",
      titleSize: "xl",
      title: "Welcome to Ramp",
      subtitle:
        "Modern design system — pick three hues, get an entire OKLCH-based design language",
      cta1: { text: "Get Started", variant: "default", href: "/signup" },
      cta2: { text: "Learn More", variant: "outline", href: "/docs" },
    },
    codeExample: `<SectionBlock
  padding="xl"
  alignment="center"
  titleSize="xl"
  title="Welcome to Ramp"
  subtitle="Modern design system — pick three hues, get an entire OKLCH-based design language"
  cta1={{ text: "Get Started", variant: "default", href: "/signup" }}
  cta2={{ text: "Learn More", variant: "outline", href: "/docs" }}
/>`,
  },
  {
    id: "hero-with-image",
    name: "Hero - With Image",
    description:
      "Hero section with title, CTAs, and image/illustration in content area",
    category: "Hero",
    tags: ["Hero", "Image", "CTA"],
    config: {
      padding: "lg",
      container: "wide",
      alignment: "left",
      titleSize: "lg",
      title: "Design, Shipped",
      subtitle:
        "Build beautiful, accessible interfaces from a single package",
      cta1: { text: "Get Started", variant: "default" },
      cta2: { text: "Watch Demo", variant: "outline" },
    },
    contentExample: "image",
    codeExample: `<SectionBlock
  padding="lg"
  container="wide"
  alignment="left"
  titleSize="lg"
  title="Design, Shipped"
  subtitle="Build beautiful, accessible interfaces from a single package"
  cta1={{ text: "Get Started", variant: "default" }}
  cta2={{ text: "Watch Demo", variant: "outline" }}
>
  <div className="mt-8 rounded-lg overflow-hidden border bg-muted/30">
    <img
      src="/api/placeholder/1200/600"
      alt="Dashboard preview"
      className="w-full h-auto"
    />
  </div>
</SectionBlock>`,
  },
  {
    id: "hero-gradient",
    name: "Hero - Gradient Background",
    description: "Eye-catching hero with gradient background and centered layout",
    category: "Hero",
    tags: ["Hero", "Gradient", "Centered"],
    config: {
      padding: "xl",
      background: "gradient",
      alignment: "center",
      titleSize: "xl",
      title: "Ship Your Product Faster",
      subtitle: "Join teams shipping with Ramp DS",
      cta1: { text: "Start Free Trial", variant: "default" },
    },
    codeExample: `<SectionBlock
  padding="xl"
  background="gradient"
  alignment="center"
  titleSize="xl"
  title="Ship Your Product Faster"
  subtitle="Join teams shipping with Ramp DS"
  cta1={{ text: "Start Free Trial", variant: "default" }}
/>`,
  },

  // FAQ Block
  {
    id: "faq-section",
    name: "FAQ Section",
    description:
      "Frequently asked questions section with accordion-style content",
    category: "FAQ",
    tags: ["FAQ", "Accordion", "Support"],
    config: {
      padding: "lg",
      alignment: "center",
      titleSize: "lg",
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about Ramp",
    },
    contentExample: "accordion",
    codeExample: `<SectionBlock
  padding="lg"
  alignment="center"
  titleSize="lg"
  title="Frequently Asked Questions"
  subtitle="Everything you need to know about Ramp"
>
  <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
    <AccordionItem value="1">
      <AccordionTrigger>What is Ramp?</AccordionTrigger>
      <AccordionContent>
        Ramp is a comprehensive design system that helps you monitor,
        build beautiful, accessible interfaces from a single dashboard.
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
        Yes! We offer a 14-day free trial with full access to all features.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</SectionBlock>`,
  },

  // CTA Blocks
  {
    id: "cta-primary",
    name: "CTA - Primary",
    description:
      "Prominent call-to-action section with primary background color",
    category: "CTA",
    tags: ["CTA", "Conversion", "Primary"],
    config: {
      padding: "xl",
      background: "primary",
      alignment: "center",
      titleSize: "lg",
      title: "Ready to get started?",
      subtitle: "Join teams building with Ramp DS",
      cta1: { text: "Start Free Trial", variant: "secondary" },
      cta2: { text: "Contact Sales", variant: "outline" },
    },
    codeExample: `<SectionBlock
  padding="xl"
  background="primary"
  alignment="center"
  titleSize="lg"
  title="Ready to get started?"
  subtitle="Join teams building with Ramp DS"
  cta1={{ text: "Start Free Trial", variant: "secondary" }}
  cta2={{ text: "Contact Sales", variant: "outline" }}
/>`,
  },
  {
    id: "cta-muted",
    name: "CTA - Muted",
    description: "Subtle call-to-action section with muted background",
    category: "CTA",
    tags: ["CTA", "Conversion", "Subtle"],
    config: {
      padding: "lg",
      background: "muted",
      alignment: "center",
      titleSize: "md",
      title: "Have questions?",
      subtitle: "Our team is here to help you get the most out of Ramp",
      cta1: { text: "Contact Support", variant: "default" },
    },
    codeExample: `<SectionBlock
  padding="lg"
  background="muted"
  alignment="center"
  titleSize="md"
  title="Have questions?"
  subtitle="Our team is here to help you get the most out of Ramp"
  cta1={{ text: "Contact Support", variant: "default" }}
/>`,
  },

  // Content Block
  {
    id: "content-basic",
    name: "Content Section",
    description: "General content section with title and custom content slot",
    category: "Content",
    tags: ["Content", "Flexible", "Layout"],
    config: {
      padding: "lg",
      alignment: "left",
      titleSize: "lg",
      title: "Why Choose Ramp?",
      subtitle:
        "Discover the features that make Ramp the leading generator-first design system",
    },
    contentExample: "grid",
    codeExample: `<SectionBlock
  padding="lg"
  alignment="left"
  titleSize="lg"
  title="Why Choose Ramp?"
  subtitle="Discover the features that make Ramp the leading generator-first design system"
>
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
    {/* Add your custom content here */}
  </div>
</SectionBlock>`,
  },
];

export const blockCategories = ["All", "Hero", "Content", "FAQ", "CTA"] as const;

export function getBlocksByCategory(category: string): Block[] {
  if (category === "All") return blocksList;
  return blocksList.filter((block) => block.category === category);
}

export function getBlocksByTag(tag: string): Block[] {
  return blocksList.filter((block) => block.tags.includes(tag));
}

export function getBlockById(id: string): Block | undefined {
  return blocksList.find((block) => block.id === id);
}
