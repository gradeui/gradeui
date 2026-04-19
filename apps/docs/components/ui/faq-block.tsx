import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export interface FAQBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  items: FAQItem[];
  type?: "single" | "multiple";
  defaultOpen?: string | string[];
  maxWidth?: "default" | "wide" | "narrow" | "full";
}

const maxWidthClasses = {
  default: "max-w-3xl",
  wide: "max-w-5xl",
  narrow: "max-w-2xl",
  full: "max-w-none",
};

const FAQBlock = React.forwardRef<HTMLDivElement, FAQBlockProps>(
  (
    {
      className,
      items,
      type = "single",
      defaultOpen,
      maxWidth = "default",
      ...props
    },
    ref
  ) => {
    const accordionItems = items.map((item, index) => (
      <AccordionItem key={index} value={`item-${index}`}>
        <AccordionTrigger>{item.question}</AccordionTrigger>
        <AccordionContent>
          {typeof item.answer === "string" ? (
            <p>{item.answer}</p>
          ) : (
            item.answer
          )}
        </AccordionContent>
      </AccordionItem>
    ));

    return (
      <div
        ref={ref}
        className={cn("w-full mx-auto", maxWidthClasses[maxWidth], className)}
        {...props}
      >
        {type === "single" ? (
          <Accordion
            type="single"
            collapsible
            defaultValue={defaultOpen as string}
            className="w-full"
          >
            {accordionItems}
          </Accordion>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={defaultOpen as string[]}
            className="w-full"
          >
            {accordionItems}
          </Accordion>
        )}
      </div>
    );
  }
);

FAQBlock.displayName = "FAQBlock";

export { FAQBlock };
