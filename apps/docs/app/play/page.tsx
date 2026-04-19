"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { SiteHeader } from "@/components/site-header";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Save, FolderOpen, Trash2, X } from "lucide-react";
import { useRampTheme } from "@/components/ramp-theme-provider";
import { themeToCSSVars, type GeneratedTheme } from "@/lib/themes";

interface SavedPlayground {
  id: string;
  name: string;
  code: string;
  createdAt: number;
}

const STORAGE_KEY = "rds-playgrounds";

const examples = {
  all: {
    name: "All",
    code: `import { Button } from "./components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Badge } from "./components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog"
import { CheckCircle2, AlertTriangle, Info } from "lucide-react"

export default function App() {
  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Buttons */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </section>

      {/* Cards & Forms */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Cards & Forms</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Enter your credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Sign in</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>Manage your project configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" defaultValue="My Project" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" placeholder="Enter description..." />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Alerts</h2>
        <div className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>This is a default informational alert.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Your changes have been saved.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>Your session will expire soon.</AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Dialog */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Make changes to your profile here.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-name">Name</Label>
                <Input id="dialog-name" defaultValue="John Doe" />
              </div>
            </div>
            <DialogFooter>
              <Button>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  )
}`,
  },
  button: {
    name: "Button",
    code: `import { Button } from "./components/ui/button"

export default function App() {
  return (
    <div className="flex flex-wrap gap-4 p-8">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  )
}`,
  },
  card: {
    name: "Card",
    code: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card"
import { Button } from "./components/ui/button"

export default function App() {
  return (
    <div className="p-8">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>Deploy your new project in one-click.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your project will be deployed to our secure cloud infrastructure.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
        </CardFooter>
      </Card>
    </div>
  )
}`,
  },
  form: {
    name: "Form",
    code: `import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card"

export default function App() {
  return (
    <div className="p-8">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Sign in</Button>
        </CardFooter>
      </Card>
    </div>
  )
}`,
  },
  alert: {
    name: "Alert",
    code: `import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"

export default function App() {
  return (
    <div className="p-8 space-y-4 max-w-lg">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          This is a default alert for general information.
        </AlertDescription>
      </Alert>

      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          Your changes have been saved successfully.
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Your session will expire in 5 minutes.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try again.
        </AlertDescription>
      </Alert>
    </div>
  )
}`,
  },
  badge: {
    name: "Badge",
    code: `import { Badge } from "./components/ui/badge"

export default function App() {
  return (
    <div className="p-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Online</Badge>
        <Badge variant="warning">Pending</Badge>
        <Badge variant="info">New</Badge>
        <Badge variant="highlight">New</Badge>
      </div>
    </div>
  )
}`,
  },
  dialog: {
    name: "Dialog",
    code: `import { Button } from "./components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"

export default function App() {
  return (
    <div className="p-8">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@johndoe" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}`,
  },
};

// Simplified component files for Sandpack - using relative paths
const componentFiles = {
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
  "/components/ui/alert.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success: "border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600",
        warning: "border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }`,
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
  "/components/ui/dialog.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Dialog = ({ children, ...props }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <div {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { open, setOpen })
        }
        return child
      })}
    </div>
  )
}

const DialogTrigger = ({ children, asChild, open, setOpen }: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: () => setOpen(true) })
  }
  return <button onClick={() => setOpen(true)}>{children}</button>
}

