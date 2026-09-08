# CarXSailor product and motion redesign

## Product changes

The original three-section homepage did not explain the complete decision journey. Guided mode linked to a missing form, comparison did not exist, saved cars and recommendation history were placeholders, and save failures were silent. Session retrieval already used Better Auth on the server; the problems were loading presentation, action feedback and nested return paths. See `redesign-audit.md` for the original route and model audit.

The revised journey is Discover → Decision Support → Compare → Save → My Garage. Browsing, questions, recommendations and comparison are public. Saving uses Better Auth, preserves the original route and retains the current decision in the same browser tab. Registration and login both return to the requested context. The navbar uses the server session as its initial state and the Better Auth client for subsequent updates. Buyer features are available to authenticated administrators too; privileged workspaces retain their existing role checks.

The homepage now includes a campaign hero, decision introduction, featured vehicle selector, seven supported criteria, process timeline, interactive ranking preview, comparison showcase, practical benefits, database-derived inventory statistics, manufacturer links, FAQ, closing campaign panel and substantial footer. No testimonials, usage statistics or unsupported ownership criteria were invented. Existing sample inventory is explicitly labelled when its seeded photographs are illustrative.

The questionnaire has budget, vehicle requirements, priorities and review steps, with progress, Back/Continue controls, editable answers and an honest processing state. Guided input goes directly through validated preferences into the existing ranking engine; free-text interpretation remains available. Recommendations disclose actual strengths, low ratings and missing evidence. Scores are presented as indices out of 100 rather than probabilities. Comparisons support up to three available cars. Saved decisions reuse the existing AdviserSession model, with server-computed rankings; saved cars reuse Favorite. There are no database schema changes or migrations.

## Motion audit and architecture

No Motion or Framer Motion dependency was installed. Added open-source `motion` 13.2.0, using its normal React APIs. It includes Framer Motion as an internal dependency; application imports use only `motion/react` and `motion/react-m`. No migration from an existing animation library was needed. No GSAP, Motion+, cursor package or scroll replacement was added.

