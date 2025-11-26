# GitHub Actions — CI/CD Overview

This repo uses two workflows for pull requests and one for the main branch:

- CI (PR): .github/workflows/ci-pr.yml
  - Triggers: pull_request → main
  - Steps: pnpm install → synthesize .env (DEV vars) → lint → test:coverage (90% gate) → build → upload coverage HTML artifact

- Deploy Preview (PR): .github/workflows/deploy-preview.yml
  - Trigger: workflow_run of "CI (PR)" with conclusion == success
  - Behavior: checks out the exact commit CI validated, builds with DEV env, deploys to a stable Firebase Hosting preview site (live channel), and prints the URL.
  - Only runs for same‑repo PRs (forked PRs are skipped; secrets are unavailable on forks).

- Deploy Staging (main): .github/workflows/deploy-staging.yml
  - Triggers: push → main
  - Behavior: builds with STAGING env and deploys to Firebase Hosting staging project.

## Why preview now waits for tests

Previously, the preview deploy was triggered directly on pull_request and could start before tests completed. It now depends on CI via `on: workflow_run` and only runs when CI succeeds. This makes tests a proper quality gate for preview deployments.

## Merge button behavior

The GitHub “Merge” button can appear enabled while checks are in progress unless branch protection rules require specific checks to pass. To ensure the button is disabled until CI passes, enable branch protection on `main` and require these checks:

- CI (PR) / ci — the job name from ci-pr.yml
- Optionally granular checks if you split jobs (lint, test, build)

Recommended settings:

- Require a pull request before merging
- Require status checks to pass
- (Optional) Require conversation resolution
- (Optional) Require linear history

Note: After enabling required checks, the button will be disabled (“Merging is blocked”) until all required statuses are green.

## Repository Variables and Secrets

Because Vite embeds `VITE_*` values at build time, workflows synthesize a temporary `.env` file from repo‑level variables:

Variables (Repository → Settings → Variables → Actions):

- DEV_VITE_APP_TITLE, DEV_VITE_DEFAULT_LOCALE
- DEV*VITE_FLAG*\* (feature flags)
- DEV*VITE_FIREBASE*\* (web config)
- DEV_FIREBASE_PROJECT_ID (Firebase project ID used by actions)
- DEV_FIREBASE_PREVIEW_SITE (Hosting site ID for the stable preview)
- STG*VITE*\* (staging web config)

Secrets (Repository → Settings → Secrets → Actions):

- FIREBASE_SERVICE_ACCOUNT_DEV — JSON key for dev project
- FIREBASE_SERVICE_ACCOUNT_STAGING — JSON key for staging project

Minimum IAM roles: Firebase Hosting Admin + Viewer.

## Forked PRs

Deploy Preview is skipped for forked PRs by design since secrets are not available to forks. CI still runs using repository variables (safe) and no secrets.

## Troubleshooting

- Preview didn’t run: Check the CI (PR) workflow completed with success; Deploy Preview only runs on success.
- Merge button still enabled: Confirm branch protection rules are set to require CI checks.
- Missing preview URL: Ensure DEV_FIREBASE_PREVIEW_SITE and DEV_FIREBASE_PROJECT_ID variables are set.
