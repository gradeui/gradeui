import { figma } from "@figma/code-connect"
import { Button } from "./button" // Adjusted to match the lowercase filename

figma.connect(
  Button,
  "https://www.figma.com/design/YGDxRBmQywjnIzvcKLTj3U/Grade-Design-System?node-id=40-634",
  {
    props: {
      // 1. Map your design system variants
      variant: figma.enum("variant", {
        default: "default",
        destructive: "destructive",
        outline: "outline",
        secondary: "secondary",
        ghost: "ghost",
        link: "link",
      }),
      // 2. Map your responsive sizing constraints
      size: figma.enum("size", {
        "2xs": "2xs",
        xs: "xs",
        sm: "sm",
        md: "md",
        default: "md", // Defaults mapping logic cleanly
        lg: "lg",
      }),
      // Square icon-only mode — Figma models this as an "Icon only" variant
      // axis (true/false) because a square layout change can't ride on a
      // plain boolean property. Maps to the code `iconOnly` boolean.
      iconOnly: figma.enum("Icon only", {
        true: true,
        false: false,
      }),
      // 3. Map whatever text property your Figma component uses for the inner label
      children: figma.children("*"),
    },
    // This tells Claude how to construct the React code instance
    example: ({ variant, size, iconOnly, children }) => (
      <Button variant={variant} size={size} iconOnly={iconOnly}>
        {children}
      </Button>
    ),
  }
)
