import "server-only";

/**
 * Resend wrapper.
 *
 * One place that owns: the SDK client, the FROM address, and the
 * "is email even configured?" check. Every transactional email
 * (invitations, notifications, exports) routes through this so we
 * have a single place to add rate-limiting, retry, or replace
 * Resend with another provider later.
 *
 * Magic-link delivery for auth does NOT go through this — that's
 * configured separately in the Supabase dashboard's SMTP settings
 * (which can ALSO point at Resend, but routes through Supabase's
 * own templating).
 */

import { Resend } from "resend";

let cached: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (cached) return cached;
  cached = new Resend(key);
  return cached;
}

function fromAddress(): string {
  return process.env.GRADE_EMAIL_FROM ?? "Grade <noreply@gradeui.com>";
}

export interface SendEmailInput {
  to: string;
  subject: string;
  /** Plain-text body. We deliberately favour plain-text invites
   *  over HTML — clearer for the recipient, no rendering quirks,
   *  works in every client. Switch to HTML if/when a marketing
   *  designer asks for it. */
  text: string;
}

export interface SendEmailResult {
  status: "sent" | "skipped" | "failed";
  id?: string;
  error?: string;
}

/** Send a transactional email. Returns `skipped` when Resend isn't
 *  configured (local-only mode) — the caller decides whether that's
 *  a problem. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getResend();
  if (!client) {
    return { status: "skipped" };
  }
  try {
    const { data, error } = await client.emails.send({
      from: fromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    if (error) {
      return { status: "failed", error: error.message };
    }
    return { status: "sent", id: data?.id };
  } catch (err) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** True when Resend is configured. Used by the UI to show or hide
 *  the "Invite" button without leaking the env var to the client. */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
