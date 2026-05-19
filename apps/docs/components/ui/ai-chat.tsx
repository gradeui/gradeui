"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Icon-light by design (May 2026 refresh) — mirror of
// packages/ui/components/ui/ai-chat.tsx. No avatar circles, no
// sparkle decoration. User/assistant differentiate via alignment +
// bubble colour only.

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  suggestedPrompts?: Array<{ icon?: React.ReactNode; text: string }>;
  className?: string;
}

const DEFAULT_SUGGESTED_PROMPTS = [
  { text: "Ask me anything" },
  { text: "Quick summary" },
];

export function AIChat({
  messages = [],
  onSendMessage,
  isLoading = false,
  placeholder = "Ask a question...",
  suggestedPrompts = DEFAULT_SUGGESTED_PROMPTS,
  className,
}: AIChatProps) {
  const [query, setQuery] = useState("");
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Track scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setIsScrolledUp(scrollTop < scrollHeight - clientHeight - 50);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll to bottom only when new messages are added (not on mount)
  useEffect(() => {
    // Only scroll if messages were actually added (not on initial render)
    if (messages.length > prevMessagesLengthRef.current && !isScrolledUp) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isScrolledUp]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [query]);

  const handleSend = () => {
    if (!query.trim() || isLoading) return;
    onSendMessage?.(query.trim());
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex flex-col bg-white dark:bg-[#141414] rounded-lg border border-rds-gray-200 dark:border-[#252525] overflow-hidden", className)}>
      {/* Header — text-only in the icon-light refresh. */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-3 border-b border-rds-gray-200 dark:border-[#252525]"
      >
        <span className="text-sm font-medium text-rds-gray-900 dark:text-white">
          AI Assistant
        </span>
      </motion.div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative" data-lenis-prevent>
        {/* Scroll fade gradient */}
        <AnimatePresence>
          {isScrolledUp && messages.length > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white dark:from-[#141414] to-transparent pointer-events-none z-10"
            />
          )}
        </AnimatePresence>

        <div className="p-4 space-y-4">
          {/* Empty state — text-led, no decorative sparkle. Chips are
              plain text in the icon-light refresh. */}
          <AnimatePresence>
            {messages.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <h3 className="text-lg font-semibold text-rds-gray-900 dark:text-white mb-2">
                  How can I help?
                </h3>
                <p className="text-sm text-rds-gray-500 dark:text-rds-gray-400 max-w-xs mb-6">
                  Ask a question or pick a prompt to get started.
                </p>

                {/* Suggested prompts */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedPrompts.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setQuery(prompt.text)}
                      className={cn(
                        "px-3 py-2 rounded-xl",
                        "bg-rds-gray-100 dark:bg-[#1a1a1a]",
                        "text-sm text-rds-gray-700 dark:text-rds-gray-300",
                        "hover:bg-rds-gray-200 dark:hover:bg-[#252525]",
                        "border border-rds-gray-200 dark:border-[#252525]",
                        "transition-colors duration-200"
                      )}
                    >
                      {prompt.text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat messages — no avatar circles; alignment + bubble
              colour do the differentiation. */}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", message.role === "user" && "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 border",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground border-primary rounded-tr-sm"
                    : "bg-rds-gray-100 dark:bg-[#1a1a1a] border-rds-gray-200 dark:border-[#252525] rounded-tl-sm"
                )}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}

          {/* AI Thinking Indicator — no avatar; left-aligned bubble. */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex"
              >
                <div className="bg-rds-gray-100 dark:bg-[#1a1a1a] rounded-2xl rounded-tl-sm px-4 py-3 border border-rds-gray-200 dark:border-[#252525]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rds-gray-500 italic">Thinking</span>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [0, -4, 0],
                            opacity: [0.4, 1, 0.4],
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-rds-gray-200 dark:border-[#252525] p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl px-3 sm:px-4 h-[46px]",
                "bg-rds-gray-50 dark:bg-[#1a1a1a]",
                "border border-rds-gray-200 dark:border-[#252525]",
                "text-sm text-rds-gray-900 dark:text-white",
                "placeholder:text-rds-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>

          <button
            onClick={isLoading ? undefined : handleSend}
            disabled={!query.trim() && !isLoading}
            className={cn(
              "h-[46px] w-[46px] rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
              isLoading
                ? "bg-red-500 hover:bg-red-600 text-white"
                : query.trim()
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-rds-gray-100 dark:bg-[#252525] text-rds-gray-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Square className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-xs text-rds-gray-400 mt-2 text-center hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
