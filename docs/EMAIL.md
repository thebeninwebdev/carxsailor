# CarXSailor transactional email

## Setup now

The application uses Resend 6.26.0, Better Auth 1.7.1, and Next.js 16.3.2. There was no existing email provider, reset UI, or verification UI. Plain HTML and text templates reuse the site's forest green/lime identity without adding React Email.

Add these values to your private local environment and the corresponding Vercel environment settings:

```dotenv
RESEND_API_KEY=your_private_resend_key
EMAIL_FROM="CarXSailor <onboarding@resend.dev>"
RESEND_TEST_EMAIL=your_resend_account_email
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
```

The application reuses NEXT_PUBLIC_APP_URL for ordinary email links and BETTER_AUTH_URL for Better Auth's generated links; no additional APP_URL is needed. Keep both set to the actual application origin, including your deployed preview URL. Neither should include a path, query, or fragment. Only the URL is public; RESEND_API_KEY must never have a NEXT_PUBLIC prefix.

Resend's onboarding sender restricts recipients to the email allowed by your Resend account. RESEND_TEST_EMAIL must be that address. A syntactically valid address alone does not grant permission to send from Resend's development domain. See [Resend's API errors](https://resend.com/docs/api-reference/errors).

## Recipient and sender behavior

| Environment | Actual recipient | Test labels |
| --- | --- | --- |
| Local development / tests | RESEND_TEST_EMAIL | Yes |
| Vercel preview / development, even with NODE_ENV=production | RESEND_TEST_EMAIL | Yes |
| Any deployment still using an @resend.dev sender | RESEND_TEST_EMAIL | Yes |
| Production using your verified sender | Intended user | No |

EMAIL_FROM defaults to CarXSailor <onboarding@resend.dev>. Both display-name address formats with and without angle brackets are accepted and normalized. Missing/invalid RESEND_TEST_EMAIL fails closed in test mode; no attempt is made to send to an arbitrary user.

Test messages have a [TEST] subject, a development banner, and the intended address in both HTML and text. Server logs include template, intended/actual recipient, and Resend ID. Production app logs omit recipient information and test labels. The returned Resend ID means provider acceptance, not verified inbox delivery.

## Architecture and triggers

All email modules are marked server-only. One lazy client lives in lib/email/resend.ts. sendTransactionalEmail is the only application call site for resend.emails.send. It resolves configuration, redirects test recipients, validates addresses, labels messages, adds a per-send idempotency key, and returns a typed success/error result. The sender is always read from configuration.

Templates share one email-safe layout in lib/email/templates.ts, with HTML escaping, plain text, CTA fallback URLs, footer, and security notices. appUrl only accepts paths on the configured application origin. Better Auth-generated secure URLs are preserved, not rebuilt.

| Template | Trigger | CTA |
| --- | --- | --- |
| welcome | Successful email/password signup with a newly created session | /cars |
| verification | After successful signup; explicit resend on /verify-email | Better Auth verification URL |
| password-reset | /forgot-password through Better Auth requestPasswordReset | Better Auth reset callback URL |
| car-submitted | Successful createListing or draft submitListing, after invalidation | /vendor/cars/{id} |
| car-approved | Authorized APPROVE_LISTING transaction including audit commits, after invalidation | /cars/{slug} |
| car-rejected | Authorized REJECT_LISTING transaction including audit commits, after invalidation | /vendor/cars/{id} |
| car-resubmitted | Editing a listing that was not already pending review | /vendor/cars/{id} |
| inquiry | Existing inquiry creation succeeds, after invalidation | /vendor/inquiries |

Listing recipients are resolved through Vehicle.vendorId -> VendorProfile.userId -> Better Auth's user collection. Both ObjectId and string IDs are supported. Approval makes the vehicle ACTIVE and sets publishedAt, so approval emails say it is active. The listing model has no rejection-reason field: real rejection emails omit a reason, while the reusable template supports one if the workflow later supplies it. Saving edits resubmits the listing. Edits while already pending do not generate repeated resubmission emails.

The existing contact page opens a mailto link; it has no server-side submission or configured support inbox. It was left unchanged. The existing database-backed seller inquiry system uses the centralized service.

## Better Auth and security failures

The shared configuration is lib/email/auth-options.ts. Better Auth generates, stores/signs, expires, and validates its own tokens. Verification and reset links expire after 60 minutes. Better Auth's built-in storeIdentifier: hashed option keeps reset-token identifiers hashed in the database; email verification uses Better Auth's signed token. Successful password resets revoke existing sessions.

Existing login behavior is preserved: verification is optional for sign-in. Welcome and the automatic verification attempt are scheduled only after signup succeeds, so a failed email cannot leave a successfully registered user without a session. Unverified users can resend at /verify-email (linked from My Garage). That explicit request awaits delivery and reports a 503 error if Resend cannot accept the message.

Better Auth 1.7.1's default runInBackgroundOrAwait catches password-reset dispatch errors even when awaited. A narrowly scoped before hook overrides the runner only for /request-password-reset, using the request-context override mechanism. This makes required reset email failures return a safe 503 instead of false success. There is no global runner change or custom token system. Integration tests exercise this behavior against the installed Better Auth version; retain them when upgrading.

The reset form uses Better Auth's client requestPasswordReset and resetPassword methods. Invalid or expired links offer a new request. Unknown emails retain Better Auth's generic response. Both request redirect validation and token reuse rejection are tested. No application logs include secure URLs, reset tokens, or API keys.

## Failure isolation and deployment

Notification tasks use Next.js after, scheduled only after commits and cache invalidation. Scheduling failures, lookup failures, and dispatch exceptions are contained and logged; notification failure never rolls back a listing or changes a successful mutation result. Security requests await provider acceptance.

Resend returns errors in its response as well as potentially throwing; both paths are handled. Provider error bodies are not returned to the browser. Application logs record safe template/error context instead of raw response data. Resend's SDK may also produce its own development error diagnostics.

Next.js after is supported by Vercel request lifetime handling. No custom public sending endpoint, cron job, or queue is installed. Notifications are best-effort post-response tasks, not a durable outbox: process termination or provider failure can lose a notification. Inspect server/Resend logs when testing. See the installed Next.js after guide and [Resend's send API](https://resend.com/docs/api-reference/emails/send-email).

## Test templates locally

```powershell
npm.cmd run email:test -- all
npm.cmd run email:test -- welcome --send
npm.cmd run email:test -- verification --send
npm.cmd run email:test -- password-reset --send
npm.cmd run email:test -- car-submitted --send
npm.cmd run email:test -- car-approved --send
npm.cmd run email:test -- car-rejected --send
npm.cmd run email:test -- car-resubmitted --send
npm.cmd run email:test -- inquiry --send
npm.cmd run email:test -- all --send
```

Without --send, the script only writes ignored local .email-previews/*.html files. With --send, it uses the same centralized service and RESEND_TEST_EMAIL override. It refuses production execution and fails before sending when required settings are missing. It sends sequentially.

Sample verification/reset links deliberately use invalid preview tokens and cannot verify or reset an account. To test real links, register a development account, request a verification resend or password reset, then open the generated message in the configured test inbox. Verify the displayed name/intended recipient before using an auth link: a test inbox may receive links for multiple development accounts.

Run npm.cmd test for isolated integration tests using Better Auth's memory adapter and mocked Resend. They do not change MongoDB or send real emails. Tests cover working verification/reset tokens, single-use resets, signup failure isolation, explicit security dispatch errors, test/production routing, missing configuration, sender migration, template escaping, and post-commit notification order/failures.

## Moving to your purchased domain

1. Add your purchased domain to Resend, add its supplied DNS records, and wait for verification.
2. Set EMAIL_FROM="CarXSailor <noreply@carxsailor.com>" in the production environment.
3. Set the existing NEXT_PUBLIC_APP_URL and BETTER_AUTH_URL to your actual deployed application URL if that URL is also changing.
4. Redeploy.

No template, mutation, auth, or Resend client code changes are required. A production deployment with the verified sender automatically uses real recipients. Preview/local environments remain safely redirected to RESEND_TEST_EMAIL.


## Files in this implementation

Created:
- lib/email/config.ts, resend.ts, send-email.ts, templates.ts, schedule.ts, auth-emails.ts, auth-options.ts, notifications.ts
- lib/email/email.test.ts, resend.test.ts, schedule.test.ts, notifications.test.ts, auth-integration.test.ts
- components/auth/email-forms.tsx
- app/forgot-password/page.tsx, app/reset-password/page.tsx, app/verify-email/page.tsx
- scripts/test-email.ts and docs/EMAIL.md

Modified:
- lib/auth.ts: shared email/auth options and automatic signup verification callback
- lib/mutations.ts and lib/buyer-mutations.ts: post-commit listing/inquiry triggers
- lib/mutations.test.ts and lib/listing-images.test.ts: ordering and failure-isolation regressions
- components/auth/auth-form.tsx: password recovery link
- app/dashboard/page.tsx: verification resend link
- package.json and package-lock.json: official Resend package and local testing command
- .env.example and .gitignore: documented configuration and ignored local previews

Other pre-existing workspace edits are unrelated to this email implementation.

## Validation results

- Standalone typecheck: passed.
- ESLint: passed.
- Production build: passed, including all three new account pages.
- Vitest: 87 tests passed across 13 files.
- Local preview script: all eight templates generated successfully.
- Live welcome send: failed safely before contacting Resend because RESEND_TEST_EMAIL is missing. Actual inbox delivery is not verified; configure the private API key and permitted test recipient, then run the send commands above.
- Source inspection found one Resend client and one send call, confined to server-only modules. An additional browser-bundle scan was declined and was not run.
