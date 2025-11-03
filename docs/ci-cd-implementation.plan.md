### Recommended architecture at a glance

- CI on pull requests: `lint` → `test:coverage` (90% gate) → `build`.
- Preview deploys for every PR to Firebase Hosting (Preview Channels) on your Dev project.
- Staging deploy on merge to `main` to a separate Firebase project.
- Keep everything on the Spark (free) plan; no SSR or App Hosting used.
- Secrets and env management via GitHub Actions repo/environment secrets and variables per environment.
- Deploys performed by a dedicated Firebase service account; local manual deploys remain enabled.

---

### Step 1 — Create Firebase projects and enable Hosting

Create two Firebase projects (region defaults are fine on Spark):

- -[x] dev: `dog-log-dev` (for PR preview channels)
- -[x] staging: `dog-log-staging` (for merges to `main`)

  -[x] Steps (do once):

1. In the Firebase Console → Add project → name `dog-log-dev` → continue with defaults → Create.
2. Repeat for `dog-log-staging`.
3. Inside each project: Build → Hosting → Get started → select “Set up Firebase Hosting for your web app” and follow
   prompts. This just enables Hosting; you don’t need to run their GitHub integration wizard because we’ll use GitHub
   Actions.

Notes

- Spark plan fully supports Firebase Hosting and Preview Channels.
- You can use a single “site” per project. If you later need multiple sites (e.g., admin vs app) you can add sites in
  Hosting settings and target them via `firebase.json`.

---

### Step 2 — Minimal `firebase.json` and `.firebaserc`

You’ll need these two files in your repo to deploy from CI and locally.

- [x] Example `firebase.json` (SPA-friendly):

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

- [x] Example `.firebaserc` mapping local aliases to projects:

```json
{
  "projects": {
    "dev": "dog-log-dev",
    "staging": "dog-log-staging"
  }
}
```

- Local usage examples:
  - `firebase use dev && firebase deploy` (deploy to dev project)
  - `firebase use staging && firebase deploy` (deploy to staging project)

---

### Step 3 — Create a deploy-only service account

We’ll authenticate GitHub Actions using a least-privilege service account per project.

Do this once per project (dev and staging):

1. Open Google Cloud Console for the project → IAM & Admin → Service Accounts → Create service account.

- Name: `github-actions-deployer`

2. Grant roles:

- `Firebase Hosting Admin` (deploy rights)
- `Viewer` (project read)
- Optional for CI with `firebase-tools`: `Service Account Token Creator` (some workflows need it for auth)

3. After creation: Keys → Add key → Create new key → JSON. Download the JSON key.
4. In GitHub → Repo Settings → Secrets and variables → Actions → New repository secret:

- `FIREBASE_SERVICE_ACCOUNT_DEV` → paste full JSON from dev project
- `FIREBASE_SERVICE_ACCOUNT_STAGING` → paste full JSON from staging project

Security notes

- The JSON files are sensitive. Store only in GitHub Secrets; do not commit them.
- Rotate keys if leaked. Consider enabling Organization-level OIDC in the future to avoid static keys, but JSON keys are
  simplest to start.

---

### Step 4 — Manage environment variables and secrets per environment

Because this is a client-only SPA, anything prefixed `VITE_` that’s used at build-time will be baked into the bundle and
is not secret at runtime. That includes Firebase web config keys, analytics IDs, etc.

Recommended approach:

- Define per-environment GitHub Actions Variables for non-sensitive build-time values and Secrets only when needed.
- Name them with environment prefix to keep things obvious, e.g.:
  - Variables (Repo → Settings → Actions → Variables):
    - `DEV_VITE_APP_TITLE`, `DEV_VITE_DEFAULT_LOCALE`, `DEV_VITE_ADD_PET_ENABLED`, …
    - `STG_VITE_APP_TITLE`, `STG_VITE_DEFAULT_LOCALE`, …
  - Secrets (only if any true secret exists, e.g., API tokens for CI-time tools):
    - `DEV_SOME_SECRET`, `STG_SOME_SECRET`

In each workflow below, we’ll synthesize a `.env` file before `npm run build` from those values. Example shell snippet
inside a job step:

