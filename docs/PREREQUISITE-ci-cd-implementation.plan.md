### What I reviewed

I scanned the key areas of your repo that affect security when deploying a Vite + React SPA to Firebase Hosting:

- Firebase client init: `src/firebase.ts`
- Auth service and usage: `src/services/auth/authService.ts`, `src/store/auth.store.ts` (by reference)
- Data access layer: `src/repositories/**` (with focus on `BaseRepository.ts`, `petRepository.ts`, `userRepository.ts`)
- App shell and build/deploy context: `index.html`, `package.json`, your Hosting/CI plan in
  `docs/ci-cd-implementation.plan.md`

Below are concrete findings and a prioritized hardening checklist with code/rules you can drop in.

---

### Key findings (risk-focused)

1. Firestore Security Rules not present in repo

- I didn’t find `firestore.rules`. Your repositories write to `users/{uid}/pets` and `users` collections, but without
  rules your data would default to either overly permissive or locked (depending on the console state). You need strict
  rules enforcing user isolation and basic validation.
- Impact: High (access control/data integrity).

2. Storage Rules likely missing

- Your Firebase config includes `storageBucket`, but I don’t see Storage usage yet. Still, you should ship a
  deny-by-default `storage.rules` until you actually use Storage.
- Impact: Medium.

3. App Check not configured

- For public SPAs, enabling Firebase App Check helps reduce abuse of Firestore/Storage by requiring attestation (
  reCAPTCHA for web) before calls. It’s not a silver bullet (rules still matter), but it’s a useful layer.
- Impact: Medium.

4. Secrets in PR Preview workflow (fork safety)

- Your plan deploys PR previews with `FirebaseExtended/action-hosting-deploy@v0` and service account JSON secrets. On
  GitHub, secrets are NOT available to PRs from forks. If you leave the trigger as `pull_request` without guarding,
  contributors will see failing preview jobs—or worse, if misconfigured (e.g., `pull_request_target`), it risks secret
  exposure.
- Action: Keep `pull_request` but add a guard to only run deploy on same-repo PRs.
- Impact: Medium (secrets hygiene, contributor UX).

5. Public build-time env vars (expected) but confirm no true secrets in `VITE_*`

- You correctly use `VITE_*` env vars. Reminder: anything in `VITE_*` becomes public after build. Ensure you never place
  true secrets there. Firebase Web config keys are fine to expose.
- Impact: Low if followed.

6. Minor config mismatch: `VITE_FIREBASE_MESSAGING_SENDER` vs `VITE_FIREBASE_MESSAGING_SENDER_ID`

- In `src/firebase.ts`, you read `import.meta.env.VITE_FIREBASE_MESSAGING_SENDER` but your CI plan uses
  `VITE_FIREBASE_MESSAGING_SENDER_ID`. This will be `undefined` in production builds unless you align names.
- Impact: Low (functional bug, could break FCM if/when used).

7. Error handling may leak internal error messages if surfaced directly

- `BaseRepository.handleError` returns a `ServiceError` that includes `error.message` in `details`. If your UI renders
  `details` verbatim, you could leak implementation detail. If the UI only shows generic `message`, you’re fine.
- Impact: Low, verify UI behavior.

8. Missing HTTP security headers and CSP

- `firebase.json` example in your plan sets cache headers but not security headers. Adding a basic set (CSP,
  Referrer-Policy, Permissions-Policy, X-Content-Type-Options, X-Frame-Options) hardens the app against clickjacking and
  reduces XSS risk.
- Note: Emotion (MUI) injects styles. A strict CSP without `'unsafe-inline'` for style requires a nonce setup.
  Otherwise, you may need to allow `'unsafe-inline'` styles.
- Impact: Low to Medium (defense-in-depth).

9. Auth persistence is `browserLocalPersistence`

- That’s standard for SPAs, but it increases the value of a successful XSS (tokens in local storage could be stolen).
  This reinforces the need for CSP and avoiding any `dangerouslySetInnerHTML` (none found).
- Impact: Low if you add CSP and keep XSS surface minimal.

10. Dependency supply-chain basics

- You use `npm ci` (good) and have a lockfile. Versions in `package.json` use carets, which is fine with lockfile, but
  consider Dependabot/Renovate and periodic audits. Keep `react`, `vite`, `firebase` patched.
- Impact: Ongoing hygiene.

---

### Highest-priority actions (do these before exposing real data)

