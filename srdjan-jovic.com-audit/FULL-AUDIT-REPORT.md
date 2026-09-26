# Full SEO Audit — srdjan-jovic.com

Audited: 2026-09-06 · Domain: https://www.srdjan-jovic.com · 58 indexed URLs
Business type: Personal brand / professional services freelancer (Webflow developer), targeting health, fitness and B2B companies.
Stack: Astro (SSG) + Sanity CMS, hosted on Vercel.

## Overall SEO Health Score: 77 / 100

| Category | Weight | Score |
|---|---|---|
| Technical SEO | 22% | 74 |
| Content Quality | 23% | 74 |
| On-Page SEO | 20% | 76 |
| Schema / Structured Data | 10% | 80 |
| Performance (CWV) | 10% | 83 |
| AI Search Readiness (GEO) | 10% | 77 |
| Images | 5% | 85 |

Supplementary (not in the weighted score, informs priorities): SXO (Search Experience) Gap Score 64/100, Content Cluster Architecture 68/100.

## Top 5 Critical / High Issues

1. **[Critical] `/events/flowconf-2026/` ships invalid Event schema** — `startDate: ""` (empty required property). Fails Google's Event rich-result validation outright. Root cause is both a missing Sanity field value and a jsonld.ts builder that doesn't guard empty strings.
2. **[Critical] `/contact/` mobile performance regressed to 68** (TBT 3,200ms) — the "deferred" Cal.com widget still burns 3.6s of main-thread time and 2MB once it fires, on the site's highest-intent (booking) page.
3. **[High] Systemic canonical/trailing-slash mismatch** — `canonicalFor()` strips the trailing slash but the site serves and sitemaps every page WITH one; both URL forms are live with no redirect, so ~57 of 58 pages self-canonicalize to a non-matching URL.
4. **[High] `/video/` is fully indexable thin content** — no noindex, no meta description, title is literally "video", zero structured data, and it's in the public sitemap.
5. **[High] All 8 `/resource-category/*` hub pages** share a mail-merge meta description and have only ~145 words of unique body copy — a duplicate-content/thin-content signal across 14% of the site's indexed URLs.

## Top 5 Quick Wins (low effort, real impact)

1. Fix the "three years" (llms.txt) vs. "four years" (homepage) experience contradiction — 1-line edit in two places.
2. Add `!page.includes('/style-guide')` and `!page.includes('/video')` to the sitemap filter in `astro.config.mjs`, and set `noindex: true` on `video.astro`.
3. Guard `startDate`/`image` in `buildEventLd()` (`jsonld.ts`) the same way `datePublished` is already guarded, then populate the real event date in Sanity.
4. Write 8 unique meta descriptions for the `/resource-category/*` hubs (single CMS field edit each).
5. Shorten the homepage meta description (185→≤160 chars) and the 3 over-length case-study descriptions.

---

## Technical SEO — Score: 74/100

**What works:** robots.txt AI-bot handling is well-designed (citation bots allowed, training bots blocked, `Google-Extended` intentionally open); sitemap validates; HTTPS enforced with HSTS; the four thin taxonomy routes are correctly noindexed and excluded from the sitemap; structured data present per template; fully SSG (no JS-rendering dependency); real 404s; no hreflang (correctly, single-market site).

