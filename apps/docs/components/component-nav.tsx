import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getComponentNav } from "@/lib/components-list";

interface ComponentNavProps {
  currentHref: string;
}

export function ComponentNav({ currentHref }: ComponentNavProps) {
  const { prev, next } = getComponentNav(currentHref);

  return (
    <div className="flex items-center justify-between border-t pt-6 mt-8">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <div className="text-left">
            <div className="text-xs uppercase tracking-wide">Previous</div>
            <div className="font-medium text-foreground group-hover:text-primary">{prev.name}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary text-right"
        >
          <div>
            <div className="text-xs uppercase tracking-wide">Next</div>
            <div className="font-medium text-foreground group-hover:text-primary">{next.name}</div>
          </div>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
