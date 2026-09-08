"use client";

/**
 * StarterGuide: the handholding card the Reviews hub shows to a business
 * that has just started. Four steps in the order that pays back fastest,
 * each one a link into the tool that does it. Static completion for now
 * (sources connected is the one step a new account has done); when the
 * screens share a store, tick these off from real state.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@brightlocal/ui-components/card";
import { Progress } from "@brightlocal/ui-components/progress";
import { Button } from "@brightlocal/ui-components/button";
import { Check, ArrowRight } from "@brightlocal/icons";

const STEPS = [
  {
    id: "connect",
    title: "Connect your review sources",
    detail: "Google is connected. Facebook, Yelp and TripAdvisor take two minutes each.",
    cta: "Connect more",
    goto: "screen:dmswb0i9c6oe5",
    done: true,
  },
  {
    id: "reply",
    title: "Reply to your first review",
    detail: "Four reviews are waiting. A reply within a day is what customers notice.",
    cta: "Open Review Manager",
    goto: "screen:dmsxf5zjggd0n",
    done: false,
  },
  {
    id: "ask",
    title: "Ask happy visitors for a review",
    detail: "A link on a receipt or a QR code by the till is the fastest start.",
    cta: "Create a campaign",
    goto: "screen:dmt094j963aye",
    done: false,
  },
  {
    id: "show",
    title: "Put your best reviews on your website",
    detail: "One line of code. Your showcases are ready to place.",
    cta: "Open Showcase",
    goto: "screen:dmt094lhmpwbs",
    done: false,
  },
];

export function StarterGuide() {
  const done = STEPS.filter((s) => s.done).length;
  return (
    <Card dataHook="starter-guide" className="max-w-none gap-4">
      <CardHeader>
        <div className="flex flex-col gap-1.5">
          <CardTitle>Get your reviews working for you</CardTitle>
          <CardDescription>
            {done} of {STEPS.length} done. Each step takes a few minutes and you can stop any time.
          </CardDescription>
        </div>
        <Progress dataHook="starter-guide-progress" value={(done / STEPS.length) * 100} className="mt-3" />
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {STEPS.map((step, i) => (
          <div key={step.id} data-hook={`starter-step-${step.id}`} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
            <span
              className={
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium " +
                (step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
              }
              aria-hidden
            >
              {step.done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className={"font-medium " + (step.done ? "text-muted-foreground line-through" : "")}>{step.title}</p>
              <p className="text-muted-foreground text-sm">{step.detail}</p>
            </div>
            {step.done ? null : (
              <span className="inline-flex shrink-0" data-grade-goto={step.goto}>
                <Button variant={i === 1 ? "primary" : "outline"} size="sm" dataHook={`starter-step-${step.id}-cta`}>
                  {step.cta}
                  <ArrowRight className="size-4" />
                </Button>
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