```bash
{
  echo "VITE_APP_TITLE=${{ vars.DEV_VITE_APP_TITLE }}";
  echo "VITE_DEFAULT_LOCALE=${{ vars.DEV_VITE_DEFAULT_LOCALE }}";
  echo "VITE_ADD_PET_ENABLED=${{ vars.DEV_VITE_ADD_PET_ENABLED }}";
  echo "VITE_FIREBASE_API_KEY=${{ vars.DEV_VITE_FIREBASE_API_KEY }}";
  echo "VITE_FIREBASE_AUTH_DOMAIN=${{ vars.DEV_VITE_FIREBASE_AUTH_DOMAIN }}";
  echo "VITE_FIREBASE_PROJECT_ID=${{ vars.DEV_VITE_FIREBASE_PROJECT_ID }}";
  echo "VITE_FIREBASE_STORAGE_BUCKET=${{ vars.DEV_VITE_FIREBASE_STORAGE_BUCKET }}";
  echo "VITE_FIREBASE_MESSAGING_SENDER_ID=${{ vars.DEV_VITE_FIREBASE_MESSAGING_SENDER_ID }}";
  echo "VITE_FIREBASE_APP_ID=${{ vars.DEV_VITE_FIREBASE_APP_ID }}";
  echo "VITE_FIREBASE_MEASUREMENT_ID=${{ vars.DEV_VITE_FIREBASE_MEASUREMENT_ID }}";
} > .env
```

- Keep your local `.env.local` for local dev; CI won’t read it.

---

### Step 5 — Add branch protection and required status checks

Once the CI workflow exists, protect `main`:

- Require a pull request before merging
- Block direct pushes to `main`
- Require status checks to pass: `lint`, `test`, `build` (and optionally `typecheck` if you add a separate script)
- Require conversation resolution (optional)

---

### Step 6 — GitHub Actions: PR validation (CI) with coverage gate

Create `.github/workflows/ci-pr.yml`:

```yaml
name: CI (PR)

on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install deps
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test (coverage gate)
        run: npm run test:coverage

      - name: Build (type-check + bundle)
        run: npm run build

      - name: Upload coverage report (HTML)
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-html
          path: coverage
```

Notes

- Your `vitest.config.ts` already enforces 90% and will fail the job if below threshold.
- `npm run build` serves as both type-check and bundler validation per your scripts.

Optional: If you want to also produce PR Previews from this workflow, keep reading the next step; you can either add
deploy to this same workflow (after build) or use a dedicated workflow.

---

### Step 7 — PR Preview deploys to Firebase Hosting (dev project)

Use the official Firebase Hosting action to create a short-lived Preview Channel for each PR in the `dog-log-dev`
project.

Create `.github/workflows/deploy-preview.yml`:

```yaml
name: Deploy Preview (PR)

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write # to post/refresh PR comment with preview URL

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      # Build with dev environment values
      - name: Create .env for DEV build
        run: |
          {
            echo "VITE_APP_TITLE=${{ vars.DEV_VITE_APP_TITLE }}";
            echo "VITE_DEFAULT_LOCALE=${{ vars.DEV_VITE_DEFAULT_LOCALE }}";
            echo "VITE_ADD_PET_ENABLED=${{ vars.DEV_VITE_ADD_PET_ENABLED }}";
            echo "VITE_FIREBASE_API_KEY=${{ vars.DEV_VITE_FIREBASE_API_KEY }}";
            echo "VITE_FIREBASE_AUTH_DOMAIN=${{ vars.DEV_VITE_FIREBASE_AUTH_DOMAIN }}";
            echo "VITE_FIREBASE_PROJECT_ID=${{ vars.DEV_VITE_FIREBASE_PROJECT_ID }}";
            echo "VITE_FIREBASE_STORAGE_BUCKET=${{ vars.DEV_VITE_FIREBASE_STORAGE_BUCKET }}";
            echo "VITE_FIREBASE_MESSAGING_SENDER_ID=${{ vars.DEV_VITE_FIREBASE_MESSAGING_SENDER_ID }}";
            echo "VITE_FIREBASE_APP_ID=${{ vars.DEV_VITE_FIREBASE_APP_ID }}";
            echo "VITE_FIREBASE_MEASUREMENT_ID=${{ vars.DEV_VITE_FIREBASE_MEASUREMENT_ID }}";
          } > .env
      - run: npm run build
      # Deploy the built artifacts to a PR-specific preview channel
      - name: Deploy to Firebase Hosting Preview Channel
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_DEV }}
          projectId: dog-log-dev
          channelId: pr-${{ github.event.pull_request.number }}
          expires: 7d
          entryPoint: .
```

What you’ll get

- The action comments on the PR with the preview URL and keeps it updated on new commits. Channel auto-expires after 7
  days.

---

### Step 8 — Staging deploy on merges to main

