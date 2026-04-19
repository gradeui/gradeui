"use client";

import React, { useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { Button } from "@/components/ui/button";
import { Code, Eye, Columns, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "preview" | "code" | "split" | "visual";

interface CodeEditorProps {
  /** The initial code to display */
  code: string;
  /** Optional title for the editor */
  title?: string;
  /** Show the view mode toggle buttons */
  showViewModeToggle?: boolean;
  /** Initial view mode */
  defaultViewMode?: ViewMode;
  /** Additional component files to include */
  componentFiles?: Record<string, string>;
  /** Callback when code changes */
  onCodeChange?: (code: string) => void;
  /** Show visual editor (future integration with builder) */
  enableVisualEditor?: boolean;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Height of the editor */
  height?: string | number;
}

// Standard component files used across the design system
export const standardComponentFiles = {
  "/components/ui/button.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`,
  "/components/ui/card.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`,
  "/components/ui/input.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }`,
  "/components/ui/label.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }`,
  "/components/ui/badge.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600",
        info: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600",
        energy: "border-transparent bg-yellow-400 text-yellow-900 shadow hover:bg-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }`,
  "/lib/utils.ts": `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`,
};

const defaultStyles = [
  ':root {',
  '  --background: 0 0% 100%;',
  '  --foreground: 240 10% 3.9%;',
  '  --card: 0 0% 100%;',
  '  --card-foreground: 240 10% 3.9%;',
  '  --primary: 175 84% 32%;',
  '  --primary-foreground: 0 0% 100%;',
  '  --secondary: 240 4.8% 95.9%;',
  '  --secondary-foreground: 240 5.9% 10%;',
  '  --muted: 240 4.8% 95.9%;',
  '  --muted-foreground: 240 3.8% 46.1%;',
  '  --accent: 175 40% 94%;',
  '  --accent-foreground: 240 5.9% 10%;',
  '  --destructive: 0 84.2% 60.2%;',
  '  --destructive-foreground: 0 0% 98%;',
  '  --border: 240 5.9% 90%;',
  '  --input: 240 5.9% 90%;',
  '  --ring: 175 84% 32%;',
  '  --radius: 0.5rem;',
  '}',
  '*, *::before, *::after { box-sizing: border-box; border-color: oklch(var(--border)); }',
  'body { background-color: oklch(var(--background)); color: oklch(var(--foreground)); font-family: system-ui, -apple-system, sans-serif; margin: 0; }',
].join('\n');

export function CodeEditor({
  code,
  title,
  showViewModeToggle = true,
  defaultViewMode = "split",
  componentFiles = {},
  onCodeChange,
  enableVisualEditor = false,
  headerContent,
  height = "100%",
}: CodeEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  const allComponentFiles = {
    ...standardComponentFiles,
    ...componentFiles,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {(title || showViewModeToggle || headerContent) && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            {title && (
              <div>
                <h2 className="text-sm font-semibold">{title}</h2>
              </div>
            )}

            <div className="flex items-center gap-3 ml-auto">
              {headerContent}

              {showViewModeToggle && (
                <div className="inline-flex rounded-md border">
                  <Button
                    variant={viewMode === "preview" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode("preview")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant={viewMode === "split" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none border-x"
                    onClick={() => setViewMode("split")}
                  >
                    <Columns className="h-4 w-4 mr-2" />
                    Split
                  </Button>
                  <Button
                    variant={viewMode === "code" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      enableVisualEditor ? "rounded-none border-r" : "rounded-l-none"
                    )}
                    onClick={() => setViewMode("code")}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Code
                  </Button>
                  {enableVisualEditor && (
                    <Button
                      variant={viewMode === "visual" ? "default" : "ghost"}
                      size="sm"
                      className="rounded-l-none"
                      onClick={() => setViewMode("visual")}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Visual
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden" style={{ height }}>
        {viewMode === "visual" && enableVisualEditor ? (
          <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-2">
              <Pencil className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Visual editor coming soon...
              </p>
              <p className="text-xs text-muted-foreground">
                Integration with builder tools like Subframe
              </p>
            </div>
          </div>
        ) : (
          <SandpackProvider
            template="react-ts"
            theme="dark"
            options={{
              externalResources: ["https://cdn.tailwindcss.com"],
            }}
            customSetup={{
              dependencies: {
                "class-variance-authority": "^0.7.0",
                "clsx": "^2.0.0",
                "tailwind-merge": "^2.0.0",
                "lucide-react": "^0.300.0",
              },
              entry: "/index.tsx",
            }}
            files={{
              "/App.tsx": code,
              "/index.tsx": [
                'import React from "react";',
                'import ReactDOM from "react-dom/client";',
                'import App from "./App";',
                'import "./styles.css";',
                '',
                'ReactDOM.createRoot(document.getElementById("root")!).render(<App />);',
              ].join('\n'),
              "/styles.css": defaultStyles,
              ...allComponentFiles,
            }}
          >
            <SandpackLayout
              style={{ height: "100%", flex: 1 }}
              className={cn(
                viewMode === "preview" && "[&_.sp-layout]:!grid-template-columns-[0_1fr]",
                viewMode === "code" && "[&_.sp-layout]:!grid-template-columns-[1fr_0]"
              )}
            >
              {viewMode !== "preview" && (
                <SandpackCodeEditor
                  showLineNumbers
                  showTabs
                  style={{ height: "100%" }}
                />
              )}
              {viewMode !== "code" && (
                <SandpackPreview
                  showOpenInCodeSandbox
                  showRefreshButton
                  style={{ height: "100%" }}
                />
              )}
            </SandpackLayout>
          </SandpackProvider>
        )}
      </div>
    </div>
  );
}
