# CarxSailor

CarxSailor is a Nigerian vehicle marketplace with an explainable decision-support adviser. Buyers can browse normally or describe their situation in plain language.

## Architecture

```text
User -> Next.js -> AI interpreter -> CarPreference
     -> MongoDB candidate query -> deterministic DSS ranking
     -> recommendation -> optional AI explanation
```

The layers stay separate: AI interprets language and ambiguity; application-owned filters retrieve real listings; the deterministic DSS ranks those listings; AI may explain results but never invents cars, prices, scores, or inspection facts. A safe local interpreter keeps guided recommendations available when no AI credential is configured.

## Stack and security

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- MongoDB with Mongoose for CarxSailor models
- Better Auth with its official native MongoDB adapter
- Zod validation and Vitest DSS tests
- Server-side role/ownership checks, whitelisted inputs, duplicate favorite protection, inquiry throttling, audit logs, private-field projections, and no client-side secrets

Better Auth owns credentials, sessions, accounts and users. Mongoose owns domain profiles and marketplace data; passwords are never duplicated in a domain model. Roles are `BUYER`, `VENDOR`, and `ADMIN`. Vendor publishing additionally requires an approved `VendorProfile`.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI` and generate a strong `BETTER_AUTH_SECRET`.
3. Run `npm install`.
4. Run `npm run seed` to replace the vehicle inventory with one approved test seller and 10 varied test listings.
5. Run `npm run dev`.

Environment variables:

- `MONGODB_URI`: shared MongoDB database
- `BETTER_AUTH_SECRET`: required high-entropy production secret
- `BETTER_AUTH_URL`: canonical auth origin
- `NEXT_PUBLIC_APP_URL`: public application origin
- `CLOUDINARY_URL`: server-only Cloudinary credential URL used for uploaded vehicle images
- `AI_PROVIDER`: `gemini` (recommended for the free tier) or `openai`
- `GEMINI_API_KEY`: server-only key from Google AI Studio; never prefix it with `NEXT_PUBLIC_`
- `AI_API_KEY`: OpenAI key, also accepted as a backwards-compatible Gemini key
- `AI_MODEL`: optional override; Gemini defaults to `gemini-2.5-flash-lite`

Gemini interprets free-form adviser messages into validated preferences. If its quota is exhausted, it times out, or it returns invalid data, the adviser automatically falls back to the local interpreter.

The seeded ratings are explicitly test metadata, not authoritative automotive research. Promote the first admin by securely setting the Better Auth user's `role` field to `ADMIN` in MongoDB; never expose an admin-promotion endpoint.

## Commands

- Development: `npm run dev`
- Seed: `npm run seed`
- Tests: `npm test`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Production build: `npm run build`

The important DSS tests cover hard budget/transmission/engine constraints, weight normalization, score bounds, missing data, weight-driven ranking changes, and deterministic output.



"# carxsailor" 
