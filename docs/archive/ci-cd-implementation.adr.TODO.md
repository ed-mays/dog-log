#### Hosting and environments

- ADR: Choose Firebase Hosting over Firebase App Hosting
  - Decision: Use Firebase Hosting (static SPA, Spark plan) rather than App Hosting.
  - Rationale: No SSR/edge needs, keep costs at $0, simpler previews.
  - Revisit: If SSR, custom server APIs, or Blaze plan become requirements.

- ADR: Multi-project environment strategy (dev, staging; prod later)
  - Decision: Separate Firebase projects: `dog-log-dev`, `dog-log-staging` (and `dog-log-prod` later).
  - Rationale: Isolation of data/config, safer deploys.
  - Revisit: If consolidating environments or adding more (e.g., QA) is needed.

- ADR: Staging deployment target (live site vs. permanent preview channel)
  - Decision: Deploy merges to `main` to staging project’s live site.
  - Rationale: Stable URL, simple workflow.
  - Revisit: If you want a permanent channel like `staging` for blue/green style promotion.

- ADR: Preview deployments per PR (Preview Channels)
  - Decision: Create PR-scoped preview channels on `dog-log-dev`, auto-expire in 7 days.
  - Rationale: Fast feedback for reviewers; ephemeral infra.
  - Revisit: Expiration and retention windows as team usage grows.

- ADR: SPA routing and CDN caching strategy for Hosting
  - Decision: `rewrites: /** → /index.html`; long-term caching for `*.js|*.css`, `no-cache` for HTML.
  - Rationale: Proper SPA navigation + optimal browser caching.
  - Revisit: If you adopt revisioned HTML, additional assets, or want stricter cache headers.

#### CI/CD platform and workflow

- ADR: Build location and orchestration
  - Decision: Build in GitHub Actions; deploy with Firebase CLI/action; do not use Firebase’s GitHub integration wizard.
  - Rationale: Full control over CI pipeline; clear separation of concerns.
  - Revisit: If migrating to App Hosting or a different CI.

- ADR: CI job gates for pull requests
  - Decision: Required checks on PRs: `lint` → `test:coverage` (90% gate) → `build`.
  - Rationale: Keep `main` healthy and type-safe; enforce quality.
  - Revisit: Add `typecheck` as a separate step if you split it from `build`.

- ADR: Branch protection for `main`
  - Decision: Require PRs, block direct pushes, require CI checks, optionally require resolved conversations.
  - Rationale: Guardrail against accidental breakage.
  - Revisit: When adding release branches or multi-branch strategies.

- ADR: Deployment triggers
  - Decision: PR open/sync → Preview deploy to `dog-log-dev`; push to `main` → Staging deploy.
  - Rationale: Simple, predictable release cadence.
  - Revisit: When introducing production and/or release tagging.

- ADR: Manual deploy permissions retained
  - Decision: Keep local Firebase CLI deploys enabled for maintainers.
  - Rationale: Flexibility for emergencies and troubleshooting.
  - Revisit: If you move to fully-managed, CI-only deployments.

- ADR: Rollback strategy for Hosting
  - Decision: Use Firebase Hosting release history for quick rollbacks; no database migrations tied to deploys.
  - Rationale: Fast and safe reversions.
  - Revisit: If you add backend stateful changes or coordinated releases.

#### Authentication to Firebase from CI

- ADR: CI authentication method to Firebase
  - Decision: Service account JSON keys stored as GitHub repo secrets per project.
  - Rationale: Easiest to bootstrap; least friction now.
  - Revisit: Migrate to Workload Identity Federation (OIDC) for keyless auth when ready.

- ADR: Principle of least privilege for deployer
  - Decision: `Firebase Hosting Admin` + `Viewer` (+ optionally `Service Account Token Creator`).
  - Rationale: Limit blast radius of credentials.
  - Revisit: As roles, environments, or pipelines change.

#### Configuration and secrets management

- ADR: Environment variable strategy for builds
  - Decision: Build-time `VITE_*` values injected via GitHub Actions Variables/Secrets; CI generates `.env` per job.
  - Rationale: Keep repo clean; centralized per-environment values; predictable builds.
  - Revisit: If switching to environment-scoped secrets in GitHub Environments or using Firebase Config.

- ADR: What is and isn’t a secret in a SPA
  - Decision: Treat Firebase web config and other `VITE_*` values as public-at-runtime; only store true secrets as
    GitHub Secrets.
  - Rationale: Avoid a false sense of security; align with Vite’s bundling behavior.
  - Revisit: If you add server-side components or proxy services.