This builds with staging env values and deploys to the `dog-log-staging` project. You can deploy to the live site or to
a permanent channel (e.g., `staging`). On Spark, both are fine. I recommend deploying to the live site of the staging
project so the URL is stable.

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy Staging (main)

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      # Build with staging environment values
      - name: Create .env for STAGING build
        run: |
          {
            echo "VITE_APP_TITLE=${{ vars.STG_VITE_APP_TITLE }}";
            echo "VITE_DEFAULT_LOCALE=${{ vars.STG_VITE_DEFAULT_LOCALE }}";
            echo "VITE_ADD_PET_ENABLED=${{ vars.STG_VITE_ADD_PET_ENABLED }}";
            echo "VITE_FIREBASE_API_KEY=${{ vars.STG_VITE_FIREBASE_API_KEY }}";
            echo "VITE_FIREBASE_AUTH_DOMAIN=${{ vars.STG_VITE_FIREBASE_AUTH_DOMAIN }}";
            echo "VITE_FIREBASE_PROJECT_ID=${{ vars.STG_VITE_FIREBASE_PROJECT_ID }}";
            echo "VITE_FIREBASE_STORAGE_BUCKET=${{ vars.STG_VITE_FIREBASE_STORAGE_BUCKET }}";
            echo "VITE_FIREBASE_MESSAGING_SENDER_ID=${{ vars.STG_VITE_FIREBASE_MESSAGING_SENDER_ID }}";
            echo "VITE_FIREBASE_APP_ID=${{ vars.STG_VITE_FIREBASE_APP_ID }}";
            echo "VITE_FIREBASE_MEASUREMENT_ID=${{ vars.STG_VITE_FIREBASE_MEASUREMENT_ID }}";
          } > .env
      - run: npm run build
      - name: Deploy to Firebase Hosting (staging live site)
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}
          projectId: dog-log-staging
          channelId: live
          entryPoint: .
```

Notes

- If you’d rather keep a permanent “staging” preview channel instead of live, set `channelId: staging`. URL will look
  like `https://staging--<site>.web.app`.
- You can add a manual approval gate later by converting this to a `workflow_dispatch` job or adding an `environment`
  with required reviewers.

---

### Step 9 — Keep manual deploys for local workflows

Nothing here blocks you from deploying locally. After you add `firebase.json` and `.firebaserc`:

- `npm run build` then `firebase use dev && firebase deploy` (you’ll be prompted to login the first time)
- Same for `staging`.

---

### Step 10 — Incremental improvements you can add later

- Speed
  - Cache `~/.firebase` plus `node_modules` with `actions/cache` (setup-node’s built-in NPM cache is already on).
  - Use `pnpm` for faster installs if desired.
- CI quality gates
  - Add `npm run lint:fix` in a separate non-blocking job that uploads a diff as an artifact.
  - Upload test results as JUnit (Vitest supports `--reporter=junit`) and show in PR checks UI.
- Previews
  - Post Lighthouse scores as a PR comment against the preview URL.
  - Run basic a11y checks (axe) in CI.
- Security
  - Migrate from JSON key to Workload Identity Federation (OIDC) for keyless auth between GitHub and Google Cloud.
- Releases
  - When you’re ready for production, add a third project `dog-log-prod` and a `deploy-prod.yml` with
    `environment: production` and required reviewers.

---

### Why Firebase Hosting (not App Hosting) fits your constraints

- Static SPA on Spark, no SSR or server functions → Hosting is the simplest, cheapest, and most mature fit.
- GitHub builds are under your control (fast and customizable), while Hosting handles global CDN + preview channels.
- App Hosting’s managed builds and SSR integrations shine for Next.js/Remix with server components, but it often nudges
  you toward Blaze for custom domains and backend features and adds complexity you don’t need yet.

---

### Quick checklist to get this live

- [x] Create `dog-log-dev` and `dog-log-staging` projects; enable Hosting.
- [x] Add `firebase.json` and `.firebaserc` as shown.
- [x] Create `github-actions-deployer` service account in each project; upload their JSON keys to repo secrets.
- [x] Add GitHub Actions repo variables for DEV*\*/STG*\* `VITE_...` values.
- [x] Commit the three workflows: `ci-pr.yml`, `deploy-preview.yml`, `deploy-staging.yml`.

6. Add branch protection on `main` requiring CI checks.
7. Open a PR → see CI and Preview URL. Merge to main → staging site updates automatically.

If you’d like, I can tailor the three YAML files to your exact scripts and list initial env variable names to set based
on your current `.env` files—just paste their keys (no values) and I’ll wire them in.
