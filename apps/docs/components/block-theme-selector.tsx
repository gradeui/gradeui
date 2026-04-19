"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Palette } from "lucide-react";
import { getBlockThemeOptions, type BlockThemeId } from "@/lib/block-themes";

export function BlockThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<BlockThemeId>("default");
  const themes = getBlockThemeOptions();

  // Apply theme to document root when changed
  const handleThemeChange = (themeId: BlockThemeId) => {
    setSelectedTheme(themeId);
    // You could apply the theme globally here if needed
    // For now, this is just a UI demo - actual theme application
    // happens in individual components
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Block Theme</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Preview different color palettes for content blocks
            </p>
          </div>
          <Select value={selectedTheme} onValueChange={(v) => handleThemeChange(v as BlockThemeId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  <div>
                    <div className="font-medium">{theme.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {theme.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Note: Theme changes apply to block-based templates and the page builder
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
