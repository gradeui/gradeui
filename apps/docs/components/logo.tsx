"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  xs: { fontSize: 16, height: 20 },
  sm: { fontSize: 20, height: 28 },
  md: { fontSize: 26, height: 36 },
  lg: { fontSize: 32, height: 44 },
  xl: { fontSize: 40, height: 54 },
} as const;

interface LogoProps {
  variant?: "full" | "symbol";
  size?: keyof typeof sizes;
  forcedTheme?: "light" | "dark";
  className?: string;
}

export function Logo({
  variant = "full",
  size = "md",
  forcedTheme,
  className,
}: LogoProps) {
  const sizeConfig = sizes[size];

  // Symbol-only variant - circle in a circle
  if (variant === "symbol") {
    const symbolSize = sizeConfig.height;
    const innerSize = symbolSize * 0.45;
    const strokeWidth = symbolSize * 0.12;

    return (
      <svg
        width={symbolSize}
        height={symbolSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("flex-shrink-0", className)}
      >
        {/* Outer circle (ring) */}
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          className="text-primary"
        />
        {/* Inner circle (filled) */}
        <circle
          cx="20"
          cy="20"
          r="7"
          fill="currentColor"
          className="text-primary"
        />
      </svg>
    );
  }

  // Full logo - "Ramp" wordmark
  return (
    <span
      className={cn(
        "font-bold tracking-tight text-foreground flex-shrink-0",
        className
      )}
      style={{
        fontSize: sizeConfig.fontSize,
        lineHeight: `${sizeConfig.height}px`,
      }}
    >
      Ramp
    </span>
  );
}

export default Logo;
