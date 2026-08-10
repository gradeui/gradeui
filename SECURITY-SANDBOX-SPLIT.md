# SECURITY — sandbox origin split

> Single work item. Kick off a fresh session with: *"Implement the
> sandbox origin split per SECURITY-SANDBOX-SPLIT.md."* Design
> context lives in [STUDIO-CANVAS.md](./design-docs/STUDIO-CANVAS.md) § "The
> sandbox origin"; this file is the actionable checklist.

## Why (threat model, one paragraph)

The Fast Frame iframe loads `/fast-sandbox` from the SAME ORIGIN as the
app, and same-origin iframes are not a security boundary: code inside
can reach `window.parent.document` and the parent's localStorage —
including the Supabase session. Today the only code that runs there is
the signed-in user's own generated JSX, so the risk is theoretical. The
moment *someone else's* code renders in a viewer's browser — shared
screens, community themes, remix, canvas objects — a crafted screen is
stored XSS against every logged-in viewer. postMessage hygiene does not
mitigate this while the origin is shared; the channel isn't the hole,
the origin is. **This item must land before any other-people's-code
surface ships** (it is K4 in STUDIO-CANVAS.md).

## Decision

- **Origin:** `sandbox.gradeui.com` (subdomain) for now. A subdomain is
  a real origin boundary — separate DOM access, separate localStorage.
  The one cross-subdomain channel is cookies set with
  `Domain=.gradeui.com`; Supabase's `sb-*` cookies are host-only by
  default. Upgrading to a separate apex later is a domain mapping + one
  env var, zero code.
- **Deployment:** Option A — same Vercel project, host-routed in
  middleware. No second app, no extra infra; the sandbox bundle stays
  in lockstep with the app by construction.
- **Config:** `NEXT_PUBLIC_SANDBOX_ORIGIN=https://sandbox.gradeui.com`.
  Unset = same-origin fallback (local dev keeps working with zero
  setup; the split can be built and merged before the domain exists).

## Ali's side (5 minutes)

- [ ] Vercel → project → Settings → Domains → add `sandbox.gradeui.com`
      (DNS is automatic on a Vercel-managed domain).
- [ ] Vercel env (Production + Preview):
      `NEXT_PUBLIC_SANDBOX_ORIGIN=https://sandbox.gradeui.com`.
      Leave it OUT of `.env.local`.
- [ ] DevTools → Application → Cookies on gradeui.com: confirm nothing
      sets `Domain=.gradeui.com` (expect host-only `sb-*` cookies).
      Policy going forward: domain-wide cookies are forbidden.

## Implementation checklist (the session's work)

### 1. Host routing — `apps/docs/middleware.ts`
- [ ] Requests with host = sandbox origin: allow ONLY `/fast-sandbox`,
      Next static assets/chunks it needs, and nothing else (404 the
      rest — no /studio, no /api, no auth routes on that host).
- [ ] Requests on the main host for `/fast-sandbox`: 404 (or redirect)
      when `NEXT_PUBLIC_SANDBOX_ORIGIN` is set, so the same-origin copy
      can't be embedded by mistake in prod.

### 2. Iframe src — `apps/docs/components/studio/fast-frame.tsx`
- [ ] `FastIframeHost` builds the iframe URL from
      `NEXT_PUBLIC_SANDBOX_ORIGIN ?? ""` + `/fast-sandbox`.
- [ ] Helper `sandboxOrigin()` exported for the message checks below
      (falls back to `window.location.origin` when unset).

### 3. postMessage hardening — BOTH directions, BOTH renderers
Replace every `"*"` and add origin/source validation. Known touchpoints
(grep `postMessage(` and `grade:` to catch strays):

Parent → sandbox (`targetOrigin` = sandbox origin):
- [ ] `fast-frame.tsx` `postToSandbox` (currently `window.location.origin` — becomes sandbox origin)
- [ ] `studio-canvas.tsx` `postToFocusedIframe` (currently `"*"`)
- [ ] `studio-canvas.tsx` `postMediaPendingToFocusedIframe` (currently `"*"`)

Sandbox → parent (`targetOrigin` = the app origin — pass it into the
iframe via query param or initial handshake; `"*"` only for the very
first `grade:fast-ready` ping if the param is absent):
- [ ] `apps/docs/app/fast-sandbox/page.tsx` — every `window.parent.postMessage`
      (fast-ready, fast-error, fast-compiled, selected, media-sources,
      zoom-gesture, content-height, pins — sweep the whole switch)

Parent listeners (check `e.origin === sandboxOrigin()` AND
`e.source === <our iframe>.contentWindow` before touching payload):
- [ ] `fast-frame.tsx` — zoom-gesture listener, compile/ready/error listeners
- [ ] `studio-canvas.tsx` — `collectMediaSources` response handler, `waitForFastCompiled`
- [ ] `shared-screen.tsx` — zoom-gesture listener
- [ ] `apps/docs/app/studio/page.tsx` — any `grade:*` window listeners (selection, content height)
- [ ] `embed-screen.tsx` — if it listens
- [ ] Sandpack agent (`chat-sandpack.ts`) is ALREADY cross-origin
      (codesandbox.io) — its parent listeners get the same origin
      checks against the Sandpack bundler origin. Two-agent rule: keep
      both agents' message shapes in sync (STUDIO.md).

Inside the sandbox, validate inbound messages too:
- [ ] `fast-sandbox/page.tsx` `handleMessage`: accept only from the
      configured app origin (query param), ignore everything else.

### 4. Same-origin conveniences → messages
Anything reading `iframe.contentDocument` / `contentWindow` internals
breaks cross-origin. Known users:
- [ ] Comment-pin rect tracking in `fast-frame.tsx` (the contentDocument
      polling noted around the pins overlay) — already partially inline
      in the sandbox (`inlineComments`); finish the conversion so the
      parent never touches contentDocument.
- [ ] Content-height reporting (responsive artboard) — ensure it flows
      via the existing `grade:*` message, not scrollHeight polling.
- [ ] **Standalone preview handoff** (`#screen=<key>` + localStorage in
      `fast-sandbox/page.tsx`): localStorage is no longer shared
      cross-origin. Convert to a postMessage handoff or pass the payload
      in the URL hash; otherwise "open preview in new tab" silently breaks.

### 5. Headers (sandbox host responses, via middleware)
- [ ] `Content-Security-Policy`: `frame-ancestors https://gradeui.com
      https://*.vercel.app http://localhost:*`; `connect-src` limited to
      media endpoints actually used (picsum, cover art, generated-media
      storage); no `form-action`; restrictive `default-src`.
- [ ] Main app: keep/confirm it cannot be framed (`frame-ancestors 'none'`
      or X-Frame-Options DENY) — clickjacking guard.

### 6. Docs + verification
- [ ] Update STUDIO.md protocol section: channel is origin-checked;
      document the handshake param.
- [ ] Update STUDIO-CANVAS.md K4 status.
- [ ] Verify (prod preview): pinch/pan/zoom, selection, Fill images +
      shimmer, comments + pins, share view, embed, standalone preview,
      Sandpack parity — all working cross-origin; then from the console
      of an unrelated page, `postMessage` a `grade:*` payload at the app
      and confirm it's ignored.

## Acceptance

`sandbox.gradeui.com` serves the sandbox document and nothing else; the
main host refuses to serve it; generated code executes on an origin with
no session, no app localStorage, no parent DOM; every `grade:*` handler
drops messages from unexpected origins/sources; all Studio features pass
the verification sweep. Local dev unchanged with the env var unset.
