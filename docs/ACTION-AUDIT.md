# CarXSailor action reliability audit

## Architecture inspected

- Next.js 16.3.2 App Router and React 19.2.8; no Pages Router.
- Better Auth 1.7.1, using the native MongoDB adapter for users, accounts, and sessions.
- Mongoose 9.9.3 for marketplace records; native MongoDB 7.5.0 for auth.
- proxy.ts forwards the protected pathname and query in a request header. Authorization is performed on the server.
- Existing mutation interfaces were client Better Auth calls, client JSON requests, and native POST forms. There were no existing Server Actions with swallowed redirect exceptions.
- Marketplace queries use Mongoose directly, without a tagged data cache. Server Action revalidation now refreshes affected rendered views and the submitting browser's router state. No global cache disabling was introduced.
- No new runtime dependencies, roles, state libraries, auth providers, or database engines were added.

## Root causes and repairs

1. Login always fell back to /dashboard, irrespective of admin role or seller profile. The client called replace and refresh separately without a server-confirmed destination. Login now awaits Better Auth, verifies the session cookie through a Server Action, resolves a safe role-aware destination, invalidates the authenticated layout, and redirects once.
2. Moderation always returned to a placeholder detail page. There was no approved/pending filtered destination. The car update did not check existence, allowed transitions, or matched/modified counts. The detail page did not fetch the car. It now renders the actual record and permitted actions, and approval redirects to /admin/cars?status=ACTIVE.
3. No marketplace mutation invalidated dependent pages. Central invalidation now covers the relevant lists, detail pages, dashboards, and public inventory. Buyer mutations refresh their garage section.
4. Edit-listing and vendor-profile forms had no mutation handlers. Both now validate, authorize ownership, await writes, invalidate affected views, and display confirmation. Listing edits return to review before becoming public.
5. Seller applications wrote state/city at the wrong schema level, so Mongoose discarded them. These values now populate location.state and location.city. Repeated applications do not overwrite approved profile data.
6. Public seller and buyer/seller inquiry pages contained placeholder content. They now query real authorized records.
7. Favorites changed only the local heart state; saved-list cards and counts could remain stale. Favorite actions now confirm their desired state server-side and invalidate garage views. Pending saves resume after login, with visible failure feedback.
8. Inquiry fetch failures could leave the form stuck in Sending. Errors now restore the form and show a message. Server authorization and active-vehicle checks remain mandatory.
9. Decision saves could fail because optional browser storage failed, and did not invalidate garage data. Account persistence is now independent of browser storage, with duplicate-submit guards and invalidation.
10. React resets uncontrolled forms after completed actions, including recoverable error results. Forms now retain their entered values on reset, allowing correction and retry.
11. Comparison initialized independent state from URL props, allowing navigation and selection to diverge. It now derives selections from the current query string.
12. Newly created cars can omit optional condition data. Serialization supplies empty condition/features/images values so public detail and comparison views do not crash. The featured carousel also clamps its selected index when inventory shrinks.
13. The contact form ignored entered text. Its existing email-app workflow now includes the message and reply address and does not claim the email was sent.

## Mutation coverage

| Flow | Canonical implementation | Confirmed result / destination |
| --- | --- | --- |
| Login / signup | Better Auth client + completeSignIn | Cookie verified; safe callback or /admin, /vendor, /dashboard |
| Logout | Better Auth client + completeSignOut | Session absence verified; authenticated layout invalidated; / |
| Approve / reject / suspend / feature / unfeature car | lib/mutations.ts moderate | Transactional status + audit write; filtered /admin/cars |
| Approve / reject / suspend seller | Same moderate function | Seller detail; suspension also withdraws active inventory |
| Create car | createListing | PENDING_REVIEW; /vendor/cars/[id] |
| Edit car | editListing | Owned record updated; PENDING_REVIEW; /vendor/cars/[id] |
| Submit draft | submitListing | Conditional owned draft update; /vendor/cars/[id] |
| Seller application | applyVendor | Nested location persisted; /vendor |
| Seller profile | updateProfile | Owned approved profile persisted; /vendor/profile |
| Favorite / unfavorite | lib/buyer-mutations.ts setFavorite | Desired state confirmed; saved list/count invalidated |
| Send inquiry | sendInquiry | Persisted buyer/vendor/vehicle association; relevant dashboards invalidated |
| Save decision | saveDecision | Confirmed saved decision; recommendations/count invalidated |
| Compare | comparison.tsx / compare-button.tsx | Local shortlist and current URL |
| Contact | contact-form.tsx | Opens email composition with entered data |

No car-delete, account-edit, sold/archive, or separate seller publish/unpublish UI existed. This audit did not invent destructive actions or unrelated workflows. Approval publishes; suspension withdraws; edits resubmit for review. Suspended listings can be revised and resubmitted by an approved owner.

## Security and consistency

