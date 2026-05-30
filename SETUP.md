# Setting up gradeui from a fresh clone

This is the one-time setup to take this monorepo from "code on disk" to "live, publishing `@gradeui/*` packages, and serving the docs site at gradeui.com". If you're reading this because you just pulled the repo down for the first time, work top to bottom.

Rough time estimate: 30–45 minutes, most of it waiting on DNS and npm/GitHub organizational stuff.

---

## 0. Prerequisites

- Node **≥ 20**
- pnpm **≥ 9** — `npm install -g pnpm@9`
- A GitHub account with permission to create an organization
- An npm account with 2FA enabled (required for automation tokens)
- Vercel account with `gradeui.com` already registered (✅ you said this is done)

Verify:

```bash
node --version     # v20.x or higher
pnpm --version     # 9.x or higher
```

Install deps:

```bash
pnpm install
```

---

## 1. GitHub — create the org and repo

1. Go to https://github.com/account/organizations/new
   - **Organization account name:** `gradeui`
   - **Plan:** Free is fine to start. Team plan (~$4/user/mo) if you want private repos with more than 3 collaborators later.
2. Create a new repo inside the org:
   - Name: `gradeui`
   - Visibility: **Private — and leave it private.** `@gradeui/pro` source (and eventually `packages/clients/*` source) lives in this repo, so the repo itself must stay closed. The **npm packages** can still publish publicly (`@gradeui/ui`, `@gradeui/core`) or restricted (`@gradeui/pro`) independently — npm access and GitHub visibility are not the same knob. See `CLAUDE.md` § "The tiering model".
   - **Do not** initialize with a README, .gitignore, or license — we already have those.
3. Note the remote URL: `git@github.com:gradeui/gradeui.git` (SSH) or `https://github.com/gradeui/gradeui.git` (HTTPS).

Wire it up from this working copy:

```bash
cd /path/to/gradeui
git remote add origin git@github.com:gradeui/gradeui.git
git push -u origin main
```

If the first commit hasn't been made yet (the repo hasn't been git-init'd), do that first:

```bash
git init -b main
git add .
git commit -m "chore: initial import — @grade monorepo scaffolded from ramp-ds"
git remote add origin git@github.com:gradeui/gradeui.git
git push -u origin main
```

---

## 2. npm — create the `grade` org and an automation token

