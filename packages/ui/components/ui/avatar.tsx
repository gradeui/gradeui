"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Avatar — circular user/entity glyph. Wraps Radix's avatar primitive
 * with two ergonomic additions over the base shadcn shape:
 *
 *   size — t-shirt scale (xs / sm / md / lg / xl) so consumers pick a
 *          token instead of writing `h-7 w-7` every time. Defaults
 *          to md (40px) to preserve previous behaviour.
 *
 *   tone — on AvatarFallback only. Picks a tinted bg/text colour
 *          pair (violet / amber / emerald / sky / rose / plum / lime /
 *          primary / muted). Default `muted` matches the previous
 *          `bg-muted` behaviour. Reach for explicit tones when each
 *          author needs a stable colour mapping (chat avatars, comment
 *          threads, member lists).
 *
 * Both additions are backwards compatible — code that passed className
 * directly still works and overrides the variant defaults.
 */

const avatarSizes = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        // 2xs (20px) — densest tool-panel avatar / inline mention
        "2xs": "h-5 w-5",
        // xs (24px) — chat message avatars, dense comment threads
        xs: "h-6 w-6",
        // sm (28px) — comments, tag chips, secondary surfaces
        sm: "h-7 w-7",
        // md (40px) — default, profile rows, sidebars
        md: "h-10 w-10",
        // lg (56px) — profile headers, member cards
        lg: "h-14 w-14",
        // xl (80px) — onboarding, account pages
        xl: "h-20 w-20",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarSizes> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    data-gds-part="avatar"
    data-gds-size={size ?? "md"}
    className={cn(avatarSizes({ size }), className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    data-gds-part="avatar-image"
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// ─── Fallback tones ──────────────────────────────────────────────────
//
// Each tone is a bg + text colour pair. Light theme uses the 500 hue
// at 20% alpha for the bg and 600 for the text; dark theme uses the
// 400 hue for text. `primary` reads from the theme, the rest are
// fixed brand-safe colours suitable for "stable per-author identity"
// mappings (alice = violet, ben = amber, ...).
//
// `muted` matches the previous bg-muted behaviour; default tone is
// muted so existing call sites that omit `tone` are unchanged.

const avatarFallbackTones = cva(
  "flex h-full w-full items-center justify-center rounded-full font-semibold",
  {
    variants: {
      tone: {
        muted: "bg-muted text-foreground",
        primary: "bg-primary/15 text-primary",
        violet: "bg-violet-500/20 text-violet-600 dark:text-violet-400",
        amber: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
        emerald: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        sky: "bg-sky-500/20 text-sky-600 dark:text-sky-400",
        rose: "bg-rose-500/20 text-rose-600 dark:text-rose-400",
        plum: "bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400",
        lime: "bg-lime-500/20 text-lime-600 dark:text-lime-400",
      },
    },
    defaultVariants: {
      tone: "muted",
    },
  },
);

export type AvatarTone = NonNullable<
  VariantProps<typeof avatarFallbackTones>["tone"]
>;

export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackTones> {}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, tone, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    data-gds-part="avatar-fallback"
    data-gds-tone={tone ?? "muted"}
    className={cn(avatarFallbackTones({ tone }), className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback, avatarSizes, avatarFallbackTones };
