# Content Quality / E-E-A-T Audit — srdjan-jovic.com

**Category Score: 74 / 100**

Methodology note: pages were rendered with `render_page.py` (raw HTML, `mode=auto`). The `--json` summary's `extracted_text` field truncates to a short snippet on this site's article template (it only captured the "TL;DR" bullet block, ~80-90 words), which would have produced a false "thin content" reading. Word counts and heading structure below were instead computed from the full saved HTML body for each sampled page, which is the accurate basis for this report.

---

## What Works (do not regress)

- **Long-form articles are genuinely comprehensive, not thin.** Sampled glossary/comparison pages run 2,100–3,645 words of real body copy (e.g. `what-is-webflow` = 3,645 words across 18 H2s, `what-is-seo` = 3,270 words / 18 H2s, `webflow-vs-wordpress-small-business` = 3,093 words / 17 H2s). This clears the 1,500-word blog-post floor by 1.5–2.5x.
- **Clean single-H1 hierarchy on articles.** Every sampled resource page has exactly one H1 matching the page's topic (e.g. `<h1>What Is AEO, and How Is It Different From SEO?</h1>`), followed by a logical H2 ladder (TL;DR → concept explainer → comparison/FAQ → "My Honest Recommendation" → Related Posts), then H3 FAQ blocks (9 per page on most articles).
- **Genuine first-hand experience signals**, which is exactly what Sept 2025 QRG rewards over generic AI phrasing: section headers like "What I Tell Clients Before They Commit" (`what-is-webflow`), "A Real Example, A Client Who Almost Chose Wrong" (`webflow-vs-nextjs-freelancers`), and whole posts built around a single incident — `client-project-taught-me-to-say-no` (2,531 words) and `one-month-into-this-resource-center` are reflective, dated, specific narratives that a templated AI content mill would not produce.
- **The glossary cluster interlinks itself correctly.** `what-is-webflow`, `what-is-seo`, `what-is-aeo`, and `what-is-make` all cross-link each other contextually inside body copy (confirmed via outbound `/resources/` hrefs on each page), which mitigates cannibalization risk — Google sees them as a connected cluster around one topic, not four pages fighting for the same query.

---

## Findings

### 1. All 8 resource-category hub pages carry a templated, near-duplicate meta description
**Severity: High**

Evidence — the description tag on every single hub follows the identical pattern with only the category name swapped:
- `/resource-category/aeo/` → "AEO articles and guides from Srdjan Jovic, a Webflow developer and Make automation specialist."
- `/resource-category/blog/` → "Blog articles and guides from Srdjan Jovic, a Webflow developer and Make automation specialist."
- `/resource-category/comparisons/` → "Comparisons articles and guides from Srdjan Jovic, a Webflow developer and Make automation specialist."
- `/resource-category/integrations/`, `/resource-category/make-automations/`, `/resource-category/seo/`, `/resource-category/vibe-coding/`, `/resource-category/webflow/` all match the same template.

This matches the prior session's note that these pages got unique `<title>` tags but no custom description field — confirmed still outstanding. Google's guidelines flag templated boilerplate repeated across a set of pages as a duplicate-content/low-value signal, and it wastes the SERP snippet opportunity on all 8 hubs simultaneously.

