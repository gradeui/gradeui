"use client";

import * as React from "react";
import { Composer, type ComposerHandle, type ComposerAttachment } from "./composer";
import { cn } from "@/lib/utils";

/**
 * AIChatComposer — preset that wraps <Composer> with the chat-input
 * shape: plain text, image attachments via paperclip + clipboard
 * paste, Send/Stop, optional "Press Enter to send" hint below.
 *
 * Refactored to use Composer internally (2026-05-29). The previous
 * textarea-based implementation duplicated all the attachment
 * lifecycle, paste handling, and submit logic that now lives in
 * Composer. This is a thin shim so existing call sites (<AIChat>,
 * Studio's left-column chat, copilot panels) keep working without
 * touching their props.
 *
 * State split (unchanged from the original API):
 *   - `value` / `onChange` are CONTROLLED by the host. Internally the
 *     Composer is uncontrolled; we bridge via Composer's `onChange`
 *     prop for typing events and via the imperative ref handle for
 *     external value sync (host setting `value=""` after a send, or
 *     seeding from a template).
 *   - `attachments` are INTERNAL to Composer — `attachments={true}`
 *     opts in to its built-in image paste + paperclip intake. Hosts
 *     never wire object URL plumbing.
 *
 * Loading semantics (unchanged):
 *   - `isLoading=true` disables the editor + paperclip and swaps
 *     Send → Stop. `onStop` fires on Stop click. If `onStop` is
 *     omitted while `isLoading` is true, Stop renders but is inert.
 */

// Re-export under the historical name so existing imports keep working.
export type ChatAttachment = ComposerAttachment;

export interface AIChatComposerProps {
  /** Controlled value. */
  value: string;
  /** Fires for every change in the editor (forwarded from Composer's onChange). */
  onChange: (next: string) => void;
  /**
   * Fires when the user submits (Enter without shift, or click Send).
   * Validated (text or attachments) before firing. `attachments` is
   * `undefined` when none were added so single-arg callbacks keep
   * working.
   */
  onSend: (text: string, attachments?: ChatAttachment[]) => void;
  /** While true, editor + paperclip disable and Send becomes Stop. */
  isLoading?: boolean;
  /** Fires when the user clicks Stop. Required for Stop to be active. */
  onStop?: () => void;
  placeholder?: string;
  /** Hard cap on contents. */
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

export const AIChatComposer = React.forwardRef<HTMLTextAreaElement, AIChatComposerProps>(
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
    _forwardedRef,
  ) {
    // ComposerHandle ref — used to bridge controlled `value` into the
    // uncontrolled Composer (sync external resets, seed from template).
    const composerRef = React.useRef<ComposerHandle>(null);

    // External-value sync: when the host changes `value` to something
    // different from what the editor currently holds, push it into the
    // Composer. The typical case is `value=""` after a send (host
    // resets controlled state), which produces an empty editor.
    // Guard with a "we just emitted this" flag so we don't loop:
    //   Composer emits onChange → host updates value → effect fires →
    //   would push back into Composer, etc.
    const lastEmittedRef = React.useRef<string>("");
    React.useEffect(() => {
      if (value === lastEmittedRef.current) return;
      const handle = composerRef.current;
      if (!handle) return;
      const current = handle.getContent().text;
      if (current === value) return;
      handle.clear();
      if (value) handle.insert(value);
    }, [value]);

    const handleChange = React.useCallback(
      (text: string) => {
        lastEmittedRef.current = text;
        onChange(text);
        // Soft-enforce maxLength: if the host wired it, trim back
        // when the editor exceeds. (Composer doesn't natively cap;
        // see "maxLength" todo in composer.md.)
        if (maxLength !== undefined && text.length > maxLength) {
          const trimmed = text.slice(0, maxLength);
          composerRef.current?.clear();
          composerRef.current?.insert(trimmed);
        }
      },
      [onChange, maxLength],
    );

    const handleSubmit = React.useCallback(
      (content: { text: string }, attachments?: ChatAttachment[]) => {
        const text = content.text.trim();
        if (!text && (!attachments || attachments.length === 0)) return;
        onSend(text, attachments);
        // Host typically resets `value` to "" in onSend. The external-
        // value sync effect above handles the resulting editor clear.
      },
      [onSend],
    );

    return (
      <div className={cn("w-full", className)}>
        <Composer
          ref={composerRef}
          placeholder={placeholder}
          // Plain text only — chat composers don't need rich text. If
          // a host needs formatting they should compose Composer
          // directly with `formats=[...]` and `toolbar`.
          formats={false}
          // Attachments wired through Composer's built-in intake:
          // paperclip in the left slot, clipboard paste interception,
          // chip preview row, object URL lifecycle.
          attachments
          initialText={value}
          onChange={handleChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onStop={onStop}
        />

        {showHint && (
          <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
            Press Enter to send, Shift+Enter for new line · Paste images to
            attach
          </p>
        )}
      </div>
    );
  },
);