const DialogContent = ({ children, className, open, setOpen }: any) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className={cn("relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg", className)}>
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background hover:opacity-100"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
)

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }`,
  "/lib/utils.ts": `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`,
};

/**
 * Build the Sandpack iframe's public/index.html. Injects the active theme's
 * CSS variables inline so the first paint is already styled, plus a Tailwind
 * config that wraps each var in oklch(var(--x) / <alpha-value>) — matching
 * the real app so opacity shortcuts like bg-primary/50 work in the
 * playground too.
 */
/**
 * Google Fonts combined URL — loads every font the theme system can pick.
 * Parent uses next/font; inside the Sandpack iframe we're a separate
 * browsing context, so we have to load them directly from Google.
 */
const PLAYGROUND_FONTS_URL =
  "https://fonts.googleapis.com/css2" +
  "?family=Geist:wght@100..900" +
  "&family=Geist+Mono:wght@100..900" +
  "&family=Fraunces:ital,wght@0,100..900;1,100..900" +
  "&family=Instrument+Serif:ital@0;1" +
  "&family=Source+Serif+4:ital,wght@0,200..900;1,200..900" +
  "&family=Inter:wght@100..900" +
  "&family=Manrope:wght@200..800" +
  "&family=Figtree:wght@300..900" +
  "&family=DM+Sans:ital,wght@0,100..1000;1,100..1000" +
  "&family=Lexend:wght@100..900" +
  "&family=Outfit:wght@100..900" +
  "&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800" +
  "&family=Space+Grotesk:wght@300..700" +
  "&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800" +
  "&family=IBM+Plex+Mono:wght@400;500;600" +
  "&display=swap";

/**
 * Base --font-* custom properties mapped to the real Google font-family
 * names. Mirrors what next/font writes in the parent app, but with literal
 * strings so the cascade resolves cleanly inside the iframe. These get
 * injected into the iframe's <head> BEFORE the theme var block, so the
 * theme's `--font-sans: var(--font-fraunces), …` chain actually resolves.
 */
const PLAYGROUND_FONT_VARS = `
        --font-geist: "Geist", "Geist Fallback", system-ui, sans-serif;
        --font-jetbrains-mono: "JetBrains Mono", ui-monospace, monospace;
        --font-geist-mono: "Geist Mono", "JetBrains Mono", ui-monospace, monospace;
        --font-inter: "Inter", system-ui, sans-serif;
        --font-manrope: "Manrope", system-ui, sans-serif;
        --font-figtree: "Figtree", system-ui, sans-serif;
        --font-dm-sans: "DM Sans", system-ui, sans-serif;
        --font-lexend: "Lexend", system-ui, sans-serif;
        --font-outfit: "Outfit", system-ui, sans-serif;
        --font-plus-jakarta: "Plus Jakarta Sans", system-ui, sans-serif;
        --font-space-grotesk: "Space Grotesk", system-ui, sans-serif;
        --font-fraunces: "Fraunces", Georgia, serif;
        --font-instrument-serif: "Instrument Serif", Georgia, serif;
        --font-source-serif: "Source Serif 4", Georgia, serif;
        --font-ibm-plex-mono: "IBM Plex Mono", ui-monospace, monospace;`;

function buildPlaygroundIndexHtml(
  lightVars: string,
  darkVars: string,
  mode: "light" | "dark",
  components: { buttonShape: string; inputStyle: string; cardStyle: string }
): string {
  const htmlClass = mode === "dark" ? ' class="dark"' : "";
  const dataAttrs = ` data-button-shape="${components.buttonShape}" data-input-style="${components.inputStyle}" data-card-style="${components.cardStyle}"`;
  return `<!DOCTYPE html>
