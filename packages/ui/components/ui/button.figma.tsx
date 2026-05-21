import { figma } from "@figma/code-connect"
import { Button } from "./button" // Adjusted to match the lowercase filename

figma.connect(
  Button,
  "https://www.figma.com/design/YGDxRBmQywjnIzvcKLTj3U/Grade-Design-System?node-id=1-1185&t=VcJVQGd0oyugbMLO-4",
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
        sm: "sm",
        md: "md",
        default: "md", // Defaults mapping logic cleanly
        lg: "lg",
        icon: "icon",
      }),
      // 3. Map whatever text property your Figma component uses for the inner label
      children: figma.children("*"),
    },
    // This tells Claude how to construct the React code instance
    example: ({ variant, size, children }) => (
      <Button variant={variant} size={size}>
        {children}
      </Button>
    ),
  }
)
