"use client";

import * as React from "react";
import { AIChat, type ChatMessage } from "@/components/ui/ai-chat";
import { Composer, type ComposerHandle } from "@/components/ui/composer";

const PROMPT = "Add in a pricing section";
const REPLY =
  "Done. I added a pricing section with three tiers, a monthly and annual toggle, and the Pro plan highlighted. Want me to wire up the CTAs?";

/**
 * Marketing demo of the REAL Studio chat surface (<AIChat>) — the same
 * component Studio uses in its left column, so the homepage shows the
 * actual thing, not a mock-up. A scripted turn plays on a loop: the prompt
 * appears in the composer, posts as a user bubble, the assistant "thinks",
 * then the reply lands. One timeline drives both the messages and the
 * composer text so they stay in sync; the loop only starts once the panel
 * scrolls into view.
 */
export function StudioChatDemo() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const composerRef = React.useRef<ComposerHandle>(null);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );

    const run = () => {
      timers.forEach(clearTimeout);
      timers = [];
      setMessages([]);
      setLoading(false);
      composerRef.current?.clear();
      at(900, () => composerRef.current?.insert(PROMPT));
      at(2200, () => {
        composerRef.current?.clear();
        setMessages([
          { id: "u", role: "user", content: PROMPT, timestamp: new Date() },
        ]);
      });
      at(2700, () => setLoading(true));
      at(4600, () => {
        setLoading(false);
        setMessages((m) => [
          ...m,
          { id: "a", role: "assistant", content: REPLY, timestamp: new Date() },
        ]);
      });
      // Long hold on the finished conversation before it resets and loops.
      at(15000, run);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            run();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-md">
      <div
        className="absolute -inset-px rounded-[var(--gds-radius-xl)] bg-[radial-gradient(60%_60%_at_50%_100%,oklch(var(--primary)/0.18),transparent)] blur-xl"
        aria-hidden="true"
      />
      <div className="relative aspect-square">
        <AIChat
          title="Studio"
          titleIcon={<span className="inline-block h-2 w-2 rounded-full bg-primary" />}
          messages={messages}
          isLoading={loading}
          thinkingPhrase="Building"
          autoScroll={false}
          showActions={false}
          className="h-full shadow-[var(--gds-shadow-xl)]"
          emptyStateSlot={<div className="h-full" aria-hidden="true" />}
          composerSlot={
            <Composer
              ref={composerRef}
              readOnly
              formats={false}
              attachments
              placeholder="Describe a screen, or a change…"
            />
          }
        />
      </div>
    </div>
  );
}