**Findings:**
- **[High]** Systemic canonical/trailing-slash mismatch across ~57 of 58 URLs (see Top Issues #3). Fix: make `canonicalFor()`/`absUrl()` in `src/lib/seo/site.ts` preserve the trailing slash instead of stripping it.
- **[High]** `/video/` indexable thin content, no noindex/description/title (see Top Issues #4).
- **[Medium]** `/style-guide/` is noindexed in-page but still present in the live sitemap — same conflicting-signal class already fixed for `/industry/`, `/tech-stack/`, `/authors/`, `/testimonials/` in commit `2d69ad1`, just missed on this page.
- **[Medium]** 2-hop redirect chain on the bare apex: `http://srdjan-jovic.com` → `https://srdjan-jovic.com` → `https://www.srdjan-jovic.com`. Vercel domain config, not app code — point the apex redirect straight at the `www` HTTPS URL.
- **[Medium]** No hardening security headers beyond HSTS (no CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy). Add via a Vercel `headers` config.
- **[High]** Homepage mobile CWV lab data: LCP 3.06s, TBT 1,222ms, Performance 69/100 (this specific run/page differs from the performance specialist's separate 93 mobile measurement — treat as noisy lab data pending CrUX field data; see Performance section).
- **[Low]** No IndexNow integration; sitemap has no `<lastmod>` values despite real `Last-Modified` headers existing.
- **[Info]** `/resource-category/*` hubs carry zero structured data (cross-referenced in Schema section).

---

## Content Quality — Score: 74/100

**What works:** Articles are genuinely long-form (2,100–3,645 words), not thin; clean single-H1/multi-H2 hierarchy; strong first-hand experience signals (dated incident posts, "what I tell clients" sections) — exactly what current quality guidelines reward over generic AI content; the glossary cluster (what-is-webflow/seo/aeo/make) interlinks itself well, mitigating cannibalization.

**Findings:**
- **[High]** All 8 resource-category hubs share a templated meta description differing only by category noun (see Top Issues #5).
- **[Medium-High]** Those same hubs have only 143–148 words of unique body copy and no heading structure beyond the sitewide footer CTA. `vibe-coding` hub lists exactly one article.
- **[Medium]** Case studies link to zero `/resources/` articles despite directly relevant methodology posts existing (e.g. Frontera's migration case study never links to `automating-client-onboarding-webflow-make-crm`).
- **[Medium]** No visible in-body author bio/credentials block on articles — author signal exists only in meta/schema tags, not skimmable on-page.
- **[Low]** The four "webflow-vs-X" comparisons share an identical H2 skeleton (content itself is differentiated, so low risk — vary headers going forward).
- **[Low]** `what-is-vibe-coding` sits one hop outside the otherwise fully-meshed glossary interlink cluster.
- **[Low/Info]** Publish dates cluster in a tight 5-day window (expected for a new resource center); the 8 hub pages show a placeholder `2026-01-01` date that should be fixed or suppressed.

**E-E-A-T breakdown:** Experience 85, Expertise 78, Authoritativeness 62 (no external citations/backlinks/third-party recognition yet), Trustworthiness 75 → weighted ≈74/100.

---

## On-Page SEO — Score: 76/100

(Compiled from direct verification across all 58 sitemap URLs plus the SXO specialist's findings.)

- **[Low]** Homepage meta description is 185 characters (recommended ≤160) — will truncate in SERP.
- **[Low]** 3 case-study meta descriptions run 163–166 characters: `/case-studies/arni-fitness-zone/`, `/case-studies/four-tress-partners/`, `/case-studies/xerenta/`.
- **[Low]** 2 resource-category titles run 66–70 characters (`integrations`, `make-automations`) — borderline SERP pixel-width truncation.
- **[Info, confirmed clean]** Zero duplicate `<title>` tags across all 58 URLs. All canonical hrefs are absolute and trailing-slash-consistent with their actual URL (the canonical *value itself* not matching the served path is the separate Technical SEO finding above — this check confirmed internal consistency, not correctness against the served URL). H1 count = 1 on every sampled page type.
- **[Critical, SXO]** `/resources/webflow-vs-framer-freelancers/` renders its entire 6-criteria comparison table as one unbroken `<p>` tag with zero `<table>` elements, despite the SERP for this query being dominated by scannable structured breakdowns; its "Pricing Comparison" section also never states actual dollar figures.
- **[High, SXO]** No dedicated page serves "hire webflow developer"-style commercial intent — the homepage is only 642 words with one generic recycled CTA and no visible process/rate-range section (that content exists but is isolated on a separate blog post).
- **[Medium, SXO]** Arni Fitness Zone case study has strong quantified results (200%/75%) but zero client testimonial text — a trust gap for decision-stage B2B buyers.
- **[Medium, SXO]** Core Web Vitals article has no before/after screenshot or metrics table despite competing content relying on visual proof.
- **[Low, SXO]** CTAs don't vary by journey stage — "Let's work together" appears identically on the homepage, case studies, and articles regardless of reader intent.

---

## Schema / Structured Data — Score: 80/100

**Confirmed clean:** No `Review`/`aggregateRating` JSON-LD anywhere on the live site — the `2d69ad1` fix (the one that prompted this audit) holds across every sampled page.

**Findings:**
- **[Critical]** `/events/flowconf-2026/` emits `"startDate": ""` (see Top Issues #1). Fix `buildEventLd()` in `src/lib/seo/jsonld.ts` to omit `startDate` (and `image`) when empty, matching the pattern already used for `datePublished`, and populate the real date in Sanity.
- **[Medium]** `/resource-category/[slug]/` pages ship zero JSON-LD despite being deliberately kept indexable — add a `CollectionPage` block mirroring the existing `/resources/` and `/events/` list-page pattern.
- **[Info]** `FAQPage` is present and correctly built on all 36 resource articles, but Google retired FAQ rich results site-wide on 2026-05-07 — this markup is inert for Google now (may still help AI answer-engine parsing, unconfirmed). Not broken, just no longer earns a SERP feature.
- **[Info]** Marko Miladinović's case study types him `Organization` instead of `Person` (he's an individual, not a company) — cosmetic, no rich-result risk.
- **[Info]** `hasPart` Article stubs on the `/resources/` list page have `@id` but no separate `url` property — textbook-incomplete, not a validation failure.
- **[Opportunity, not urgent]** `BreadcrumbList` explicitly NOT recommended yet — no breadcrumb UI exists anywhere on the site; add schema only alongside a real breadcrumb component. `Service` schema for the freelance offering is a safe, low-priority addition.

---

## Performance (Core Web Vitals) — Score: 83/100

CrUX field data unavailable sitewide (site too new/low-traffic for Chrome UX Report eligibility) — all numbers are single-run Lighthouse lab data via PageSpeed Insights.

| Page | Strategy | Performance | LCP | TBT | CLS |
|---|---|---|---|---|---|
| `/` | Mobile | 93 | 2.6s | 90ms | 0 |
| `/` | Desktop | 83 | 0.8s | 350ms | 0 |
| `/contact/` | Mobile | **68** | 1.5s | **3,200ms** | 0.001 |
| `/contact/` | Desktop | 87 | 0.4s | 270ms | 0.024 |
| `/case-studies/frontera/` | Mobile | 91 | 2.2s | 320ms | 0 |
| `/case-studies/frontera/` | Desktop | 100 | 0.5s | 60ms | 0 |
| `/resources/` | Mobile | 97 | 2.0s | 110ms | 0 |
| `/resources/` | Desktop | 81 | 0.6s | 440ms | 0 |
| `/resources/webflow-structured-data-schema-markup/` | Mobile | 98 | 2.3s | 50ms | 0 |
| `/events/` | Mobile / Desktop | 100 / 100 | 1.4s / 0.5s | 40ms / 60ms | 0 |

**Findings:**
- **[Critical]** `/contact/` mobile regressed *below* its pre-fix baseline (73→68) — the Cal.com widget's "defer" changes *when* 3.6s of blocking JS + 2MB of transfer happens, not whether it happens. A duplicate Cal.com avatar image request was also found (~77KB wasted). Fix: load Cal.com only on real user intent (click-to-load or a genuine intersection-observer threshold), not idle-callback-on-page-load.
- **[High]** `BaseLayout.css` is render-blocking sitewide with ~70-74% unused bytes on every page (~15-17KB), costing 80-320ms of first-paint delay per page. Split into per-route/critical CSS.
- **[High]** Homepage desktop measured 83, below the previously-recorded 92 baseline, with `forced-reflow-insight` still failing — worth 2-3 repeat PSI runs to rule out lab noise before treating as a real regression; if it reproduces, there's a second forced-reflow source beyond the one already fixed.
- **[Medium]** `/resources/` desktop has the highest TBT of any page (440ms), driven by GTM main-thread cost (410ms) — investigate whether GA4/GTM re-scans the DOM per resource card.
- **[Medium]** GA4/GTM is a consistent 130-410ms main-thread cost sitewide once it fires, with ~72KB (of ~170KB) consistently unused — expected for a tag manager, but consider loading `gtag.js` directly to shed the GTM container overhead.
- **[Info, confirmed fixed]** CLS is ~0 across every page tested. Case-study template and `/events/` now exceed their post-fix baselines (91/100 and 100/100 mobile respectively).
- **[Flagged for a11y, not performance]** `color-contrast` failing on body text and a newsletter modal input on the resource-article template, contrast ratio as low as 1.47:1 — worth a dedicated accessibility pass.

## Google Field Data (CrUX)

No CrUX field data exists yet for the origin or any individual URL (origin-, URL-, and 40-week-history level all returned "insufficient Chrome traffic volume") — expected for a young, low-traffic domain, not a defect. Search Console and GA4 APIs aren't authorized in this environment (PSI/CrUX API key only) — recommend checking indexation/queries manually in the GSC UI meanwhile, and re-running a CrUX check in 4-6 weeks once traffic accrues.

---

## AI Search Readiness (GEO) — Score: 77/100

| Dimension | Score |
|---|---|
| Citability | 82 |
| Structural Readability | 85 |
| Multi-Modal Content | 55 |
| Authority & Brand Signals | 60 |
| Technical Accessibility | 95 |

**What works:** robots.txt AI-bot rules verified live and correct; `llms.txt` present and genuinely well-formed (site "practices what it preaches" per its own `llms-txt-webflow` article); FAQPage schema matches visible content exactly on every sampled page, no orphaned markup; strong TL;DR/direct-answer structure; fully server-rendered content with zero JS dependency for crawlability.

**Findings:**
- **[Medium]** Direct factual contradiction: `llms.txt` says "more than three years of experience," the homepage says "more than four years." Fix both — trivial edit, but exactly the kind of checkable inconsistency AI entity-resolution penalizes.
- **[Medium-High]** `sameAs` entity links limited to LinkedIn + Instagram — no GitHub, YouTube, Reddit, or Wikipedia. YouTube has the strongest measured correlation (~0.737) with AI citation likelihood of any signal checked; this is the single highest-leverage gap on the site, though it's an off-page effort not a code fix.
- **[Medium]** 4 of 6 case studies (Xerenta, 4Tress Partners, Marko Miladinović, AnswerLabs) have zero quantified outcome stats, versus Frontera (200% traffic) and Arni Fitness Zone (75% revenue) which do — specific numbers are what answer engines prefer to quote.
- **[Medium]** `/video/` has zero structured data — add `VideoObject` schema if it hosts real video content.
- **[Medium]** Paragraphs run shorter (median 59 words) than the 134-167 word range citation research associates with maximum extraction likelihood — worth testing consolidation on the highest-priority AEO articles specifically, not site-wide.
- **[Low]** `llms.txt` case-study list is missing 2 of 6 case studies (the same two lacking quantified stats).
- **[Low]** No RSL 1.0 licensing declaration — low-priority, emerging standard.

**Estimated per-platform readiness:** Google AI Overviews 80, ChatGPT 78, Perplexity 82, Bing Copilot 70.

---

## Content Architecture / Clustering — Score: 68/100 (supplementary)

- **[High]** The five "what is X" glossary posts (aeo/seo/webflow/vibe-coding/make) already function as de facto cross-cluster pillars through organic in-body linking, but have zero shared taxonomy — no glossary index, no "start here" page. Costs zero new articles to fix: add a glossary index page and a "See also" module linking all five together.
- **[High]** The `webflow` category is an audience-mixed catch-all — `webflow-for-freelancers-first-client-project` shares more DNA with the `blog` category's peer-freelancer business posts than with the four technical posts it's grouped with. Re-tagging exercise, not new content.
- **[High]** `vibe-coding` category is a single orphaned post with no spokes.
- **[Medium]** `integrations` cluster is missing Zapier and Airtable guides — confirmed active competing content exists for both in 2026.
- **[Medium]** `comparisons` cluster omits Webflow vs Wix (highest-volume, saturated) and Webflow vs Webstudio (lower-competition, better audience fit).
- Best pillar candidate for link-authority consolidation: the **`aeo` cluster** — taxonomy/pillar/spokes already align, and it's a low-competition, high-differentiation topic for a solo freelancer.
- No keyword cannibalization found across all 36 articles.

**Prioritized net-new article opportunities:** (1) Webflow + Zapier integration/comparison — High; (2) Webflow vs Webstudio — High; (3) Webflow vs Wix — Medium; (4) Webflow + Airtable via Make — Medium; (5) a second vibe-coding post to de-orphan that category — Medium.

---

## Methodology Notes / Limitations

- SXO analysis used WebSearch summaries rather than raw SERP scrapes (no verbatim PAA/AI Overview capture); 4 of ~6 planned query patterns analyzed, 1 of 6 case studies fetched in depth.
- CrUX field data unavailable for the entire domain (insufficient Chrome traffic) — all CWV verdicts are lab-only until the site accrues real-user traffic.
- Search Console and GA4 APIs are not authorized in this environment — indexation status and real query/traffic data were not available for this audit; recommend a manual GSC check.
- No Moz/Bing backlink API credentials configured — backlink profile was not analyzed (Common Crawl basic tier only, not run this pass since the domain is too young to have a meaningful crawl footprint).
