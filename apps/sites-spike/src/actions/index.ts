import { defineAction } from "astro:actions";
import { z } from "astro:schema";

/**
 * Astro Actions — the framework's built-in, type-safe form/RPC mechanism.
 * A form posts here, the input is validated against the zod schema (server
 * side, so it can't be bypassed), and the handler runs on the server.
 *
 * NOTE ON HOSTING: actions run server-side. Under `astro dev` the dev server
 * IS the server, so this works with no adapter. For a production `astro build`
 * you need a server adapter so the `/_actions/*` endpoint exists — e.g.
 *   pnpm add @astrojs/node
 *   // astro.config: adapter: node({ mode: "standalone" })
 * The page itself stays static; only this endpoint is server-rendered.
 */
export const server = {
  contact: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().trim().min(1, "Please add your name."),
      email: z.string().trim().email("That email doesn't look right."),
      message: z.string().trim().min(10, "A little more detail please (10+ chars)."),
    }),
    handler: async ({ name, email, message }) => {
      // ───────────────────────────────────────────────────────────────
      // TODO(resend): wire the real send. gradeui already uses Resend for
      // invitations, so the pattern is in the repo. Roughly:
      //
      //   import { Resend } from "resend";
      //   const resend = new Resend(import.meta.env.RESEND_API_KEY);
      //   await resend.emails.send({
      //     from: "Site <hello@yourdomain.com>",
      //     to: "ali@gradeui.com",
      //     replyTo: email,
      //     subject: `New contact from ${name}`,
      //     text: message,
      //   });
      //
      // Until the key's in, just log it so the round-trip is observable.
      // ───────────────────────────────────────────────────────────────
      console.log("[contact] submission received:", { name, email, message });

      return { ok: true as const, received: { name, email } };
    },
  }),
};
