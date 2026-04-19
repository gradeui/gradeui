"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ComponentNav } from "@/components/component-nav";

export default function AvatarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Avatar</h1>
        <p className="text-lg text-muted-foreground mt-2">
          An image element with a fallback for representing the user.
        </p>
      </div>

      {/* Basic */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Basic Avatar
        </h2>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="https://lh3.googleusercontent.com/a/ACg8ocIOGXmSXQygzZNdbYW7PFimVyzO1QchFzKEjIZZvS1CVTL4DTRa=s400-c" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sizes
        </h2>
        <p className="text-muted-foreground">
          Use Tailwind classes to adjust the size.
        </p>
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">SM</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>MD</AvatarFallback>
          </Avatar>
          <Avatar className="h-14 w-14">
            <AvatarFallback>LG</AvatarFallback>
          </Avatar>
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl">XL</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* With Status */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          With Status Indicator
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar>
              <AvatarImage src="https://lh3.googleusercontent.com/a/ACg8ocIOGXmSXQygzZNdbYW7PFimVyzO1QchFzKEjIZZvS1CVTL4DTRa=s400-c" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
          </div>
          <div className="relative">
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-yellow-500 ring-2 ring-background" />
          </div>
          <div className="relative">
            <Avatar>
              <AvatarFallback>AW</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-400 ring-2 ring-background" />
          </div>
        </div>
      </div>

      {/* Group */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Avatar Group
        </h2>
        <div className="flex -space-x-4">
          <Avatar className="ring-2 ring-background">
            <AvatarImage src="https://lh3.googleusercontent.com/a/ACg8ocIOGXmSXQygzZNdbYW7PFimVyzO1QchFzKEjIZZvS1CVTL4DTRa=s400-c" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="ring-2 ring-background">
            <AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <Avatar className="ring-2 ring-background">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="ring-2 ring-background">
            <AvatarFallback>+3</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src="https://github.com/user.png" alt="@user" />
  <AvatarFallback>UN</AvatarFallback>
</Avatar>

{/* Custom size */}
<Avatar className="h-14 w-14">
  <AvatarFallback>LG</AvatarFallback>
</Avatar>

{/* With status */}
<div className="relative">
  <Avatar>
    <AvatarFallback>JD</AvatarFallback>
  </Avatar>
  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
</div>`}</code>
          </pre>
        </div>
      </div>

      <ComponentNav currentHref="/components/avatar" />
    </div>
  );
}