The global MotionProvider uses MotionConfig with `reducedMotion="user"` and strict LazyMotion. The `domMax` feature bundle loads asynchronously because shared layout and position animations are used. All declarative elements use the lightweight `m` entry point. Tokens in `lib/motion.ts` centralize easing, short feedback, standard transitions, directional state changes and damped springs. Framework documentation reviewed: [LazyMotion](https://motion.dev/docs/react-lazy-motion), [scroll values](https://motion.dev/docs/react-use-scroll), [accessibility](https://motion.dev/docs/react-accessibility).

Reveal and TextReveal enhance already-rendered DOM content when it enters view. They do not hide critical content on the server or wait for a mounted flag to render marketing copy. Text fragments are decorative; the heading exposes a single full accessible label. Stagger sequences are short and occur once. Animation cleanup completes the final state, so interruption cannot strand content behind a mask.

## Signature interactions

- Hero: overlapping masked heading lines, supporting copy entrance, image mask/scale reveal and restrained scroll depth. Fine pointers can pan the image by a few pixels. No dramatic tilt.
- Decision story: a desktop sticky heading accompanies progressively emphasized requirements and a final explanation. Mobile and reduced-motion views use a simple vertical composition. It does not invent example recommendations or manipulate scrolling.
- Process: a scroll-linked line and numbered steps communicate progress using MotionValues.
- Featured cars: AnimatePresence transitions reverse direction for previous selections; a shared layout background travels between selector buttons.
- Live preview: ratings respond to real changes and ranked rows move into their new positions with layout animation.
- Comparison showcase: paired reveals arrive from opposite sides, with a restrained central VS marker. The actual comparison table stays stable and locally scrollable.
- Cards and actions: small hover lift, guarded image zoom, restrained button compression, save-heart confirmation, compare-state feedback and magnetic movement on a few main CTAs.
- Questionnaire: keyed Next/Back transitions reverse direction; the progress bar uses a damped spring. Errors and authentication state are not delayed by animation.
- Results: the heading and recommendation groups enter in a short, coordinated sequence.
- Navigation: scroll-linked background solidity, quick account dropdown transitions and a clipped mobile navigation panel. The panel is nonmodal, so it does not trap focus or lock page scrolling. Escape closes it and restores focus to its trigger.
- FAQ: keyboard buttons, expanded-state semantics, short presence fades and shared layout repositioning. Statistics count only a small final range of their real values, once; prices do not count up.
- Closing section and footer: a consistent dark image panel, masked closing heading and quiet group reveal.

## Mobile, reduced motion and performance

Pointer effects require a wide viewport, a fine pointer and hover support. Reduced-motion preferences remove parallax, magnetic effects, sticky storytelling, large transforms and layout motion. Short opacity feedback remains. Native scrolling and focus outlines are retained. No React state tracks raw scroll positions and no product animation uses a manual animation-frame loop. The frame loop in the review script is measurement-only.

Large photography uses the existing next/image policy with responsive sizes and only above-the-fold imagery loaded eagerly with high fetch priority. Server pages still fetch data; small client wrappers provide motion. Global route exits, cross-route shared-image transitions, marquees, custom cursors, large rotations, scroll-velocity distortions and decorative perpetual animation were intentionally omitted because they add cost or conflict with navigation and readability.

Production bundle snapshots are recorded in `artifacts/bundle-before-motion.json` and `artifacts/bundle-after-motion.json`. These measure the aggregate gzip size of all production client JavaScript assets across all routes, **not** the homepage's initial payload. The snapshots were 306,262 and 373,057 bytes respectively, an increase of 66,795 bytes, including deferred motion features and application code. Runtime measurements and Lighthouse output are stored separately.

## Files created

Product infrastructure:

- `proxy.ts`
- `lib/safe-next.ts`, `lib/safe-next.test.ts`
- `lib/dss/criteria.ts`, `lib/dss/preferences.ts`, `lib/dss/preferences.test.ts`, `lib/dss/recommend.ts`
- `app/compare/page.tsx`, `app/api/adviser/save/route.ts`
- `components/navigation/navbar.tsx`, `components/navigation/footer.tsx`
- `components/home/hero.tsx`, `featured-cars.tsx`, `decision-sections.tsx`, `decision-preview.tsx`, `closing-sections.tsx`
- `components/adviser/guided-adviser.tsx`, `results.tsx`, `resume-decision.tsx`
- `components/cars/vehicle-image.tsx`, `compare-button.tsx`, `comparison.tsx`, `decision-context.tsx`

Motion infrastructure:

- `lib/motion.ts`
- `components/motion/provider.tsx`, `features.ts`, `use-motion-policy.ts`
- `components/motion/reveal.tsx`, `stagger.tsx`, `cta.tsx`, `hero-visual.tsx`, `scroll-progress.tsx`
- `components/motion/decision-story.tsx`, `process-timeline.tsx`, `word-highlight.tsx`
- `components/motion/accordion.tsx`, `animated-number.tsx`, `vehicle-card-motion.tsx`

Review artifacts:

- `scripts/browser-review.mjs`, `scripts/cleanup-review-account.mjs`, `scripts/motion-review.mjs`
- `docs/redesign-audit.md`, `docs/redesign-and-motion.md`
- Screenshots and audit JSON in `artifacts/`

## Existing files modified

- `.gitignore`, `eslint.config.mjs`, `next.config.ts`, `package.json`, `package-lock.json`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/sitemap.ts`
- `app/car-adviser/page.tsx`, `app/cars/[slug]/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`
- `app/about/page.tsx`, `app/how-it-works/page.tsx`
- `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `app/dashboard/favorites/page.tsx`, `app/dashboard/recommendations/page.tsx`, `app/dashboard/inquiries/page.tsx`
- `app/api/adviser/recommend/route.ts`, `app/api/favorites/route.ts`
- `components/adviser/adviser.tsx`, `components/auth/auth-form.tsx`, `components/navigation/sign-out-button.tsx`
- `components/cars/vehicle-card.tsx`, `components/cars/favorite-button.tsx`
- `lib/auth.ts`, `lib/vehicles.ts`, `lib/dss/engine.ts`, `lib/ai/parse-car-request.ts`, `types/index.ts`

No repository `.git` directory was present, so this is an implementation inventory rather than a Git diff.

## Validation and remaining content work

TypeScript, ESLint, the production build and all 16 tests passed during implementation. The browser journey passed anonymous guidance, review, explained results, comparison, protected redirects, registration back to results, saving/reopening cars and decisions, sign-out state and existing-user sign-in redirects. The isolated test account and its records were removed after testing.

The existing catalogue contains seeded test listings, ratings and stock photographs. Replace these with verified listing content before treating it as a production sales catalogue. No reference image was attached with the redesign brief, so the design follows the supplied written principles. No privacy/terms or buyer-profile pages were invented; footer/account links point to existing destinations. The pre-existing inquiry-history page remains a placeholder; the inquiry API and seller workspaces were preserved.

Final production motion review passed masked-heading accessible names, forward/reverse featured selections, keyboard FAQ interaction, tablet navigation, reduced-motion depth removal, no mobile overflow, no-JavaScript homepage readability and no uncaught runtime exceptions. In a short 90-frame sample at 4x CPU throttling, observed CLS was 0, no frame exceeded 50 ms and the maximum sampled interval was 50 ms. This is a lab smoke measurement, not certification of sustained 60 fps on physical Android hardware. See artifacts/motion-performance.json.

Final Lighthouse mobile scores: performance 80, accessibility 100, best practices 100, SEO 100. Metrics: FCP 1.4 s, LCP 2.9 s, total blocking time 320 ms, CLS 0.001. The JSON report was saved successfully to artifacts/lighthouse-mobile-final.json; the CLI subsequently exited with a Windows temporary-directory cleanup EPERM error. This does not invalidate the generated audit, but the audit command did not exit cleanly. The initial report was 55/93/100/100; changes addressed invalid counter ARIA, marginal contrast, hero request priority, shared device-policy subscriptions and validation code unnecessarily included in the homepage preview. Browser workload also differed between runs, so the score change is not an isolated causal benchmark.

Global routing remains native. The implementation does not claim a real-device performance guarantee or a production-grade sales dataset. Final content work remains replacing the pre-existing seeded listings and mismatched photographs with authentic vehicle information.
