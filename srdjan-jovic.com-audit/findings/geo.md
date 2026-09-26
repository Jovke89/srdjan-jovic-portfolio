# GEO / AI-Search-Readiness Audit — srdjan-jovic.com

Audited: 2026-09-06 · 58 URLs in sitemap · Stack: Astro (SSG) + Sanity CMS, hosted on Vercel

## GEO Health Score: 77 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 82 | 20.5 |
| Structural Readability | 20% | 85 | 17.0 |
| Multi-Modal Content | 15% | 55 | 8.25 |
| Authority & Brand Signals | 20% | 60 | 12.0 |
| Technical Accessibility | 20% | 95 | 19.0 |
| **Total** | | | **76.75 ≈ 77** |

This site is unusual: it is a live case study in its own subject matter (the resource center has articles specifically about AEO, llms.txt, and AI-citable content). Verification confirms it largely practices what it publishes. The main gaps are off-page entity/brand signals and multi-modal schema, not on-page mechanics.

---

## AI Crawler Access Status (live-verified)

Fetched `robots.txt` directly and confirmed it is served correctly (200, `Content-Type: text/plain`, matches the described ruleset exactly) and re-fetched the homepage with each bot's real user-agent string.

| Crawler | robots.txt directive | Live fetch result |
|---|---|---|
| ChatGPT-User | Allow | 200 |
| OAI-SearchBot | Allow | 200 |
| Claude-User | Allow | (not re-tested individually; directive present) |
| Claude-SearchBot | Allow | (directive present) |
| PerplexityBot | Allow | 200 |
| Perplexity-User | Allow | (directive present) |
| FirecrawlAgent / AndiBot / ExaBot / PhindBot / YouBot | Allow | (directives present) |
| Google-Extended | Allow (intentionally not blocked, with an explanatory comment in the file) | — |
| GPTBot | Disallow: / | 200 (server doesn't enforce robots.txt at the network level — this is normal; compliant bots read and honor the directive client-side) |
| ClaudeBot | Disallow: / | 200 (same as above) |
| CCBot, Applebot-Extended, Diffbot, meta-externalagent, Bytespider | Disallow: / | not individually retested, directives present |
| `User-agent: *` | Allow | 200 |

**Finding: Crawler access — Positive / No action needed**
- Severity: Informational
- Evidence: `robots.txt` returns HTTP 200, correct `text/plain` content-type, and the ruleset exactly matches the intended design (citation bots allowed, training bots blocked, Google-Extended deliberately left open). No conflicting `X-Robots-Tag` headers were found on the homepage or robots.txt response.
- Recommendation: None required. Re-check quarterly since AI crawler user-agent strings change (e.g., new OpenAI/Anthropic/Google bot names get added periodically).

---

## llms.txt Status: Present and well-formed

- Severity: Informational (positive)
- Evidence: `https://www.srdjan-jovic.com/llms.txt` returns HTTP 200 with a properly formatted llms.txt (H1 title, blockquote summary, context paragraphs, "Content notes for AI usage" section explicitly telling models not to infer pricing/availability/results, and categorized H2 link sections for Main pages / Case studies / Optional social). This is a stronger-than-average implementation — most sites that have llms.txt at all just dump a flat link list.
- The site has an article specifically about this topic (`/resources/llms-txt-webflow/`), so this was checked as a "practices what it preaches" test: **confirmed, it does.**
- Recommendation: Minor — add the 2 remaining case studies (Marko Miladinović, AnswerLabs) to the llms.txt Case Studies list; currently only 4 of 6 are listed there, and the two omitted ones are also the two without quantified outcome stats (see below), so they're doubly under-surfaced for citation.

## RSL 1.0 Licensing: Absent

- Severity: Low
- Evidence: `/rsl.xml` and `/.well-known/rsl.xml` both return 404. No RSL license declaration found in `<head>` or robots.txt.
- Recommendation: RSL 1.0 is still an emerging/niche standard with low current AI-platform adoption, so this is not urgent. If added, it would let the site declare machine-readable terms (e.g., "citation with attribution OK, no verbatim reproduction") rather than relying on binary robots.txt allow/block. Low priority, revisit in 6–12 months as adoption grows.

---

## Citability Analysis

**Finding: FAQPage schema is used consistently and matches visible content exactly**
- Severity: Informational (positive)
- Evidence: Sampled 6 resource articles across different topics (`what-is-aeo`, `faq-content-that-gets-cited-by-ai`, `llms-txt-webflow`, `measuring-aeo-tracking-ai-citations`, `webflow-cms-structure-ai-search-aeo`, `core-web-vitals-webflow`) — all 6 carry a `FAQPage` JSON-LD block, and in every case the question text in the schema (`mainEntity[].name`) appears verbatim as a visible `<h3>` on the page, with the schema `acceptedAnswer.text` matching the visible paragraph beneath it. No orphaned/invisible schema (a common Google-penalized pattern) was found.
- Recommendation: None needed on the mechanism. Extend the same FAQ pattern to the case study pages, which currently have zero FAQ blocks (0/6 checked) — 2–3 targeted Q&As per case study ("What platform was the client migrating from?", "What was the measured outcome?") would give those pages the same citation surface the articles already have.

**Finding: Strong direct-answer / TL;DR structure at the top of articles**
- Severity: Informational (positive)
- Evidence: `what-is-aeo` opens with a "TL;DR" block containing 4 short, self-contained, directly-stated claims before any narrative content, followed by a table of contents. Question-implying section headers ("What AEO Actually Means", "How Answer Engines Actually Work") front-load the definition in the first sentence, e.g. "Answer Engine Optimization describes the set of practices that help AI systems find, understand, and confidently cite your content..." — this is a directly extractable single-sentence definition, exactly the pattern the article itself recommends.
- Recommendation: None needed, this is a genuine best-practice implementation, not just claimed.

**Finding: Individual paragraphs run shorter than the 134–167 word optimal citation length**
- Severity: Medium
- Evidence: Measured all `<p>` tags on `what-is-aeo` (35 paragraphs over 40 characters): median 59 words, mean 59 words, **0 of 35 paragraphs fall in the 134–167 word range**. Paragraphs are generally 15–90 words. Content is well-structured but chunked finer than the size that citation research associates with maximum extraction/quoting likelihood — a single short paragraph is easy to quote as a fragment but doesn't always give an answer engine a complete, self-contained 140-word passage that stands alone without surrounding context.
- Recommendation: For the highest-priority AEO articles (the ones literally about AEO/citability), test consolidating the opening 2–3 short paragraphs under each H2 into one ~140–160 word self-contained answer block (definition + 1 supporting clause + 1 concrete example), then let shorter paragraphs follow for nuance. Don't do this site-wide — it would hurt readability on narrative content (case studies, blog posts) where short paragraphs are correct.

**Finding: Quantified, citable outcome statistics are present but inconsistent across case studies**
- Severity: Medium
- Evidence: Scanned all 6 case studies for numeric outcome claims. Frontera cites "organic traffic up 200%" and Arni Fitness Zone cites "revenue grew 75% within three months" (visible on-page and echoed in `llms.txt`). Xerenta, 4Tress Partners, Marko Miladinović, and AnswerLabs (4 of 6, i.e. 67%) contain **zero** quantified metrics — no traffic, conversion, speed, or revenue numbers.
- Recommendation: Specific, checkable statistics are exactly what answer engines prefer to quote over generic claims (per the article's own "verifiable, specific claims" guidance). Add at least one concrete, attributable metric to each of the 4 case studies lacking one (page load time improvement, form conversion lift, migration timeline, before/after Lighthouse score — anything numeric and defensible). Effort: Low (content-only change, schema already supports it).

---

## Structural Readability

**Finding: Consistent semantic structure, TOC, byline, and dateModified across articles**
- Severity: Informational (positive)
- Evidence: Every sampled article has: H1, "Category / Time to read / Published on / written by" byline block, a jump-to table of contents built from real H2s, and both `datePublished` and `dateModified` in schema (e.g. `what-is-aeo`: published 2026-08-07, modified 2026-09-02 — an actual freshness signal, not a static date).
- Recommendation: None needed structurally.

**Finding: Body section headings are declarative rather than literal questions**
- Severity: Low
- Evidence: Across 5 sampled articles, H2 counts run 15–16 per article but only 0–1 are phrased as literal questions (e.g. "AEO vs SEO, Where They Overlap and Where They Diverge" vs. a question form). The literal question-form headings are correctly reserved for the FAQ block's H3s, which do match schema.
- Recommendation: Low priority — most of the existing H2s already function as implied-question/definition headers ("What AEO Actually Means," "How Answer Engines Actually Work"), which is an accepted citable pattern, not a violation. Optional: A/B test converting 2–3 of the more topical H2s (e.g. "The Role of Structured Data") into direct questions ("How Does Structured Data Help AI Citation?") on one or two high-traffic articles to see if it changes AI Overview pickup.

---

## Multi-Modal Content

**Finding: `/video/` page exists but carries zero structured data**
- Severity: Medium
- Evidence: `https://www.srdjan-jovic.com/video/` returned 0 JSON-LD blocks (checked via raw HTML fetch), unlike every other page type on the site which has at least one schema block. If this page hosts video content (reels/behind-the-scenes per the Instagram link), it's a missed `VideoObject` schema opportunity, and video is one of the highest-value multi-modal formats for AI Overviews and Perplexity.
- Recommendation: Add `VideoObject` schema (name, description, thumbnailUrl, uploadDate, duration) to the video page. Effort: Low if content already exists, since only markup is missing.

**Finding: No downloadable/structured original data (tables, benchmarks, datasets)**
- Severity: Low
- Evidence: Content reviewed (5 AEO/SEO-focused articles + case studies) is well-written first-person narrative and comparison tables (e.g. SEO-vs-AEO table in `what-is-aeo`), but there is no original benchmark data, downloadable checklist, or reusable dataset that other sites would link to or an AI system would treat as a primary source (as opposed to synthesized advice).
- Recommendation: Medium priority, longer-term: one original data asset (e.g., "I tracked N of my own articles across ChatGPT/Perplexity/Google AIO for 90 days — here's the citation rate by article type") would be a strong, genuinely differentiated citation magnet and ties directly into the existing `measuring-aeo-tracking-ai-citations` article.

**Finding: Images are optimized and properly attributed, but alt text is generic in places**
- Severity: Low
- Evidence: Case study and article images are served via Sanity CDN with `.avif`, `w=1600`, `auto=format` params (good performance practice, consistent with recent perf commits). Alt text sampled (e.g., "GitHub code page showing checkout.js file with Stripe API integration for payment sess...") is descriptive and specific — this is actually good. No systemic issue found.
- Recommendation: None required, maintain current practice for new images.

---

## Authority & Brand Signals

**Finding: Entity data is inconsistent between llms.txt and the homepage ("three years" vs. "four years" of experience)**
- Severity: Medium
- Evidence: `llms.txt`: *"Srdjan Jovic is a Webflow Designer & Developer with more than three years of experience..."* Homepage meta description and visible copy (4 occurrences checked): *"For more than four years I've been building clean, high-performance websites..."*
- Recommendation: Fix immediately — this is a direct, easily-checkable factual contradiction on the two documents most likely to be read together by an AI system building an entity profile (the canonical "about" page and the file specifically written for AI consumption). Pick one number and update the other. Effort: trivial (1-line Sanity content edit + llms.txt edit).

**Finding: `sameAs` entity links limited to LinkedIn and Instagram — no YouTube, Reddit, Wikipedia, or GitHub profile**
- Severity: Medium-High
- Evidence: Checked `Person`/`ProfilePage` schema (homepage) and `Article`/`BlogPosting` author schema (case study + resource article) — `sameAs` arrays contain only `linkedin.com/in/srdjanjovic` and `instagram.com/flowmagiaa`. A "GitHub" hit on the homepage is an alt-text description of a screenshot image, not an actual profile link. No Wikipedia entity, no YouTube channel, no Reddit presence detected anywhere in the on-site link graph.
- Recommendation: Per the brand-mention correlation data (YouTube ~0.737, Reddit high, Wikipedia high, vs. Domain Rating only ~0.266), this is the single highest-leverage gap on the whole site, but it's an off-page effort, not a code fix. Practical, ordered steps: (1) if a GitHub profile exists or is created, add it to `sameAs` immediately (near-zero effort, direct schema fix); (2) consider a modest YouTube presence (screen recordings of Webflow build walkthroughs — this also solves the missing-VideoObject-schema gap above); (3) participate genuinely in r/webflow / r/webdev where relevant with case-study-quality answers (not link-dropping) to build Reddit presence, which LLM training/retrieval corpora weight heavily. Wikipedia is not realistic for a single-freelancer entity and shouldn't be chased directly.

**Finding: Author bio/authority page is thin and (correctly) noindexed — no single indexed page states full credentials**
- Severity: Low
- Evidence: `/authors/srdjan-jovic/` returns `<meta name="robots" content="noindex">` (confirmed against the Sep-5 commit that intentionally noindexed thin taxonomy pages). Content is just an auto-generated list of the author's articles with no bio, credentials, or years-of-experience statement — noindexing it was the right call given the thin content, but it means there is no dedicated indexed "author authority" page; the homepage `Person`/`ProfilePage` schema is currently the only canonical entity statement.
- Recommendation: No urgency to un-noindex the thin page. If anything, consider consolidating a slightly richer author bio (credentials, project count, specializations, the `knowsAbout` list already in schema) directly into the homepage copy, since that's the page carrying the `Person` entity and is indexed — this is largely already done via the current homepage copy, so treat this as confirmation rather than a gap requiring new work.

**Finding: Author schema and byline are present on every content page checked**
- Severity: Informational (positive)
- Evidence: Every article and case study checked (6 resource articles + all 6 case studies) carries `author: { "@type": "Person", "name": "Srdjan Jovic", "url": ..., "sameAs": [...] }` plus a visible on-page "written by: Srdjan Jović" byline. This is a genuine, consistent E-E-A-T signal (author name spelling differs slightly by design — "Jović" with diacritic in visible prose vs. "Jovic" in URLs/schema — which is normal and expected for a Serbian name in an ASCII domain, not flagged as an inconsistency).
- Recommendation: None needed.

---

## Technical Accessibility

**Finding: Fully server-rendered content, zero JS dependency for crawlability**
- Severity: Informational (positive)
- Evidence: Raw `curl` fetches (no JS execution) of the homepage and 5 articles returned full text content — e.g. `what-is-aeo` yielded ~3,071 words of visible body text plus complete FAQ text via a plain HTTP GET. This confirms the Astro SSG output requires no client-side rendering for AI crawlers to read full content, which is the ideal state (equivalent to `is_spa: false` / no CSR gating).
- Recommendation: None needed. Maintain this if any future migration to client-rendered components happens — keep primary content in server-rendered HTML.

**Finding: Sitemap correctly excludes noindexed thin pages, canonical tags correct across page types**
- Severity: Informational (positive)
- Evidence: `sitemap-index.xml` → `sitemap-0.xml` structure is valid. The Sep-5 commit explicitly excludes `/industry/`, `/tech-stack/`, `/authors/`, `/testimonials/` from the sitemap via `astro.config.mjs` filter, matching their noindex meta tags — no crawl-budget-wasting conflicting signals. Canonical tags verified correct and self-referencing on homepage, article, and category pages (e.g. `https://www.srdjan-jovic.com/resources/what-is-aeo`, no trailing slash mismatch).
- Recommendation: None needed.

**Finding: All 34 resource article links are present in raw HTML on the /resources/ index (no infinite scroll / JS-only pagination)**
- Severity: Informational (positive)
- Evidence: Fetched `/resources/` and confirmed all listed article `href`s are present in the raw response body, not injected client-side. No "load more" / infinite-scroll pattern that would hide older articles from crawlers that don't execute JS.
- Recommendation: None needed.

---

## Top 5 Highest-Impact Changes

| # | Change | Dimension | Effort | Impact |
|---|---|---|---|---|
| 1 | Fix "three years" (llms.txt) vs. "four years" (homepage) experience contradiction | Authority | Trivial (1-line edit x2) | Medium — removes a direct, checkable inconsistency AI entity-resolution can penalize |
| 2 | Add quantified outcome stats to the 4 case studies missing them (Xerenta, 4Tress, Marko Miladinović, AnswerLabs) | Citability | Low (content only, schema already supports it) | High — specific numbers are the single strongest citability lever per the site's own AEO article |
| 3 | Add `VideoObject` schema to `/video/` and consider a modest YouTube presence | Multi-Modal + Authority | Medium (schema: low; YouTube channel: ongoing) | High — YouTube has the strongest measured correlation (~0.737) with AI citation likelihood of any signal checked |
| 4 | Extend `sameAs` to include GitHub (if a profile exists) and build genuine Reddit presence in r/webflow / r/webdev | Authority | Low (GitHub) / Medium-High (Reddit, ongoing) | Medium-High — closes the biggest measured gap on the site (currently only LinkedIn + Instagram) |
| 5 | Add 2–3 FAQPage Q&As to each case study page (currently 0/6 have any) | Citability | Low (pattern already built and reused across 34 articles) | Medium — extends the site's most proven mechanism to the page type currently missing it |

---

## Platform-Specific Estimated Scores

These are estimates based on on-page/technical signals only (no live DataForSEO or direct ChatGPT/Perplexity scraping was run in this pass — MCP tools for `ai_optimization_chat_gpt_scraper` / `ai_opt_llm_ment_search` were not invoked).

| Platform | Estimated Readiness | Rationale |
|---|---|---|
| Google AI Overviews | 80/100 | Google-Extended explicitly allowed, strong FAQPage schema (Google's primary AIO input), clean technical SEO fundamentals from recent commits (canonical, noindex hygiene, structured data validation fixes) |
| ChatGPT (OAI-SearchBot / ChatGPT-User) | 78/100 | Explicitly allowed in robots.txt, llms.txt present and well-formed, direct-answer structure strong; capped by thin off-site brand signals (no GitHub/YouTube/Reddit for corroboration) |
| Perplexity | 82/100 | PerplexityBot and Perplexity-User both explicitly allowed, content is fully server-rendered (Perplexity's crawler is known to be JS-averse), FAQ-schema-to-visible-text match is exactly the pattern Perplexity's citation engine favors |
| Bing Copilot | 70/100 | No Bing-specific bot named in robots.txt allow list (relies on the general "Allow: /" catch-all), otherwise same technical fundamentals apply; slightly lower confidence since Bing's crawler behavior wasn't verified against a named UA |

Only ~11% of domains get cited by both ChatGPT and Google AI Overviews simultaneously — this site's dual investment in FAQ schema (Google's preferred format) and llms.txt/direct-answer prose (ChatGPT/Perplexity's preferred format) is a genuinely above-average approach to closing that gap, contingent on the off-page authority fixes above.
