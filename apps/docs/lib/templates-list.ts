export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  href: string;
  previewImage?: string;
  featured?: boolean;
}

export const templatesList: Template[] = [
  // Dashboard Templates
  {
    id: "usage-dashboard",
    name: "Usage Dashboard",
    description: "A metrics dashboard showcasing cards, charts, tables, and key project KPIs.",
    category: "Dashboard",
    tags: ["Dashboard", "Analytics"],
    href: "/templates/usage-dashboard",
    featured: true,
  },
  {
    id: "site-overview",
    name: "Site Overview",
    description: "Comprehensive site management interface with map integration, device status, and performance metrics.",
    category: "Dashboard",
    tags: ["Dashboard", "Map", "Monitoring"],
    href: "/templates/site-overview",
    featured: true,
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Data-rich analytics interface with multiple chart types and filtering options.",
    category: "Dashboard",
    tags: ["Dashboard", "Analytics", "Charts"],
    href: "/templates/analytics-dashboard",
  },

  // Settings Templates
  {
    id: "settings-page",
    name: "Settings Page",
    description: "Full-featured settings interface with tabs, forms, and account management.",
    category: "Settings",
    tags: ["Settings", "Forms", "Account"],
    href: "/templates/settings-page",
  },
  {
    id: "user-profile",
    name: "User Profile",
    description: "User profile page with avatar, personal information, and preferences.",
    category: "Settings",
    tags: ["Profile", "Forms", "User"],
    href: "/templates/user-profile",
  },

  // Authentication Templates
  {
    id: "login-page",
    name: "Login Page",
    description: "Clean authentication page with email/password and social login options.",
    category: "Authentication",
    tags: ["Auth", "Forms", "Login"],
    href: "/templates/login-page",
  },
  {
    id: "signup-page",
    name: "Signup Page",
    description: "Registration page with form validation and multi-step flow.",
    category: "Authentication",
    tags: ["Auth", "Forms", "Registration"],
    href: "/templates/signup-page",
  },

  // Data Display Templates
  {
    id: "device-list",
    name: "Device List",
    description: "Comprehensive device listing with search, filters, and bulk actions.",
    category: "Data Display",
    tags: ["Table", "List", "Devices"],
    href: "/templates/device-list",
  },
  {
    id: "site-details",
    name: "Site Details",
    description: "A detail page pattern with tabs, progress, and key stats.",
    category: "Data Display",
    tags: ["Details", "Tabs"],
    href: "/templates/site-details",
  },

  // Communication Templates
  {
    id: "ai-assistant",
    name: "AI Assistant",
    description: "AI-powered chat interface for exploring the design system and answering questions.",
    category: "Communication",
    tags: ["AI", "Chat", "Support"],
    href: "/templates/ai-assistant",
  },
  {
    id: "notifications-center",
    name: "Notifications Center",
    description: "Notification management interface with filtering and action buttons.",
    category: "Communication",
    tags: ["Notifications", "Alerts", "Inbox"],
    href: "/templates/notifications-center",
  },

  // Marketing Templates
  {
    id: "product-landing",
    name: "Product Landing Page",
    description: "Modern landing page with hero, features, testimonials, and CTA sections using SectionBlocks.",
    category: "Marketing",
    tags: ["Landing", "Marketing", "Blocks"],
    href: "/templates/product-landing",
    featured: true,
  },
  {
    id: "pricing-page",
    name: "Pricing Page",
    description: "Clean pricing page with pricing tiers, FAQs, and feature comparison using SectionBlocks.",
    category: "Marketing",
    tags: ["Pricing", "Marketing", "Blocks"],
    href: "/templates/pricing-page",
  },
];

export const templateCategories = [
  "All",
  "Dashboard",
  "Settings",
  "Authentication",
  "Data Display",
  "Communication",
  "Marketing",
] as const;

export const templateTags = [
  "Dashboard",
  
  "Analytics",
  "Charts",
  "Map",
  "Monitoring",
  "Settings",
  "Forms",
  "Account",
  "Profile",
  "User",
  "Auth",
  "Login",
  "Registration",
  "Table",
  "List",
  "Devices",
  "Details",
  "Tabs",
  "AI",
  "Chat",
  "Support",
  "Notifications",
  "Alerts",
  "Inbox",
  "Landing",
  "Marketing",
  "Blocks",
  "Pricing",
] as const;

export function getTemplatesByCategory(category: string): Template[] {
  if (category === "All") return templatesList;
  return templatesList.filter((template) => template.category === category);
}

export function getTemplatesByTag(tag: string): Template[] {
  return templatesList.filter((template) => template.tags.includes(tag));
}

export function getFeaturedTemplates(): Template[] {
  return templatesList.filter((template) => template.featured);
}

export function getTemplateById(id: string): Template | undefined {
  return templatesList.find((template) => template.id === id);
}