- All mutations independently verify a server session; moderation also requires ADMIN.
- Seller edits and submissions include ownership in the database query.
- Route-handler mutation adapters reject cross-origin requests. Server Actions use Next.js origin protections.
- Callback paths reject external origins, protocol-relative URLs, backslashes/control characters, and login/register/API loops. Unauthorized admin callbacks fall back to the user's own workspace.
- Car moderation checks IDs, existence, allowed state, seller approval, images, and conditional write counts.
- Moderation changes and audit records commit in one MongoDB transaction. This uses Atlas transaction support.
- Listing status remains the existing canonical ACTIVE / PENDING_REVIEW / REJECTED representation. Mongoose and TypeScript share the status array.
- Public inventory also requires current seller approval, so suspended sellers cannot remain public through a concurrent status change.
- Next.js redirects are outside mutation catches. Client transport-error handlers use the installed unstable_rethrow API to preserve framework redirects.
- All form controls disable during submission. Important client handlers also guard repeated submissions.
- Database errors are logged server-side with operation context; recoverable failures remain on the form with feedback.

## Important files changed

- Authentication: lib/auth.ts, lib/auth-client.ts (inspected, retained), lib/safe-next.ts, lib/actions.ts, components/auth/auth-form.tsx, components/navigation/sign-out-button.tsx, app/login/page.tsx, app/register/page.tsx.
- Shared mutation infrastructure: lib/mutations.ts, lib/moderation.ts, lib/mutation-result.ts, lib/invalidation.ts, lib/mutation-route.ts, lib/json-mutation.ts, lib/buyer-mutations.ts, lib/buyer-actions.ts.
- Form behavior: components/forms/action-form.tsx, submit-button.tsx, notice.tsx, contact-form.tsx; app/layout.tsx.
- API adapters: app/api/admin/moderate, app/api/vendor/cars, app/api/vendor/cars/[id]/submit, app/api/vendors/apply, app/api/favorites, app/api/inquiries, app/api/adviser/save. Adviser recommendation failures now log context.
- Admin views: all admin data pages; car list filters and real car detail review.
- Seller views: listing creation/detail/edit, seller profile, seller inquiries, application, overview, public vendor page.
- Buyer views: dashboard inquiries; favorite, inquiry, and adviser components; comparison and featured inventory components.
- Data/schema/config: lib/vehicles.ts, lib/listing-status.ts, models/Vehicle.ts, types/index.ts, next.config.ts. Server Action upload limits preserve multiple image uploads (up to ten 8 MB files).
- Tests: lib/safe-next.test.ts, lib/moderation.test.ts, lib/mutations.test.ts, lib/actions.test.ts, scripts/action-audit.mjs.
- Earlier connection recovery changes in lib/db.ts, lib/db.test.ts and the Better Auth route were retained. Pre-existing listing/image work was preserved and integrated.

## Validation

The repeatable browser script runs against localhost with an isolated Chromium profile on port 9222. It creates uniquely named accounts, seller profiles and listings, verifies database records alongside browser state, and deletes only its own related records in finally. It does not modify real user listings.

- TypeScript: passed, including the production build's TypeScript phase.
- ESLint: passed with zero errors and zero warnings on the final run.
- Production build: passed; all App Router routes and the proxy compiled.
- Vitest: 53 tests passed across 7 files.
- git diff --check: passed.
- Browser plus MongoDB verification passed for signup, failed-login correction, logout, callback preservation, role destinations, unauthorized moderation, seller application/location persistence, seller approval, listing creation, pending-to-ACTIVE approval, publication timestamp, audit entry, approved/pending query agreement, approved/pending browser navigation, favorites, removal without manual reload, and inquiry persistence.
- The full browser script did not complete in a single run. Harness failures included matching metadata instead of form inputs, checking navigation before rendering completed, Windows arrow-character encoding, and clicking a disabled favorite button while another was ready. Confirmed application defects encountered during testing were fixed; completed flow assertions are listed above.
- A final browser-audit command was denied, so no further browser run was attempted. Adviser-save UI, seller-profile edit UI, listing-edit/rejection UI, and the full-suite no-uncaught-errors assertion remain unverified end to end.
- File-upload code was reviewed and validation was integrated; browser listing creation used an image URL, not a live Cloudinary upload.
- Every executed fixture run reached its scoped cleanup and removed its own accounts and related records. No real user records were changed.

## Browser checklist

1. Open a protected garage page while signed out. Log in and confirm return to the same path/query.
2. Enter an incorrect password, then correct it. Inputs should remain, the error should clear, and navigation should happen only after success.
3. Log in as an admin, seller and buyer without a callback; confirm /admin, /vendor and /dashboard respectively. Sign out and confirm the navbar updates.
4. Submit a car, then approve it as admin. Confirm it disappears from Pending and appears under Approved and public inventory without a manual refresh.
5. Reject a pending car. Confirm the rejected filter and seller status agree. Edit and resubmit it; confirm it returns to review.
6. Feature/unfeature or suspend an active car; confirm public inventory and dashboard counts refresh.
7. Save and remove a car from Saved cars; the card should disappear immediately after confirmed removal.
8. Send an inquiry and save a decision; verify both garage pages and the seller inquiry page.
9. Save a seller profile; verify the public seller page.
10. Try invalid inputs and double-click action buttons. Confirm visible errors, retained form values, and no false success/navigation.