1. Add and deploy Firestore Security Rules
   Use per-user scoping consistent with your data model. Example baseline:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection: allow users to read/write their own doc only
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }

    // Pets subcollection under each user
    match /users/{userId}/pets/{petId} {
      function isOwner() {
        return request.auth != null && request.auth.uid == userId;
      }

      // Basic field validation helpers
      function isString(v) { return v is string && v.size() > 0 && v.size() <= 200; }
      function isBoolean(v) { return v is bool; }

      allow read: if isOwner();

      allow create: if isOwner() &&
        isString(request.resource.data.name) &&
        isString(request.resource.data.breed) &&
        isBoolean(request.resource.data.isArchived) &&
        // Ensure server-side fields not spoofed inconsistently
        request.resource.data.createdBy == userId;

      allow update: if isOwner() &&
        // Prevent ownership changes
        (!('createdBy' in request.resource.data) || request.resource.data.createdBy == userId);

      allow delete: if isOwner();
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- Add indexes as needed (the rules don’t create indexes; Firestore prompts you if queries require them).
- Keep validation minimal but present; expand as your model grows.

2. Add deny-by-default Storage Rules (until you use Storage)

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false; // tighten later when you add uploads
    }
  }
}
```

3. Enable Firebase App Check for Firestore (and Storage if used)

- In Firebase Console, enable App Check with reCAPTCHA v3 (or Enterprise) for Web.
- Add App Check provider to your web app and initialize before Firestore calls.
- Start in “monitor” mode to observe impact, then enforce.

4. Guard PR Preview deploys against forks (secret safety)
   Add a condition so deploy only runs for same-repo PRs:

```yaml
# In .github/workflows/deploy-preview.yml job or step
if: github.event.pull_request.head.repo.full_name == github.repository
```

- Optionally, add a non-deploy path for forks (e.g., post a comment explaining previews only run for internal PRs).

5. Add security headers via Firebase Hosting
   Augment your `firebase.json` to include standard headers. Start pragmatic; tighten CSP later if you wish to add
   nonces.

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
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "geolocation=(), microphone=(), camera=()"
          }
        ]
      },
      {
        "source": "/index.html",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://www.googleapis.com; frame-ancestors 'none'; base-uri 'self';"
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

- Note on CSP: `'unsafe-inline'` in `style-src` accommodates Emotion/MUI style tags. If you decide to go stricter, wire
  a CSP nonce through Emotion’s cache setup and remove `'unsafe-inline'`.

6. Align the Messaging Sender env var name

- In `src/firebase.ts` change `VITE_FIREBASE_MESSAGING_SENDER` to `VITE_FIREBASE_MESSAGING_SENDER_ID` (or vice versa)and
  make CI variables match.

---

### Additional best practices (near-term)

- Limit console output in production
  - Replace `console.info/console.debug` with a no-op logger in production builds or keep them minimal; never log
    tokens/PII.

- Verify UI doesn’t render raw error details
  - Show user-friendly messages; log detail to console only (and scrub sensitive info).

- Dependency hygiene
  - Enable Dependabot or Renovate for `npm` and GitHub Actions.
  - Run `npm audit` periodically; avoid auto-fixing major bumps blindly.

- Branch protection and reviewers for staging/prod deploys
  - You plan to add manual gates later; when you add production, use GitHub Environments with required reviewers.

- OAuth and auth console hygiene
  - Restrict authorized domains in Firebase Authentication to your Hosting domains.
  - Review sign-in providers and disable unused ones.

- Rate-limiting patterns (client-friendly)
  - Firestore enforces quotas, but for UI actions like “Add Pet,” debounce UI-triggered writes. Consider server-side
    backstops later if abuse appears.

- Monitoring and abuse signals
  - Add simple analytics or logging to detect spikes in failed requests (no PII). Firebase Console usage charts can
    help.

---

### Quick verification checklist (copy into your tracking issue)

- [x] `firestore.rules` added, committed, and deployed; manual tests confirm user A cannot read/write user B’s docs.
- [x] `storage.rules` deny-by-default committed and deployed.
- [ ] App Check enabled in monitor mode, then enforced after observation period.
- [ ] `deploy-preview.yml` guarded against forks; internal PRs get preview URL, external PRs skip deploy.
- [x] `firebase.json` updated with security headers and CSP; site renders correctly under CSP.
- [x] `VITE_FIREBASE_MESSAGING_SENDER(_ID)` naming aligned across code and CI variables.
- [ ] UI surfaces generic error messages only; no stack traces or Firestore error strings shown to end-users.
- [ ] Dependabot/Renovate enabled; `npm ci` used in CI; lockfile committed.
- [ ] Firebase Auth authorized domains restricted to your actual Hosting domains.

---

### Bottom line

Your codebase already follows solid patterns: Firestore is isolated behind repositories, no `dangerouslySetInnerHTML`,
and tests enforce good coverage. The main security work left is infrastructure configuration: Firestore and Storage
rules, App Check, and CI/Hosting hardening (CSP/headers and secret guards). Tackle the high-priority items above before
pointing real users at staging, and you’ll be in good shape.
