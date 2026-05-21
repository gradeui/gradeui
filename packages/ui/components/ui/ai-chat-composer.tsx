"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Paperclip, Send, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AIChatComposer — the bottom "input card" used by any chat surface.
 *
 * Extracted from <AIChat> so other hosts (Studio's left-column chat,
 * future copilot panels) can drop in the same composer affordances —
 * auto-growing textarea, image attachments via paperclip + clipboard
 * paste, chips with previews, Send/Stop toggle — without re-rolling
 * them. <AIChat> itself now renders this internally.
 *
 * State split:
 *   - `value` / `onChange` are CONTROLLED by the host so hosts can
 *     enforce their own length limits, seed prompts from templates,
 *     or sync with external state.
 *   - `attachments` are INTERNAL — the composer owns them, manages
 *     their object URLs (creates on add, revokes on remove/send/
 *     unmount), and hands them off via `onSend(text, attachments?)`.
 *     This means hosts never have to wire object-URL plumbing, but
 *     can't seed attachments either. That's the right trade for now;
 *     promoting them to controlled props is additive later.
 *
 * Loading semantics:
 *   - `isLoading=true` disables the textarea + paperclip and swaps
 *     Send → Stop. `onStop` fires when the user clicks Stop. If
 *     `onStop` is omitted while `isLoading` is true, the Stop button
 *     renders but is inert (host can choose to render its own stop
 *     UI elsewhere).
 */

export interface ChatAttachment {
  id: string;
  file: File;
  /** Object URL the composer owns. Hosts must NOT revoke it. */
  previewUrl: string;
  name: string;
}

export interface AIChatComposerProps {
  /** Controlled textarea value. */
  value: string;
  /** Fires for every textarea change. */
  onChange: (next: string) => void;
  /**
   * Fires when the user submits (Enter without shift, or click Send).
   * The composer has already validated that there's text OR
   * attachments before firing. `attachments` is `undefined` when
   * none were added so single-arg callbacks keep working.
   */
  onSend: (text: string, attachments?: ChatAttachment[]) => void;
  /** While true, textarea + paperclip disable and Send becomes Stop. */
  isLoading?: boolean;
  /** Fires when the user clicks Stop. Required for Stop to be active. */
  onStop?: () => void;
  placeholder?: string;
  /** Hard cap on textarea contents (passed to the underlying element). */
  maxLength?: number;
  /**
   * Show the "Press Enter to send… · Paste images to attach" hint
   * below the composer card. Defaults to true; hosts that render
   * their own footer (e.g. Studio's char counter + disclaimer)
   * should pass false.
   */
  showHint?: boolean;
  className?: string;
}

export const AIChatComposer = forwardRef<HTMLTextAreaElement, AIChatComposerProps>(
  function AIChatComposer(
    {
      value,
      onChange,
      onSend,
      isLoading = false,
      onStop,
      placeholder = "Ask a question...",
      maxLength,
      showHint = true,
      className,
    },
    forwardedRef
  ) {
    const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Mirror attachments into a ref so unmount cleanup can revoke
    // object URLs against the *current* list (a `[]` deps cleanup
    // would otherwise capture the empty initial value).
    const attachmentsRef = useRef<ChatAttachment[]>(attachments);
    attachmentsRef.current = attachments;

    // Auto-resize textarea on value change.
    useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }, [value]);

    // Revoke any outstanding object URLs on unmount.
    useEffect(() => {
      return () => {
        attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      };
    }, []);

    const addImageFiles = (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;
      const next: ChatAttachment[] = images.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
      }));
      setAttachments((prev) => [...prev, ...next]);
    };

    const removeAttachment = (id: string) => {
      setAttachments((prev) => {
        const target = prev.find((a) => a.id === id);
        if (target) URL.revokeObjectURL(target.previewUrl);
        return prev.filter((a) => a.id !== id);
      });
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageFiles = items
        .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
        .map((it) => it.getAsFile())
        .filter((f): f is File => f !== null);
      if (imageFiles.length > 0) {
        e.preventDefault();
        addImageFiles(imageFiles);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addImageFiles(Array.from(e.target.files));
      // Reset so re-picking the same file fires `change` again.
      e.target.value = "";
    };

    const handleSend = () => {
      const text = value.trim();
      const hasText = text.length > 0;
      const hasAttachments = attachments.length > 0;
      if ((!hasText && !hasAttachments) || isLoading) return;
      onSend(text, hasAttachments ? attachments : undefined);
      // Revoke + clear after handing off — hosts shouldn't manage these.
      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      setAttachments([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    // Merge our internal ref with the forwarded one so hosts can
    // focus/select on the textarea (Studio uses this when seeding a
    // prompt from a template).
    const setTextareaRef = (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    };

    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "rounded-xl bg-rds-gray-50 dark:bg-[#1a1a1a]",
            "border border-rds-gray-200 dark:border-[#252525]",
            "focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent",
            "transition-shadow"
          )}
        >
          {/* Attachment chips — image previews with a remove
              affordance. Hidden entirely when there's nothing
              attached so the composer stays compact. */}
          <AnimatePresence initial={false}>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 p-2 border-b border-rds-gray-200 dark:border-[#252525]">
                  {attachments.map((att) => (
                    <div key={att.id} className="relative group">
                      <img
                        src={att.previewUrl}
                        alt={att.name}
                        className="h-14 w-14 rounded-md object-cover border border-rds-gray-200 dark:border-[#252525]"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        aria-label={`Remove ${att.name}`}
                        className={cn(
                          "absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full",
                          "bg-rds-gray-900 dark:bg-white",
                          "text-white dark:text-rds-gray-900",
                          "flex items-center justify-center",
                          "opacity-0 group-hover:opacity-100 focus:opacity-100",
                          "focus:outline-none focus:ring-2 focus:ring-primary",
                          "transition-opacity"
                        )}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multiline textarea — auto-resizes via the effect above.
              Paste handler captures clipboard images and routes them
              through the same intake as the file picker. */}
          <textarea
            ref={setTextareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            maxLength={maxLength}
            className={cn(
              "w-full resize-none bg-transparent",
              "px-3 sm:px-4 pt-3 pb-1",
              "text-sm text-rds-gray-900 dark:text-white",
              "placeholder:text-rds-gray-400",
              "focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "min-h-[44px] max-h-[200px] overflow-y-auto"
            )}
          />

          {/* Action row — attach on the left, send/stop on the right. */}
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                aria-label="Attach image"
                title="Attach image"
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  "text-rds-gray-500",
                  "hover:text-rds-gray-900 dark:hover:text-white",
                  "hover:bg-rds-gray-200 dark:hover:bg-[#252525]",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  "transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={isLoading ? onStop : handleSend}
              disabled={
                isLoading
                  ? !onStop
                  : !value.trim() && attachments.length === 0
              }
              aria-label={isLoading ? "Stop" : "Send"}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                isLoading
                  ? "bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                  : value.trim() || attachments.length > 0
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-rds-gray-200 dark:bg-[#252525] text-rds-gray-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Square className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Hidden file input driven by the paperclip button. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {showHint && (
          <p className="text-xs text-rds-gray-400 mt-2 text-center hidden sm:block">
            Press Enter to send, Shift+Enter for new line · Paste images to attach
          </p>
        )}
      </div>
    );
  }
);
