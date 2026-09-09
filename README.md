# CarXSailor

[CarXSailor](https://carxsailor.vercel.app) is a vehicle marketplace for Nigeria with explained car recommendations. Buyers can browse listings, set a budget and priorities, compare up to three cars, and save cars or decisions in My Garage.

## Features

- Vehicle search by make and price, listing photos, condition reports and seller inquiries.
- Guided decision support with hard requirements, weighted ratings, strengths, trade-offs and missing-data explanations.
- Optional natural-language preferences, with a local interpreter when an AI provider is unavailable.
- Buyer accounts, saved cars and decisions, approved seller workspaces, and administrator moderation.
- Responsive mobile layouts, accessible navigation and reduced-motion support.
- Branded favicons, social previews, canonical metadata and a dynamic sitemap.

## Stack and architecture

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Motion, MongoDB/Mongoose, Better Auth, Zod and Vitest. Cloudinary stores uploaded photos; Resend handles transactional email.

```text
Guided answers or natural-language preferences
  -> validated CarPreference
  -> required inventory filters
  -> deterministic weighted ranking
  -> explained matches, comparison and saved decisions
```

AI interprets language; application code filters and scores actual listings. AI does not invent cars, prices, scores or inspection facts. Missing ratings are disclosed. The guided flow works without an AI credential.

Better Auth owns users, credentials and sessions. Mongoose owns marketplace records. Roles are BUYER, VENDOR and ADMIN; publishing also requires an approved seller profile. Mutations enforce server-side role and ownership checks, validation and audit logging.

## Local setup

Requirements: Node.js 20.9 or newer, npm, and a reachable MongoDB instance.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Set `MONGODB_URI` and a high-entropy `BETTER_AUTH_SECRET`.
4. Keep `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` at `http://localhost:3000` for local development.
5. Run `npm run dev` and open `http://localhost:3000`.

Optionally run `npm run seed` against a development database. It replaces only listings tagged `test-inventory`, creates or updates an approved test seller, and inserts 10 sample cars. Sample ratings and photos are test data, not automotive evidence. Sample listings are excluded from the sitemap, receive `noindex`, and do not emit vehicle offer structured data.

Promote an administrator by securely setting the intended Better Auth user's role to `ADMIN` in MongoDB. There is no public admin-promotion endpoint.

## Configuration

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Database connection string. |
| `BETTER_AUTH_SECRET` | Authentication secret. |
| `BETTER_AUTH_URL` | Authentication origin; match the application origin. |
| `NEXT_PUBLIC_APP_URL` | Application origin used by authentication, email and listing links. |
| `SITE_URL` | Canonical SEO origin. Defaults to `https://carxsailor.vercel.app`, independently of local application URLs. |
| `GOOGLE_SITE_VERIFICATION` | Optional Search Console HTML verification token, using only the tag's content value. |
| `CLOUDINARY_URL` | Server-only upload credentials; separate Cloudinary fields are also supported in `.env.example`. |
| `RESEND_API_KEY` | Transactional email credentials. |
| `EMAIL_FROM` | Sender identity; use a verified sender for production. |
| `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS` | Alternative sender configuration. |
| `ADMIN_NOTIFICATION_EMAIL` | Destination for administrator notifications. |
| `NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER` | Customer-facing WhatsApp number, international digits only. |
| `AI_PROVIDER` | Optional `gemini` or `openai` interpreter. |
| `GEMINI_API_KEY` | Server-only Gemini credential. |
| `AI_API_KEY` | Server-only OpenAI credential; also accepted as a legacy Gemini credential. |
| `AI_MODEL` | Optional model override; see `lib/ai/provider.ts` for current application defaults. |

Never put secrets in variables prefixed with `NEXT_PUBLIC_`. See [email configuration](docs/EMAIL.md) for delivery setup and testing.

## SEO and brand assets

The canonical public site is **https://carxsailor.vercel.app**.

- `lib/seo.ts` centralizes canonical URLs, descriptions, Open Graph and Twitter cards, and safe JSON-LD serialization.
- Public pages have distinct titles, descriptions and canonical URLs. Filter, sort, comparison and resume parameters canonicalize to their base page.
- Vehicle pages use actual listing titles, descriptions and photos. Real listings emit Car/Offer data with NGN prices; homepage structured data identifies the WebSite and Organization. Listing scores are not represented as customer reviews.
- `app/sitemap.ts` includes public pages, approved non-test sellers and their active non-demo vehicles, including listing image URLs. Record timestamps supply `lastModified`; static pages do not invent update dates. There is no arbitrary 1,000-listing cutoff. If the site approaches 50,000 URLs, split the sitemap before exceeding the protocol limit.
- `app/robots.ts` directs crawlers to the sitemap and excludes private workspaces and API paths. Account and workspace pages also have `noindex` metadata. Vercel preview deployments disallow crawling and public page metadata disables indexing.
- `app/icon.svg` is the editable ship-wheel mark in forest green and lime. `app/favicon.ico` contains 16, 32 and 48px variants; `app/apple-icon.png` is 180px. Next.js automatically adds these icon links.
- `app/manifest.ts` references `public/icon-192.png` and `public/icon-512.png`. The manifest supplies brand identity; it does not provide offline functionality.
- `public/social-preview.svg` is the editable 1200 x 630 sharing artwork; `public/social-preview.png` is the social-card image. Raster assets must be regenerated if their SVG sources change.

The setup follows Google's [favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search), [site-name guidance](https://developers.google.com/search/docs/appearance/site-names), and [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). Search engines determine indexing, rankings and the final appearance of results.

## Production deployment

1. Configure MongoDB, authentication, image uploads and email in the hosting environment.
2. Set `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL` and `SITE_URL` to `https://carxsailor.vercel.app` for production.
3. Run the validation commands below, then deploy. Keep Vercel preview environments separate from production.
4. Check `/favicon.ico`, `/icon.svg`, `/apple-icon.png`, `/manifest.webmanifest`, `/social-preview.png`, `/robots.txt` and `/sitemap.xml` on the deployed site.
5. Verify the site in Google Search Console. Set `GOOGLE_SITE_VERIFICATION` and redeploy if using HTML-tag verification, then submit `https://carxsailor.vercel.app/sitemap.xml`.
6. Inspect a real listing with Google's Rich Results Test and check social link previews. Confirm production canonical tags use the public HTTPS domain.

If the domain changes, update the three origin variables, redirect the old domain, and resubmit the sitemap. Local code changes do not update Vercel environment settings or register the site with search engines automatically.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development. |
| `npm run build` | Create and type-check the production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test` | Run Vitest tests. |
| `npm run seed` | Refresh the tagged development inventory. |
| `npm run email:test` | Exercise email configuration and templates. |

For an HTTP smoke check, run `npm start -- -p 3001` after building, then `node scripts/seo-review.mjs`. Pass another local or deployed origin as the first argument if needed. The check verifies canonical URLs, sharing metadata, icons, robots and the sitemap against the configured public identity.

On Windows PowerShell systems that block `npm.ps1`, use `npm.cmd` with the same arguments.

## Project map

- `app/`: pages, route handlers, metadata and shared styles.
- `components/`: marketplace, adviser, account, navigation and motion interfaces.
- `lib/dss/`: preference validation and deterministic ranking.
- `lib/ai/`: optional language interpreters.
- `lib/email/`: transactional email configuration and templates.
- `models/`: MongoDB domain models.
- `scripts/`: development seed and local review utilities.
- `docs/`: email, interaction and design implementation notes.

Before editing Next.js code, read `AGENTS.md` and the relevant installed guides under `node_modules/next/dist/docs/`; this repository uses the APIs of its installed Next.js version.
