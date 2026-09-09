# CarXSailor transactional email

## Configuration

CarXSailor uses one server-only Resend client and sends directly to each intended recipient. Configure either a combined sender or the split Swiftdu variables already used by this project:

```dotenv
RESEND_API_KEY=your_private_resend_key
EMAIL_FROM_NAME=CarXSailor
EMAIL_FROM_ADDRESS=noreply@your-verified-domain.com
# Alternative: EMAIL_FROM="CarXSailor <noreply@your-verified-domain.com>"
ADMIN_NOTIFICATION_EMAIL=admin@your-domain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
```

`EMAIL_FROM` takes precedence when both formats exist. `ADMIN_NOTIFICATION_EMAIL` is optional when `EMAIL_FROM_ADDRESS` is set; the sender address becomes the admin inquiry inbox fallback. Keep the API key server-only and never give it a `NEXT_PUBLIC_` prefix.

A verified Resend domain is required to deliver to arbitrary real recipients. The default `onboarding@resend.dev` sender remains only as a configuration fallback and is subject to Resend's recipient restrictions.

## Authentication delivery

Verification is required before Better Auth creates a usable CarXSailor session. Signup and unverified login attempts send a Better Auth-generated verification link directly to the account email. Password-reset links also go directly to the account email. Tokens, expiry, validation, and single-use behavior remain owned by Better Auth.

## Other notifications

Listing submission, approval, rejection, resubmission, seller inquiry, and admin inquiry messages all use `sendTransactionalEmail`. Notification failures are logged after the successful database mutation and do not roll back the saved listing or inquiry. Security-email failures return a safe error without exposing provider details.

## Preview templates

```powershell
npm.cmd run email:test -- all
```

This writes ignored HTML previews to `.email-previews`. To send previews to the configured admin inbox:

```powershell
npm.cmd run email:test -- verification --send
```

The send mode requires `ADMIN_NOTIFICATION_EMAIL` or `EMAIL_FROM_ADDRESS` and uses the same live email path as the application.

## Domain migration

After changing domains, verify the new domain in Resend and update `EMAIL_FROM_ADDRESS` or `EMAIL_FROM`. Templates and authentication code do not need changes.