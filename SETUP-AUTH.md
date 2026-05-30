# Auth + cloud storage setup

Grade ships with auth turned **off** by default. A fresh clone runs `pnpm dev` and gets a fully working Studio with localStorage-only persistence — no sign-up, no keys, no setup. This is the open-source story.

When you want **cloud storage + sign-in** (the hosted gradeui.com flavour, or a self-host with multi-device sync), you wire up Supabase + Resend. That's what this doc covers.

## What you get when you turn auth on

- A required sign-in gate on `/studio`.
- Cloud-backed projects, teams, orgs, comments — synced across devices.
- Invitations via email — share a project with a teammate by email.
- A first-sign-in migration that copies any existing localStorage data into the new cloud account.

All of this is **optional**. If you skip this doc, Studio keeps working in local-only mode.

## Prerequisites

You'll need:

- A Supabase project — [supabase.com](https://supabase.com), free tier is fine to start
- A Resend account — [resend.com](https://resend.com), free tier is fine to start, paid for higher volume
- A domain you control (for the email FROM address) — optional but recommended

## 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Once it's provisioned, open **Settings → API**. Copy the **Project URL** and the **anon public** key.
3. Open the SQL editor and run the migration: copy the contents of `apps/docs/supabase/migrations/0001_studio_schema.sql` into a new query and execute it. This creates every table + RLS policy Studio needs.

## 2. Enable Google OAuth (recommended)

1. In Supabase: **Authentication → Providers → Google → enabled**.
2. Follow the link to the Google Cloud Console. Create an OAuth client (type: Web application).
3. Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorised redirect URI. (Supabase tells you the exact URL.)
4. Copy the Google client ID + secret back into Supabase's Google provider settings.

If you'd rather skip Google and use email only, set `NEXT_PUBLIC_GRADE_AUTH_PROVIDERS=email` in env (see step 5).

## 3. Configure Resend for magic-link emails

You can either:

- **Use Supabase's built-in email** (fastest, lower delivery quality, rate-limited). Skip to step 4.
- **Use Resend as Supabase's SMTP backend** (recommended for any real deploy).

For the Resend path:

1. Sign up at [resend.com](https://resend.com). Add and verify your domain.
2. Create an SMTP credential — Resend gives you a username + password.
3. In Supabase: **Authentication → SMTP Settings**. Enter the Resend SMTP host (`smtp.resend.com`), port `465`, your verified-domain FROM address, and the SMTP credentials.

## 4. Get your Resend API key (for invitations)

Magic-link emails go via Supabase's SMTP setup above. Invitation emails go directly via Resend's API.

1. In Resend: **API Keys → create**. Copy the key.
2. You'll set this as `RESEND_API_KEY` in step 5.

## 5. Set env vars

Copy `apps/docs/.env.example` to `apps/docs/.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # for invitations + signup-time tasks

# Which sign-in buttons to show. Optional.
# Default if unset: google,email
NEXT_PUBLIC_GRADE_AUTH_PROVIDERS=google,email

# Resend for invitations
RESEND_API_KEY=<resend-api-key>
GRADE_EMAIL_FROM="Grade <noreply@yourdomain.com>"
```

The service-role key is in **Settings → API → service_role secret** on Supabase. Treat it like a database password — server-only, never expose to the browser.

## 6. Restart `pnpm dev`

Stop and restart the dev server so it picks up the new env vars. Hit `/studio` — you should now be redirected to `/sign-in`. Sign in with Google or by entering your email; on the first sign-in, any existing localStorage projects are migrated into your new cloud account.

## Verifying it worked

- **Sign-in page renders.** `localhost:3000/sign-in` shows the Google button + email field.
- **Studio gate works.** `localhost:3000/studio` redirects to `/sign-in` when signed out.
- **Local data migrated.** After your first successful sign-in, the projects you had in localStorage appear in `/studio` and the projects table in Supabase has matching rows.
- **Invitation flow.** From a project's settings, invite a different email. The recipient gets an email; clicking the link signs them in (or prompts them to sign up) and adds them to the project.

## Troubleshooting

- **"Sign-in page works but auth callback returns to /sign-in?error=…"** — usually the Google OAuth redirect URI doesn't match. Double-check the value in Google Cloud Console against what Supabase shows.
- **"Magic link email never arrives"** — check Resend's dashboard for delivery logs. If you're using Supabase's built-in email, check **Authentication → Logs** for rate-limit messages.
- **"Studio works locally but gating fails in production"** — Vercel/your host needs the same env vars. The `NEXT_PUBLIC_*` ones must be set at build time, not just runtime.
- **"Migration didn't copy my local projects"** — open the browser console, look for `[studio-storage]` logs. The migration is idempotent and re-runs until the flag is set, so retry on next sign-in.

## Turning auth back off

Unset `NEXT_PUBLIC_SUPABASE_URL` (or comment it out) and restart the dev server. Studio reverts to local-only mode; cloud projects are still in Supabase but not visible until you flip auth back on.

## What's not configured yet

These are deliberately out of scope for the v1 auth wire-up:

- **Stripe / billing.** Plan changes don't sync to a payment processor.
- **Plan enforcement.** Limits stored on Org rows are displayed but not blocked on.
- **Onboarding modal.** First sign-in drops the user straight into Studio with no name-capture step.

See `apps/docs/STUDIO-SHELL.md` for the architecture overview.