**Recommendation:** Write one genuinely distinct 150–160 character description per hub in Sanity (what the category covers, who it's for, roughly how many articles), not a mail-merge template. This is a single CMS field edit per hub, low effort.

### 2. Resource-category hub pages are thin on unique on-page copy and have no real heading structure below the H1
**Severity: Medium-High**

Evidence: stripped-body word count for the hub pages (excluding article-card teaser text) is only 143–148 words, and the *only* H2 detected on any hub page is `"Say hi! Let's talk"` — which is the sitewide footer CTA repeated on every page of the site, not category-specific content. There is no intro paragraph under the H1 explaining what the category covers, no H2/H3 sub-structure unique to the hub itself. `resource-category/vibe-coding/` is the extreme case: it lists exactly one article (`what-is-vibe-coding`), so the hub is essentially an empty shell around a single card.

**Recommendation:** Add a 100–200 word intro under each hub H1 (what the category is, who should read it, 1–2 internal links to the flagship article in that category) so each hub clears a reasonable topical-coverage floor and stops being interchangeable with its siblings except for the swapped noun. For `vibe-coding`, either hold the category page until 2–3 articles exist or fold it into the `webflow` or `blog` category until then to avoid a near-empty archive page being indexable.

### 3. Case studies do not link to any resource articles — a missed topical-authority and AI-citation link
**Severity: Medium**

Evidence: the `/case-studies/frontera/` page (a WordPress-to-Webflow migration with a Make → Bullhorn CMS sync, per its own meta description) contains 22 total links on the page and **zero** of them point to `/resources/` or `/resource-category/`. Given the site has directly relevant articles — `automating-client-onboarding-webflow-make-crm`, `webflow-google-sheets-make-automation`, `webflow-301-redirects-migration-9b582` — this case study is a natural place to link out to the methodology articles that back up the claims made in "Technical Approach," but it doesn't.

**Recommendation:** Add 1–2 contextual links from each case study's "Technical Approach" / "Results" section to the matching how-to article in `/resources/`. This strengthens topical clusters (case study = proof, article = methodology) and gives AI answer engines a clearer entity graph between the freelancer's proof-of-work and his documented expertise.

### 4. Comparison articles share an identical structural skeleton across all four "webflow-vs-X" pages
**Severity: Low**

Evidence: `webflow-vs-framer-freelancers`, `webflow-vs-nextjs-freelancers`, `webflow-vs-shopify-small-ecommerce`, and `webflow-vs-wordpress-small-business` all use the same H2 sequence almost verbatim: `TL;DR → [Core difference] → Head to Head Comparison → [worked scenario] → Pricing Comparison → My Honest Recommendation → Related Posts`. The Sept 2025 QRG explicitly lists "repetitive structure across pages" as a marker to check for low-quality AI content. In this case the underlying content per section is specific and non-generic (real pricing figures, named worked scenarios, distinct recommendations per platform), so this reads as an intentional editorial template rather than AI filler — but the repetition is still detectable and worth being deliberate about.

**Recommendation:** No urgent fix needed since the content itself is differentiated, but vary at least one or two section headers per article (skip "Head to Head Comparison" wording on one, rename "My Honest Recommendation" on another) so the pattern isn't identically fingerprinted across all four pages, and so future comparison articles (there is room for `webflow-vs-squarespace`, `webflow-vs-wix`, etc.) don't compound the pattern.

### 5. Interlinking gap for `what-is-vibe-coding` inside the glossary cluster
**Severity: Low**

Evidence: `what-is-webflow`, `what-is-seo`, `what-is-aeo`, and `what-is-make` all cross-link each other in-body. `what-is-vibe-coding` only links out to `what-is-make`, `webflow-hubspot-integration`, `webflow-stripe-integration`, and `why-i-document-my-webflow-work` — it never links to (or is linked from, based on the sampled pages) `what-is-seo`, `what-is-webflow`, or `what-is-aeo`. It sits one hop outside the otherwise well-connected glossary cluster.

**Recommendation:** Add a contextual link from `what-is-vibe-coding` to at least `what-is-webflow` (natural tie-in: "vibe coding vs. building in Webflow directly") and get one of the four core glossary pages to link back to it, so the cluster is fully meshed rather than a 4+1 shape.

### 6. Publication dates cluster tightly in a 5-day window immediately before this audit
**Severity: Low / Informational**

Evidence: sampled articles show `htmldate`-detected publication dates of 2026-09-01 through 2026-09-05 (`case-studies/frontera` = 2026-09-01, most `what-is-*` and `webflow-vs-*` articles = 2026-09-02/03, `what-is-vibe-coding` = 2026-09-05, `client-project-taught-me-to-say-no` = 2026-09-03), against an audit date of 2026-09-06. Visible byline dates in-body also show "Aug 20xx" / "Sep 20xx" for the same pages. This is consistent with a genuinely new resource center (the site itself has a reflective post titled `one-month-into-this-resource-center`), which is a good authenticity signal, but if all 36+ articles show original-publish dates this tightly clustered, it can visually resemble a bulk content drop rather than an evolving publication. The category hub pages (`resource-category/*`) all report a flat `2026-01-01` date, which reads as a placeholder/fallback rather than a real "last updated" value.

**Recommendation:** No content problem here, just a freshness-signal hygiene item: make sure "last updated" (distinct from original publish date) is wired up and displayed for articles that get revised later, so freshness signals stay meaningful as the archive grows past this initial launch window. Fix the `2026-01-01` fallback date on the 8 hub pages, either suppress date display on archive/listing pages entirely (they're not articles) or drive it from the newest article in that category.

### 7. Author bio / credentials block not confirmed present in visible article body
**Severity: Medium**

Evidence: every sampled page carries an "author" signal, but on inspection this consistently traces to the `<meta name="author">` / JSON-LD `Person` schema tag rather than a visible in-body author bio block (name, credentials, photo, "X years building in Webflow") near the byline or at the end of the article. The homepage's own JSON-LD does expose `Person`/`Occupation`/`ProfilePage` types, and the first-person voice throughout is strong, but a QRG rater scanning the article page itself may not find an explicit, skimmable expertise/credentials block without scrolling to a global footer or an About page.

**Recommendation:** Add a short, consistent author bio component under the H1 or above the "Related Posts" block on every resource article — name, one line of concrete credentials ("Webflow developer since [year], N client projects, agency X"), and a link to a full About/credentials page. This is a low-cost, high-signal E-E-A-T fix given the content itself already demonstrates real expertise; it just needs to be visibly attributed on-page, not only in schema.

---

## E-E-A-T Breakdown (internal scoring model)

| Factor | Weight | Score | Notes |
|---|---|---|---|
| Experience | 20% | 85/100 | Strong: dated first-person incident posts, "what I tell clients," named worked scenarios, a public "what I charge" post — rare and valuable specificity for a freelancer site. |
| Expertise | 25% | 78/100 | Technically accurate, detailed comparison content (pricing, handoff, maintenance tradeoffs); docked for no visible in-body author bio/credentials block (Finding 7). |
| Authoritativeness | 25% | 62/100 | No external citations, backlink, or third-party recognition signals observed in sampled pages; authority currently rests entirely on self-published case studies and articles, not yet corroborated externally. |
| Trustworthiness | 30% | 75/100 | Contact page present with clear scheduling CTA and scope-setting copy; HSTS header present; no privacy policy/terms link observed in sampled footers — worth a targeted check outside this content pass. |

**Weighted E-E-A-T score ≈ 74/100**, consistent with the overall category score — the drag comes from hub-page thinness/duplication and unverified authority/bio signals, not from the core article writing, which is above average for this page type.

## AI Citation Readiness

Strong: every sampled article opens with a "TL;DR" bulleted summary block, uses clear H2/H3 hierarchy, and closes with an FAQ-style H3 block (9 FAQ-style H3s per article observed) — this is close to ideal structure for answer-engine extraction. `measuring-aeo-tracking-ai-citations` and `faq-content-that-gets-cited-by-ai` indicate the author is deliberately optimizing for this. Gap: the 8 category hub pages have no extractable body content at all (143-148 words, one shared H2), so they are effectively non-citable, and case studies (Finding 3) aren't cross-referenced with the methodology content that would make claims independently verifiable to an AI crawler.

**AI citation readiness score: 80/100** (articles) / **20/100** (category hubs) — blended **~68/100** across the full 58-page set given hubs and case studies are 14 of the 58 URLs.
