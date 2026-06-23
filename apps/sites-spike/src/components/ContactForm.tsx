import { useState } from "react";
import { actions } from "astro:actions";
import { Input, Textarea, Label, Button, Callout } from "@gradeui/ui";

/* Grade-styled contact form, wired to the `contact` Astro Action (src/actions).
   A client:load island: the markup is Grade components, the submit calls the
   action programmatically so we keep controlled state + inline field errors.
   Server-side zod validation is the source of truth; we surface its per-field
   messages via the action's per-field `error.fields`. */

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    const form = e.currentTarget;
    const { data, error } = await actions.contact(new FormData(form));

    if (error) {
      // Validation errors carry per-field messages on `.fields`; anything
      // else (network, server) is a generic failure.
      const fe = (error as { fields?: Record<string, string[] | undefined> }).fields;
      if (fe) {
        setErrors({ name: fe.name?.[0], email: fe.email?.[0], message: fe.message?.[0] });
        setStatus("idle");
      } else {
        setStatus("error");
      }
      return;
    }

    if (data?.ok) {
      form.reset();
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <Callout variant="success" className="max-w-md">
        Thanks, your message is on its way. We'll be in touch shortly.
      </Callout>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-name">Name</Label>
        <Input id="cf-name" name="name" placeholder="Your name" autoComplete="name" />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-email">Email</Label>
        <Input
          id="cf-email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-message">Message</Label>
        <Textarea
          id="cf-message"
          name="message"
          rows={4}
          placeholder="How can we help?"
        />
        {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
      </div>

      {status === "error" && (
        <Callout variant="destructive">
          Something went wrong sending that. Please try again.
        </Callout>
      )}

      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