1. Sign in to https://www.npmjs.com/signup-org and create an organization named **`grade`** (lowercase; this is the npm scope — it becomes `@gradeui/...`).
   - **Plan:** Free works for public packages only. To publish `@gradeui/pro` as restricted you need the **Teams** plan (~$7/user/mo) — [npm pricing](https://www.npmjs.com/products).
2. Under org settings, invite any team members who need publish rights.
3. Generate an automation token:
   - Profile → **Access Tokens** → **Generate New Token** → choose **Automation** (not Publish — Automation tokens skip 2FA, which is what CI needs).
   - Copy the token. You will not see it again.
4. Add it as a GitHub repo secret:
   - Go to `https://github.com/gradeui/gradeui/settings/secrets/actions`
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: the token from step 3

The `GITHUB_TOKEN` is provided automatically by GitHub Actions — you do not need to add it.

### Sanity check the scope

Before the first publish, confirm the scope resolves:

```bash
npm view @gradeui/ui
# should return "npm ERR! 404 Not Found" (meaning the name is available, not taken)
```

---

## 3. Vercel — deploy the docs site

The docs site lives at `apps/docs/` and should serve `gradeui.com`.

1. In Vercel, **Add New → Project** → import the `gradeui/gradeui` repo.
2. When Vercel asks for framework config:
   - **Root Directory:** `apps/docs`
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** leave default (`next build`) — Vercel infers `pnpm build` from the root lockfile
   - **Install Command:** `pnpm install` (Vercel detects pnpm automatically from `packageManager`)
3. Environment variables — auth + cloud storage are **optional**. Without these vars, gradeui.com boots in local-only mode (Studio works, sign-in gate bypassed, data in localStorage). When you're ready to turn auth on, follow [SETUP-AUTH.md](./SETUP-AUTH.md) — it walks through creating the Supabase project, running the SQL migration, enabling providers, and setting:

   | Name | Value | Environments |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Preview + Production |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key from Supabase | Preview + Production |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret key from Supabase | Preview + Production |
   | `NEXT_PUBLIC_GRADE_AUTH_PROVIDERS` | `google,email` (or just `email`) | Preview + Production |
   | `RESEND_API_KEY` | optional — for invitation emails | Preview + Production |
   | `GRADE_EMAIL_FROM` | optional — `Grade <noreply@yourdomain>` | Preview + Production |

   After adding `NEXT_PUBLIC_*` vars you must redeploy — they bake at build time.

4. Attach the domain:
   - **Project Settings → Domains** → add `gradeui.com`
   - Vercel will guide you through the DNS changes. If `gradeui.com` was bought through Vercel, it's one click.

After deploy, `https://gradeui.com` should serve the docs site.

---

## 4. First publish (sanity check)

Once `NPM_TOKEN` is in GitHub secrets and the repo has been pushed:

```bash
# 1. Record a changeset for the first real release
pnpm changeset
# Choose @gradeui/core, @gradeui/ui (skip @gradeui/pro for now if the placeholder is empty)
# Bump type: minor (0.1.0 → 0.2.0) or whatever you prefer
# Write a brief summary

# 2. Commit and push — do NOT run changeset version locally; CI does that
git add .changeset/
git commit -m "chore: first release changeset"
git push
```

On push to `main`, `.github/workflows/publish.yml` runs. It will:
1. Detect the pending changeset
2. Open a PR titled **"chore: version packages"** that bumps versions + updates CHANGELOGs
3. When you merge that PR, the same workflow re-runs and publishes to npm

Verify:

```bash
npm view @gradeui/ui version
```

If that returns a version, you're live.

---

## 5. Check: three-tier publishing model

Before you consider setup done, confirm each tier is wired correctly:

### Public (`@gradeui/ui`, `@gradeui/core`)
```bash
cat packages/ui/package.json  | grep -A2 publishConfig
# should say: "access": "public"
```

### Restricted (`@gradeui/pro`)
```bash
cat packages/pro/package.json | grep -A2 publishConfig
# should say: "access": "restricted"
```
And confirm `packages/pro/LICENSE.md` exists (commercial license, NOT MIT).

### Per-client (when you add one)
Client packages live under `packages/clients/<name>/` inside this same repo. When you add the first one, also add `packages/clients/*` to `pnpm-workspace.yaml`. Each client package should be `publishConfig.access: "restricted"` with its own LICENSE (not MIT, not the pro license). See `CLAUDE.md` § "The tiering model".

Extracting client code to a separate repo is an escape hatch, not the default — only do it when one client's work outgrows the monorepo or their legal team requires source isolation.

---

## 5b. Auth on gradeui.com

`apps/docs` ships with Supabase Auth (Google OAuth + email magic-link) wired in but inert until you set the env vars. Full setup walkthrough: [SETUP-AUTH.md](./SETUP-AUTH.md). Short version:

1. Create a Supabase project, copy URL + publishable key + secret key
2. Run `apps/docs/supabase/migrations/0001_studio_schema.sql` in the Supabase SQL editor
3. Enable providers (Google in the Supabase dashboard; email magic-link is on by default)
4. Drop the env vars from §3 above into Vercel + redeploy
5. For local dev: copy `apps/docs/.env.example` to `apps/docs/.env.local`, fill in the same vars

Auth + cloud storage is **optional** — a deploy with no Supabase env vars boots in local-only mode (no sign-in gate, localStorage-only). This is the self-host story.

The current setup lets users sign in. It does **not** yet enforce paid-pro entitlement — that's the next layer (entitlements check on top of the Supabase session), to be added when `@gradeui/pro` content actually lands. Architecture detail in `apps/docs/STUDIO-SHELL.md` § "How auth works".

---

## 6. Optional but recommended

- **Enable Renovate or Dependabot** on the repo for dependency updates.
- **Branch protection on `main`:** require PRs + CI green before merge. Settings → Branches.
- **Set up the `gradeui` GitHub org's default workflow permissions** to "Read and write" so `changesets/action@v1` can push the version-bump PR. Org Settings → Actions → General → Workflow permissions.
- **Add a GitHub Project** to track component work if the backlog grows.

---

## Troubleshooting

**"Cannot find module '@gradeui/ui'" in `apps/consume-app`** — run `pnpm install` at the repo root, not inside the app. pnpm workspaces need the top-level lockfile.

**Changesets action fails with "remote: Permission denied"** — the org-level workflow permissions are set to read-only. Fix under Organization → Settings → Actions → General.

**`pnpm release` publishes `@gradeui/docs` or `@gradeui/consume-app` by accident** — those are marked `"private": true` in their package.json and are listed in `.changeset/config.json`'s `ignore`. If a publish attempt still happens, check both of those haven't been edited out.

**npm 402 "Payment required" on `@gradeui/pro` publish** — you need the Teams plan for restricted packages. Either upgrade the npm org or keep `@gradeui/pro` at `"private": true` until you do.