<html lang="en"${htmlClass}${dataAttrs}>
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="${PLAYGROUND_FONTS_URL}">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ramp DS Playground</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              border: "oklch(var(--border) / <alpha-value>)",
              input: "oklch(var(--input) / <alpha-value>)",
              ring: "oklch(var(--ring) / <alpha-value>)",
              background: "oklch(var(--background) / <alpha-value>)",
              foreground: "oklch(var(--foreground) / <alpha-value>)",
              primary: {
                DEFAULT: "oklch(var(--primary) / <alpha-value>)",
                foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
              },
              secondary: {
                DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
                foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
              },
              destructive: {
                DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
                foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
              },
              muted: {
                DEFAULT: "oklch(var(--muted) / <alpha-value>)",
                foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
              },
              accent: {
                DEFAULT: "oklch(var(--accent) / <alpha-value>)",
                foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
              },
              popover: {
                DEFAULT: "oklch(var(--popover) / <alpha-value>)",
                foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
              },
              card: {
                DEFAULT: "oklch(var(--card) / <alpha-value>)",
                foreground: "oklch(var(--card-foreground) / <alpha-value>)",
              },
              success: "oklch(var(--success) / <alpha-value>)",
              warning: "oklch(var(--warning) / <alpha-value>)",
              info: "oklch(var(--info) / <alpha-value>)",
              highlight: "oklch(var(--highlight) / <alpha-value>)",
            },
            borderRadius: {
              lg: "var(--radius)",
              md: "calc(var(--radius) - 2px)",
              sm: "calc(var(--radius) - 4px)",
            },
          },
        },
      }
    </script>
    <style>
      :root {
${PLAYGROUND_FONT_VARS}
${lightVars}
      }
      .dark {
${darkVars}
      }
      * { border-color: oklch(var(--border)); }
      body {
        background-color: oklch(var(--background));
        color: oklch(var(--foreground));
        font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
        margin: 0;
      }
      /* Naked h1–h4 pick up the theme's display font, mirroring globals.css
         in the parent. */
      h1, h2, h3, h4 {
        font-family: var(--font-display, var(--font-sans));
        font-weight: var(--font-heading-weight, 600);
        letter-spacing: var(--font-heading-tracking, -0.01em);
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

/**
 * Convert a GeneratedTheme's output into a CSS custom-property block suitable
 * for dropping inside :root { … } or .dark { … }. Uses themeToCSSVars under
 * the hood so the playground gets the same token shape as the real app.
 */
function formatThemeVars(
  theme: GeneratedTheme,
  mode: "light" | "dark"
): string {
  const vars = themeToCSSVars(theme, mode);
  return Object.entries(vars)
    .map(([key, value]) => `        ${key}: ${value};`)
    .join("\n");
}

/**
 * Build the /styles.css file for Sandpack. Contains :root + .dark blocks
 * generated from the active theme, plus a small set of utility fallbacks so
 * `bg-primary`, `text-muted-foreground` etc. still render even before
 * Tailwind's JIT has finished processing the iframe's initial markup.
 */
function buildPlaygroundStylesCss(lightVars: string, darkVars: string): string {
  return `:root {
${PLAYGROUND_FONT_VARS}
${lightVars}
}

.dark {
${darkVars}
}

*, *::before, *::after {
  box-sizing: border-box;
  border-color: oklch(var(--border));
}

body {
  background-color: oklch(var(--background));
  color: oklch(var(--foreground));
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  margin: 0;
}

/* Component shape rules — mirror app/globals.css so buttonShape / cardStyle
   / inputStyle on the theme apply inside the sandbox too. */
[data-card-style="outlined"] .rds-card { box-shadow: none; }
[data-card-style="flat"] .rds-card {
  box-shadow: none;
  border-color: transparent;
  background-color: oklch(var(--muted));
}
[data-card-style="elevated"] .rds-card {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  border-color: transparent;
}
[data-card-style="glass"] .rds-card {
  background-color: oklch(var(--card) / 0.6);
  backdrop-filter: blur(12px);
  border-color: oklch(var(--border) / 0.5);
}
[data-button-shape="pill"] .rds-button { border-radius: 9999px; }
[data-button-shape="square"] .rds-button,
[data-button-shape="sharp"] .rds-button { border-radius: 0; }

/* Utility fallbacks for components that ship semantic classnames. */
.bg-primary { background-color: oklch(var(--primary)); }
.bg-primary\\/90 { background-color: oklch(var(--primary) / 0.9); }
.bg-primary\\/80 { background-color: oklch(var(--primary) / 0.8); }
.text-primary { color: oklch(var(--primary)); }
.text-primary-foreground { color: oklch(var(--primary-foreground)); }
.bg-secondary { background-color: oklch(var(--secondary)); }
.text-secondary-foreground { color: oklch(var(--secondary-foreground)); }
.bg-destructive { background-color: oklch(var(--destructive)); }
.text-destructive { color: oklch(var(--destructive)); }
.text-destructive-foreground { color: oklch(var(--destructive-foreground)); }
.bg-muted { background-color: oklch(var(--muted)); }
.text-muted-foreground { color: oklch(var(--muted-foreground)); }
.bg-accent { background-color: oklch(var(--accent)); }
.text-accent-foreground { color: oklch(var(--accent-foreground)); }
.bg-card { background-color: oklch(var(--card)); }
.text-card-foreground { color: oklch(var(--card-foreground)); }
.bg-background { background-color: oklch(var(--background)); }
.text-foreground { color: oklch(var(--foreground)); }
.border-input { border-color: oklch(var(--input)); }
.ring-ring { --tw-ring-color: oklch(var(--ring)); }
.rounded-lg { border-radius: var(--radius); }
.rounded-md { border-radius: calc(var(--radius) - 2px); }
.rounded-sm { border-radius: calc(var(--radius) - 4px); }`;
}

// Title bar component that uses Sandpack context
function EditorTitleBar({
  onSave,
  onSaveAsNew,
  activePlayground,
}: {
  onSave: (code: string) => void;
  onSaveAsNew: (code: string) => void;
  activePlayground: SavedPlayground | null;
}) {
  const { sandpack } = useSandpack();

  const handleSave = () => {
    const code = sandpack.files["/App.tsx"]?.code || "";
    onSave(code);
  };

  const handleSaveAsNew = () => {
    const code = sandpack.files["/App.tsx"]?.code || "";
    onSaveAsNew(code);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        {activePlayground ? (
          <>
            <span className="text-sm font-medium text-foreground">{activePlayground.name}</span>
            <span className="text-xs text-muted-foreground">
              Last saved {new Date(activePlayground.createdAt).toLocaleTimeString()}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Unsaved playground</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          <Save className="h-3.5 w-3.5" />
          {activePlayground ? "Save" : "Save as..."}
        </button>
        {activePlayground && (
          <button
            onClick={handleSaveAsNew}
            className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
          >
            Save as new
          </button>
        )}
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  const { theme: activeTheme, isDark } = useRampTheme();
  const [activeExample, setActiveExample] = useState<keyof typeof examples>("all");
  const [currentCode, setCurrentCode] = useState(examples.all.code);
  const [savedPlaygrounds, setSavedPlaygrounds] = useState<SavedPlayground[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [sandpackKey, setSandpackKey] = useState(0);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [activePlayground, setActivePlayground] = useState<SavedPlayground | null>(null);

  // Derive the Sandpack iframe's CSS + HTML from the active theme so the
  // playground always mirrors whichever theme (and mode) the user picked in
  // the nav. Bumps sandpackKey when the theme changes so the iframe rebuilds.
  const playgroundMode = isDark ? "dark" : "light";
  const { playgroundIndexHtml, playgroundStylesCss } = useMemo(() => {
    const lightVars = formatThemeVars(activeTheme, "light");
    const darkVars = formatThemeVars(activeTheme, "dark");
    const comps = {
      buttonShape: activeTheme.components.buttonShape ?? "default",
      inputStyle: activeTheme.components.inputStyle ?? "outlined",
      cardStyle: activeTheme.components.cardStyle ?? "flat",
    };
    return {
      playgroundIndexHtml: buildPlaygroundIndexHtml(lightVars, darkVars, playgroundMode, comps),
      playgroundStylesCss: buildPlaygroundStylesCss(lightVars, darkVars),
    };
  }, [activeTheme, playgroundMode]);

  // Theme changes flow through the `files` prop (new styles.css content) and
  // Sandpack rebuilds without a remount — instant swap. Mode changes however
  // flip the <html class="dark"> in public/index.html, which Sandpack doesn't
  // hot-replace, so we force a re-mount on mode change only.
  useEffect(() => {
    setSandpackKey((k) => k + 1);
  }, [playgroundMode]);

  // Load saved playgrounds from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedPlaygrounds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved playgrounds:", e);
      }
    }
  }, []);

  const handleExampleClick = (key: keyof typeof examples) => {
    setActiveExample(key);
    setCurrentCode(examples[key].code);
    setActivePlayground(null); // Clear active save when switching to example
    setSandpackKey((k) => k + 1);
  };

  const handleSaveRequest = (code: string) => {
    if (activePlayground) {
      // Update existing playground
      const updated = savedPlaygrounds.map((p) =>
        p.id === activePlayground.id
          ? { ...p, code, createdAt: Date.now() }
          : p
      );
      setSavedPlaygrounds(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Update current code so re-renders don't revert
      setCurrentCode(code);
      // Update active playground reference
      setActivePlayground({ ...activePlayground, code, createdAt: Date.now() });
    } else {
      // Show dialog for new save
      setPendingCode(code);
      setShowSaveDialog(true);
      setSaveName("");
    }
  };

  const handleSaveAsNew = (code: string) => {
    setPendingCode(code);
    setShowSaveDialog(true);
    setSaveName("");
  };

  const handleSaveConfirm = () => {
    if (!saveName.trim() || !pendingCode) return;

    const newPlayground: SavedPlayground = {
      id: Date.now().toString(),
      name: saveName.trim(),
      code: pendingCode,
      createdAt: Date.now(),
    };

    const updated = [...savedPlaygrounds, newPlayground];
    setSavedPlaygrounds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setShowSaveDialog(false);
    setPendingCode(null);
    setActivePlayground(newPlayground); // Set as active after saving
  };

  const handleLoad = (playground: SavedPlayground) => {
    setCurrentCode(playground.code);
    setActivePlayground(playground); // Track which save is loaded
    setSandpackKey((k) => k + 1);
    setShowLoadDropdown(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPlaygrounds.filter((p) => p.id !== id);
    setSavedPlaygrounds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Clear active if we deleted the active playground
    if (activePlayground?.id === id) {
      setActivePlayground(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <div className="border-b bg-muted/30">
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Playground</h1>
                <p className="text-sm text-muted-foreground">
                  Experiment with Grade Design System components in real-time
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Example buttons */}
                <div className="flex gap-2">
                  {Object.entries(examples).map(([key, example]) => (
                    <button
                      key={key}
                      onClick={() => handleExampleClick(key as keyof typeof examples)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md transition-colors",
                        activeExample === key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {example.name}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border" />

                {/* Load dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowLoadDropdown(!showLoadDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    My Saves
                    {savedPlaygrounds.length > 0 && (
                      <span className="ml-1 bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs">
                        {savedPlaygrounds.length}
                      </span>
                    )}
                  </button>

                  {showLoadDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowLoadDropdown(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
                        {savedPlaygrounds.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No saved playgrounds yet
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            {savedPlaygrounds.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => handleLoad(p)}
                                className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer group"
                              >
                                <div className="truncate">
                                  <div className="text-sm font-medium truncate">
                                    {p.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(p.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => handleDelete(p.id, e)}
                                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <SandpackProvider
            key={sandpackKey}
            template="react-ts"
            theme={isDark ? "dark" : "light"}
            options={{
              externalResources: ["https://cdn.tailwindcss.com"],
              classes: {
                "sp-wrapper": "sp-ramp-wrapper",
                "sp-preview-container": "sp-ramp-preview",
              },
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
              "/App.tsx": currentCode,
              "/public/index.html": playgroundIndexHtml,
              "/index.tsx": [
                'import React from "react";',
                'import ReactDOM from "react-dom/client";',
                'import App from "./App";',
                'import "./styles.css";',
                '',
                'ReactDOM.createRoot(document.getElementById("root")!).render(<App />);',
              ].join('\n'),
              "/styles.css": playgroundStylesCss,
              ...componentFiles,
            }}
          >
            <EditorTitleBar
              onSave={handleSaveRequest}
              onSaveAsNew={handleSaveAsNew}
              activePlayground={activePlayground}
            />
            <SandpackLayout style={{ height: "calc(100vh - 220px)", flex: 1 }}>
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                style={{ height: "100%" }}
              />
              <SandpackPreview
                showOpenInCodeSandbox
                showRefreshButton
                style={{ height: "100%" }}
              />
            </SandpackLayout>
          </SandpackProvider>
        </div>
      </main>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowSaveDialog(false)}
          />
          <div className="relative z-50 w-full max-w-md bg-card border rounded-lg p-6 shadow-lg">
            <button
              onClick={() => setShowSaveDialog(false)}
              className="absolute right-4 top-4 p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Save Playground</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="My awesome component..."
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveConfirm()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfirm}
                  disabled={!saveName.trim()}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
