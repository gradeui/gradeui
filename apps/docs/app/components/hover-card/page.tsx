"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ComponentNav } from "@/components/component-nav";
import { CalendarDays } from "lucide-react";

export default function HoverCardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Hover Card</h1>
        <p className="text-lg text-muted-foreground mt-2">
          For sighted users to preview content available behind a link.
        </p>
      </div>

      {/* Basic */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Basic Hover Card
        </h2>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@nextjs</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <Avatar>
                <AvatarImage src="https://github.com/vercel.png" />
                <AvatarFallback>VC</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">@nextjs</h4>
                <p className="text-sm">
                  The React Framework – created and maintained by @vercel.
                </p>
                <div className="flex items-center pt-2">
                  <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{" "}
                  <span className="text-xs text-muted-foreground">
                    Joined December 2021
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* User Profile */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          User Profile Preview
        </h2>
        <p className="text-muted-foreground">
          Show user details on hover without navigating away.
        </p>
        <div className="flex gap-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">John Doe</span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">John Doe</h4>
                  <p className="text-sm text-muted-foreground">
                    Product Designer at Ramp
                  </p>
                  <div className="flex gap-4 pt-2 text-xs text-muted-foreground">
                    <span>12 projects</span>
                    <span>4 teams</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      {/* Positioning */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Positioning
        </h2>
        <div className="flex gap-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline">Top</Button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="w-40">
              <p className="text-sm">Card on top</p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline">Right</Button>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="w-40">
              <p className="text-sm">Card on right</p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline">Bottom</Button>
            </HoverCardTrigger>
            <HoverCardContent side="bottom" className="w-40">
              <p className="text-sm">Card on bottom</p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline">Left</Button>
            </HoverCardTrigger>
            <HoverCardContent side="left" className="w-40">
              <p className="text-sm">Card on left</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="link">@username</Button>
  </HoverCardTrigger>
  <HoverCardContent className="w-80">
    <div className="flex gap-4">
      <Avatar>
        <AvatarFallback>UN</AvatarFallback>
      </Avatar>
      <div>
        <h4 className="font-semibold">User Name</h4>
        <p className="text-sm text-muted-foreground">
          Description text here.
        </p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>

{/* With positioning */}
<HoverCardContent side="top" align="start">
  ...
</HoverCardContent>`}</code>
          </pre>
        </div>
      </div>

      <ComponentNav currentHref="/components/hover-card" />
    </div>
  );
}
