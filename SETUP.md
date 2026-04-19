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
3. Environment variables — add these under **Project Settings → Environment Variables**:

   | Name | Value | Environments |
   |---|---|---|
   | `AUTH_SECRET` | `openssl rand -base64 32` output | Preview + Production |
   | `GITHUB_CLIENT_ID` | from the OAuth app you'll create below | Preview + Production |
   | `GITHUB_CLIENT_SECRET` | from the same OAuth app | Preview + Production |

4. GitHub OAuth for the docs site's feedback widget:
   - https://github.com/settings/developers → **New OAuth App**
   - Homepage URL: `https://gradeui.com`
   - Callback URL: `https://gradeui.com/api/auth/callback/github`
   - Save the client ID + secret into the Vercel env vars above
   - For local dev, repeat with `http://localhost:3000` URLs and put the values into `apps/docs/.env.local`
5. Attach the domain:
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

`apps/docs` already ships with NextAuth v5 configured for GitHub OAuth. To activate it in production:

1. Create the GitHub OAuth App (step 3, item 4 above) if you haven't already
2. Confirm `AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` are in Vercel's env vars
3. For local dev: copy `apps/docs/.env.example` to `apps/docs/.env.local` and fill it in with the dev-mode OAuth App credentials

The current auth setup lets users sign in. It does **not** yet distinguish paid-pro users from free ones — that's the next layer (entitlements check on top of the session), to be added when `@gradeui/pro` content actually lands. Hook points live in `apps/docs/lib/auth.ts` and `apps/docs/components/auth-provider.tsx`.

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
