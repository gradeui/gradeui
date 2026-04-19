"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const mediaBlockVariants = cva("w-full", {
  variants: {
    layout: {
      single: "w-full",
      carousel: "relative",
      grid: "grid gap-4",
      bento: "grid gap-4",
      sideBySide: "grid gap-4 md:grid-cols-2",
    },
  },
  defaultVariants: {
    layout: "single",
  },
});

export interface MediaItem {
  type: "image" | "video";
  src: string;
  alt?: string;
  aspectRatio?: "video" | "square" | "portrait" | "wide";
  size?: "sm" | "md" | "lg" | "xl"; // For bento layout
}

export interface MediaBlockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mediaBlockVariants> {
  items: MediaItem[];
  rounded?: "none" | "sm" | "md" | "lg";
  showBorder?: boolean;
  columns?: 2 | 3 | 4; // For grid layout
  // Carousel-specific props
  itemsPerPage?: number; // How many items visible at once (default: 1)
  scrollBy?: number; // How many items to scroll per navigation click (default: 1)
  gap?: number; // Gap between items in pixels (default: 16)
}

const aspectRatioClasses = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
};

// Intelligent bento sizing based on item count and position
const getBentoSize = (index: number, totalItems: number): string => {
  if (totalItems <= 2) {
    return "md:col-span-1 md:row-span-1";
  }

  if (totalItems === 3) {
    // First item large, others normal
    if (index === 0) return "md:col-span-2 md:row-span-2";
    return "md:col-span-1 md:row-span-1";
  }

  if (totalItems === 4) {
    // First item large, others small
    if (index === 0) return "md:col-span-2 md:row-span-2";
    return "md:col-span-1 md:row-span-1";
  }

  if (totalItems === 5) {
    // First item large, others small
    if (index === 0) return "md:col-span-2 md:row-span-2";
    return "md:col-span-1 md:row-span-1";
  }

  if (totalItems >= 6) {
    // Mix of sizes for visual interest
    if (index === 0) return "md:col-span-2 md:row-span-2";
    if (index === 3) return "md:col-span-2 md:row-span-1";
    return "md:col-span-1 md:row-span-1";
  }

  return "md:col-span-1 md:row-span-1";
};

const MediaBlock = React.forwardRef<HTMLDivElement, MediaBlockProps>(
  (
    {
      className,
      layout,
      items,
      rounded = "lg",
      showBorder = false,
      columns = 3,
      itemsPerPage = 1,
      scrollBy = 1,
      gap = 16,
      ...props
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const roundedClass = {
      none: "",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
    }[rounded];

    // Carousel navigation
    const scrollToIndex = (index: number) => {
      if (!scrollRef.current) return;
      const containerWidth = scrollRef.current.offsetWidth;
      const itemWidth = (containerWidth + gap) / itemsPerPage;
      scrollRef.current.scrollTo({
        left: index * itemWidth * scrollBy,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    };

    const handlePrev = () => {
      const maxIndex = Math.ceil(items.length / scrollBy) - 1;
      const newIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
      scrollToIndex(newIndex);
    };

    const handleNext = () => {
      const maxIndex = Math.ceil(items.length / scrollBy) - 1;
      const newIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
      scrollToIndex(newIndex);
    };

    const renderMedia = (item: MediaItem, index: number) => {
      const aspectClass = item.aspectRatio
        ? aspectRatioClasses[item.aspectRatio]
        : "aspect-video";

      const bentoSizeClass = layout === "bento"
        ? getBentoSize(index, items.length)
        : "";

      // Calculate width for carousel items based on itemsPerPage
      const carouselWidth = layout === "carousel"
        ? `calc((100% - ${gap * (itemsPerPage - 1)}px) / ${itemsPerPage})`
        : undefined;

      const containerClasses = cn(
        "relative overflow-hidden bg-muted",
        roundedClass,
        showBorder && "border border-border",
        aspectClass,
        bentoSizeClass,
        layout === "carousel" && "flex-shrink-0"
      );

      if (item.type === "video") {
        return (
          <div
            key={index}
            className={containerClasses}
            style={carouselWidth ? { width: carouselWidth } : undefined}
          >
            <video
              src={item.src}
              controls
              className="w-full h-full object-cover"
              aria-label={item.alt}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }

      return (
        <div
          key={index}
          className={containerClasses}
          style={carouselWidth ? { width: carouselWidth } : undefined}
        >
          <img
            src={item.src}
            alt={item.alt || `Media ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      );
    };

    // Carousel layout
    if (layout === "carousel") {
      const maxIndex = Math.ceil(items.length / scrollBy) - 1;
      return (
        <div ref={ref} className={cn("relative", className)} {...props}>
          <div
            ref={scrollRef}
            className="flex overflow-x-hidden scroll-smooth"
            style={{ gap: `${gap}px` }}
          >
            {items.map((item, index) => renderMedia(item, index))}
          </div>

          {items.length > 1 && (
            <>
              {/* Navigation Arrows */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      currentIndex === index
                        ? "bg-primary w-4"
                        : "bg-muted-foreground/30"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    // Grid/Bento/SideBySide/Single layouts
    const containerClasses = cn(
      mediaBlockVariants({ layout }),
      layout === "grid" && `md:grid-cols-${columns}`,
      layout === "bento" && "md:grid-cols-3 auto-rows-[200px]",
      className
    );

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {items.map((item, index) => renderMedia(item, index))}
      </div>
    );
  }
);

MediaBlock.displayName = "MediaBlock";

export { MediaBlock, mediaBlockVariants };
