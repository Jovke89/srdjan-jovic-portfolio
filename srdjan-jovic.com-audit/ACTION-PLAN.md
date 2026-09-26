# Action Plan — srdjan-jovic.com SEO Audit

## Phase 1: Critical Fixes (this week)

1. **Fix invalid Event schema** — `src/lib/seo/jsonld.ts` `buildEventLd()`: omit `startDate`/`image` when empty (same pattern as `datePublished`'s existing guard); populate the real `startDate` for `flowConf-2026` in Sanity.
2. **Fix `/contact/` performance regression** — Cal.com widget currently defers *when* it loads, not *how much* it costs (still 3.2s TBT mobile, 2MB transfer). Switch to load-on-real-intent (click-to-load or a genuine intersection-observer threshold), and investigate the duplicate Cal.com avatar image request.
3. **Fix the canonical/trailing-slash mismatch** — make `canonicalFor()`/`absUrl()` in `src/lib/seo/site.ts` preserve the trailing slash so canonicals match the actual served/sitemapped URL on all ~57 affected pages.
4. **Deindex `/video/` and `/style-guide/`** — add `noindex: true` to `video.astro`; add both `/video` and `/style-guide` to the sitemap `filter` in `astro.config.mjs`.

## Phase 2: High-Impact Improvements (weeks 2-3)

1. Write 8 unique meta descriptions for `/resource-category/*` hubs; add a 100-200 word intro under each hub H1.
2. Add `CollectionPage` JSON-LD to `/resource-category/[slug]/` (new `buildResourceCategoryLd()` in `jsonld.ts`).
3. Rebuild `/resources/webflow-vs-framer-freelancers/`'s comparison section as a real `<table>` with actual pricing figures.
4. Build or expand a dedicated hire-intent page/section (process, rate range, embedded case studies) — either a new `/services/` page or an expanded homepage section pulling in the content already written for `/resources/what-i-charge-for-webflow-projects/`.
5. Fix the "three years" vs. "four years" experience contradiction (llms.txt vs. homepage).
6. Split `BaseLayout.css` / extract critical CSS to remove the sitewide render-blocking penalty (~150-320ms per page).
7. Add a client testimonial to the Arni Fitness Zone case study; add quantified outcome stats to the 4 case studies currently missing them.
8. Add security headers (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) via Vercel config; extend HSTS with `includeSubDomains; preload`.
9. Fix the apex-domain 2-hop redirect chain in Vercel's Domains settings.
10. Fix `color-contrast` accessibility failures (body text + newsletter modal input, ratio as low as 1.47:1) found during the performance pass.

## Phase 3: Content & Authority (month 2)

1. Add a visible in-body author bio/credentials block to resource articles (not just schema-only attribution).
2. Add 1-2 contextual links from each case study to the relevant `/resources/` methodology article.
3. Create a glossary index page linking the 5 "what is X" posts together; add a "See also" module to each.
4. Re-tag `webflow-for-freelancers-first-client-project` into a "Freelance Business" cluster alongside the relevant `blog` posts.
5. Publish net-new articles in priority order: Webflow + Zapier (High), Webflow vs Webstudio (High), Webflow vs Wix (Medium), Webflow + Airtable via Make (Medium), a second vibe-coding post (Medium).
6. Extend `sameAs` with a GitHub profile if one exists; consider a modest YouTube presence (build walkthroughs) — highest measured correlation with AI citation likelihood of any signal checked.
7. Add a before/after PageSpeed screenshot + a 3-row metrics table to the Core Web Vitals article.
8. Add `VideoObject` schema to `/video/` if it's kept as a real, indexable page.
9. Vary bottom-of-article CTAs by content type/reader journey stage instead of reusing "Let's work together" everywhere.

## Phase 4: Monitoring & Iteration (ongoing)

1. Re-run PageSpeed Insights on `/contact/` and the homepage after Phase 1/2 fixes to confirm the regression is resolved and desktop TBT is no longer noisy.
2. Re-check CrUX field data in 4-6 weeks once the domain accrues enough Chrome traffic for eligibility.
3. Validate the Event and CollectionPage schema fixes in Google's Rich Results Test.
4. Manually check Search Console (Indexing coverage, Review-snippet validation status) since GSC API isn't authorized in this environment yet.
5. Re-check AI crawler allow/block directives quarterly as new bot user-agents emerge.
6. Add `lastmod` to the sitemap and consider an IndexNow ping on publish, once the higher-priority items above are done.
