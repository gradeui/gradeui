"use client";

import { Toaster as Sonner } from "sonner";
import { useMaybeRampTheme } from "@/components/ramp-theme-provider";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const ctx = useMaybeRampTheme();
  // Sonner only understands "light" | "dark" | "system". Map our 4-way mode
  // onto that: super-* collapses to its standard sibling.
  const theme: ToasterProps["theme"] = ctx?.isDark ? "dark" : "light";

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