- ADR: Standard Node version and package manager in CI
  - Decision: Node 20 with `npm ci`; cache enabled via `setup-node`.
  - Rationale: Reproducible builds and predictability.
  - Revisit: When upgrading Node or switching to `pnpm`/`yarn`.

- ADR: Artifact retention policy for CI outputs
  - Decision: Upload HTML coverage as artifact on PRs; default retention.
  - Rationale: Easier debugging of coverage issues.
  - Revisit: Tweak retention duration and add JUnit reports if needed.

#### Testing and quality

- ADR: Minimum coverage thresholds (already have ADR 033)
  - Decision: Maintain 90% gate enforced by Vitest config and CI.
  - Rationale: Consistent quality bar.
  - Revisit: If thresholds impede velocity or as codebase size grows.

- ADR: Testing practices (already have ADR 032)
  - Decision: Use Testing Library with `user-event`, avoid snapshots, accessibility-first queries.
  - Rationale: Reliable, maintainable tests aligned with guidelines.
  - Revisit: As component complexity or a11y goals evolve.

- ADR: Scope of tests in CI now vs later
  - Decision: Unit/integration only for now; E2E (Playwright/Cypress) planned later.
  - Rationale: Keep pipeline fast initially.
  - Revisit: When E2E suites are introduced; decide on when/how they run (nightly vs. per-PR minimal set).

#### Repository structure and infra config

- ADR: Firebase config files and targets
  - Decision: Keep a single Hosting site per project for now; manage targets via `.firebaserc` aliases (`dev`,
    `staging`).
  - Rationale: Simplicity.
  - Revisit: If you introduce multiple sites (e.g., admin vs app) or multi-region hosting.

- ADR: CI file layout and naming conventions
  - Decision: Separate workflows: `ci-pr.yml`, `deploy-preview.yml`, `deploy-staging.yml`.
  - Rationale: Clear responsibilities and easier troubleshooting.
  - Revisit: If you consolidate jobs to reduce minutes or add a monorepo.

- ADR: Caching and performance in CI
  - Decision: Use `setup-node` NPM cache; consider caching `~/.firebase` later.
  - Rationale: Reasonable default speed without added complexity.
  - Revisit: If build times become a bottleneck.

#### Security and governance

- ADR: Branching and release model (current and future)
  - Decision: Trunk-based with `main`; deploy to staging on merge. Production to be added later with manual approval.
  - Rationale: Start simple.
  - Revisit: When adding `prod` and introducing `environment: production` with required reviewers.

- ADR: Access control for CI deploys
  - Decision: Limit who can rotate service account keys and who can trigger manual deploys.
  - Rationale: Prevent accidental or malicious changes.
  - Revisit: As the team grows; consider GitHub Environments with required reviewers for staging/prod.

- ADR: Observability for deploys (optional initial)
  - Decision: Start without notifications; rely on PR statuses and action logs.
  - Rationale: Minimize noise early.
  - Revisit: Add Slack/Discord notifications and Lighthouse/axe checks once cadence stabilizes.

#### Future-state placeholders (capture as “deferred decisions” ADRs)

- ADR: Production environment rollout plan
  - Decision: Defer; will add `dog-log-prod` and a gated `deploy-prod.yml` later.
  - Rationale: Not production-ready yet.
  - Revisit: Before first public release.

- ADR: Migration to OIDC (keyless auth)
  - Decision: Defer; JSON keys for now.
  - Rationale: Simpler bootstrap.
  - Revisit: Once you’re comfortable with Google Cloud IAM and want to reduce key risk.

- ADR: E2E testing strategy
  - Decision: Defer; choose Playwright/Cypress, decide which env to run against, and how to seed data.
  - Rationale: Lower priority now.
  - Revisit: When adding user-critical flows.

### Tips for maintaining ADRs in this repo

- Keep ADRs short: context, decision, consequences, alternatives, revisit criteria.
- Cross-link related ADRs (e.g., Hosting choice → CI auth method → Env var strategy).
- Note status: Proposed → Accepted → Superseded; close the loop when you change course.
- Reference implementation files: `firebase.json`, `.firebaserc`, workflow YAML paths, and `vitest.config.ts`.
- Add a “Decision log” index in `/decisions/adr/README.md` if you don’t already have one, to quickly find active
  decisions.
