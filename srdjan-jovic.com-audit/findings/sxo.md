# Search Experience Optimization (SXO) Findings — srdjan-jovic.com

**SXO Gap Score: 64/100** (separate from the SEO Health Score — this measures how well page format/depth/UX matches what actually ranks and converts for the sampled query intents, not crawlability/technical SEO).

## Method note

This is a SERP-backwards analysis on a representative sample, not a full-site audit. Target pages were fetched live via `curl` (server-rendered Astro HTML, no JS execution needed — confirmed non-SPA) and parsed for title/meta/headings/schema/word count/media. SERP intent was assessed via web search on 4 of the ~6 query patterns in the brief (see Limitations for what was skipped for time).

Queries analyzed:
1. `hire webflow developer for fitness website` — commercial/hire intent → matches homepage + `/case-studies/arni-fitness-zone/`
2. `webflow vs framer for freelancers` — informational/comparison → matches `/resources/webflow-vs-framer-freelancers/`
3. `core web vitals webflow` — informational/technical → matches `/resources/core-web-vitals-webflow/`
4. `webflow developer portfolio` — informational/inspirational (low commercial value) → matches homepage

---

## Finding 1: Comparison article buries its own comparison data in unstructured prose instead of a table

**Severity: CRITICAL**

**Evidence:** `/resources/webflow-vs-framer-freelancers/` is correctly typed as a Comparison Page per the taxonomy (title has "vs", TOC, FAQPage schema, 2,156 words) and the SERP for "webflow vs framer for freelancers" is dominated by exactly this format — competing articles (Gemeos, Flowninja, Veloxthemes, Pravin Kumar's dev blog) structure their comparisons around scannable speed/pricing/use-case breakdowns. But on the target page, the entire "Head to Head Comparison" section — six comparison criteria (design speed, CMS maturity, client editing experience, ecosystem, hiring pool, best-for) each with a Webflow value and a Framer value — is rendered as **one single unbroken `<p>` tag** with no `<table>`, no line breaks, no bold row labels:
> `<h2 id="head-to-head-comparison">Head to Head Comparison</h2><p>WebflowFramerDesign speed for a first draftModerateVery fast, especially with AI toolsCMS maturityHigh...`
Confirmed via `grep -oc '<table'` → **0 tables** anywhere on the page. The "Pricing Comparison" H2 section has the same problem plus a deeper content gap: it never states actual dollar figures for either platform ("comparable entry level pricing... shifts depending on plan tier"), despite the section being titled Pricing Comparison and pricing being one of the most-cited decision factors in this SERP.

**Recommendation:** Convert the Head-to-Head section into an actual `<table>` (or a definition-list styled as a grid) with Webflow/Framer as columns and the six criteria as rows — this is also a featured-snippet/AI-Overview opportunity since table markup is what Google and AI Overviews extract for comparison queries. Add `Table` or `ItemList` structured data. Replace the vague pricing paragraph with real numbers (current Webflow site-plan tiers vs. current Framer plan tiers) in the same table format.

---

## Finding 2: No dedicated page serves "hire webflow developer" — style commercial intent; homepage is thin and generic for that job

**Severity: HIGH**

**Evidence:** The SERP for `hire webflow developer for fitness website` is dominated by marketplace/directory pages (Upwork, Fiverr Pro, Toptal, agency listing pages like MindInventory, Ciphernutz) that lead with rate ranges, reviewer counts, and filterable developer profiles — a Service/Directory hybrid pattern. The site has no page built to compete on that specific shape of intent; the closest analog is the homepage, which is a Landing/Service hybrid with only **642 words** total body copy, one generic CTA repeated three times ("Let's work together" / "let's work together" / "Say hi!"), and no visible process, timeline, engagement model, or rate signal anywhere on the page (rate info exists but is isolated on `/resources/what-i-charge-for-webflow-projects/`, an article, not linked from the homepage services section based on the fetched HTML). A solo portfolio realistically cannot outrank Upwork/Toptal on the head term, but it is currently not even optimized for the winnable long-tail variant ("webflow developer for fitness studios," "webflow developer health and wellness brands") that the site's own case studies (Arni Fitness Zone, health/fitness B2B focus) should own.

**Recommendation:** Either (a) build a dedicated `/services/` or `/hire/` page structured like the taxonomy's Service Page (process/methodology section, "how we work," pricing or rate range, case studies embedded, contact CTA) targeting the niche long-tail ("webflow developer for fitness & health brands"), or (b) expand the homepage Services section with the process + rate-range content already written for `/resources/what-i-charge-for-webflow-projects/` and cross-link it directly from the homepage CTA.

---

## Finding 3: Case study has strong quantified results but no client voice — trust gap for the B2B founder persona

**Severity: MEDIUM**

**Evidence:** `/case-studies/arni-fitness-zone/` correctly follows the Service Page/case-study structure (Overview, Challenge, My Role, Technical Approach, Results, Key Takeaway) and includes real quantified outcomes (200% consultation conversion rate, 75% revenue growth in 3 months) plus 19 images. However, `grep -c 'testimonial'` on this page returns **0** — there is no direct client quote, no attribution to "Arni said...", no linked review. A B2B founder in decision stage (per the persona-scoring framework, this stage weighs Trust heavily) is asked to take Srdjan's own narrative of the results at face value with no third-party corroboration on the page itself, even though the homepage does have video testimonials elsewhere on the site.

**Recommendation:** Pull one of the existing homepage video testimonials (or get a short new one) from Arni specifically and embed it directly in the case study's Results or Key Takeaway section, ideally with `Review`/`AggregateRating` schema alongside the existing `Article`/`Organization` markup already on the page.

---

## Finding 4: Core Web Vitals article has zero visual proof despite competing SERP relying on screenshots/tools

**Severity: MEDIUM**

**Evidence:** `/resources/core-web-vitals-webflow/` is a well-structured Blog Post (2,448 words, 11 H2 sections with descriptive anchor ids, TOC, FAQPage schema, TL;DR block) that includes a section titled "A Real Example, Diagnosing a Slow Client Site." The SERP for `core web vitals webflow` includes agency guides (Finsweet, TheCSSAgency, WeAreBoring) and even a dedicated fix-it tool/service page (websitespeedy.com, framed as "Fix CWV Issues"), all of which lean on screenshots of PageSpeed Insights/Lighthouse scores as evidence. The target article's "real example" section has no PageSpeed/Lighthouse screenshot, no before/after score comparison, and no `<table>` for the three CWV metrics + thresholds (a natural definition-table candidate) — confirmed 0 tables and only 1 body image on the page (same as the comparison article).

**Recommendation:** Add a before/after Lighthouse or PageSpeed screenshot to the "real client site" section, and add a simple 3-row table (Metric / Good threshold / What I check on Webflow) near the top — this doubles as featured-snippet bait for "what is a good LCP score" style sub-queries.

---

## Finding 5: "webflow developer portfolio" is a low-value keyword the homepage is being implicitly measured against — expectation mismatch, not a page defect

**Severity: LOW (informational, not actionable as a fix)**

**Evidence:** SERP for `webflow developer portfolio` is dominated by Webflow.com's own showcase/template gallery, BRIX template marketplace, and Dribbble shots — i.e., people searching this term mostly want inspiration/templates, not to hire a specific person. Individual developer portfolios that do rank (Daniel Quaranta, Derrick.dk) compete on the same personal-brand format the homepage already uses, so no format mismatch exists — this term is just structurally low-commercial-value regardless of on-page quality and shouldn't be a target keyword for conversion-focused optimization.

**Recommendation:** Don't invest further optimization effort chasing this exact phrase; it's noted here only because it was in the brief's sample list. Deprioritize in favor of Finding 2's long-tail niche variants.

---

## Finding 6: Resource category hub pages are thin index shells, undermining topical authority signals for the informational cluster

**Severity: LOW**

**Evidence:** `/resource-category/comparisons/` — the hub that should aggregate and contextualize `webflow-vs-framer-freelancers`, `webflow-vs-nextjs-freelancers`, `webflow-vs-shopify-small-ecommerce`, `webflow-vs-wordpress-small-business`, and `client-first-vs-lumos` — has only **152 words** of body text (essentially a title + one-line description + a dynamic list). For a "vs" content cluster that's competing against agency blogs with dedicated comparison hub/pillar pages, this hub does nothing to reinforce topical authority or internally link the cluster with contextual anchor text.

**Recommendation:** Add a short intro paragraph to each `/resource-category/` hub summarizing when to read which comparison (e.g., "choosing a website platform as a freelancer? Start with Webflow vs Framer if speed matters, Webflow vs WordPress if a client insists on self-hosting…"), turning the hub into a lightweight pillar page rather than a bare CMS list.

---

## SERP Page-Type Consensus Summary

| Query | SERP Dominant Type (taxonomy) | Target Page | Target Type | Mismatch Severity |
|---|---|---|---|---|
| hire webflow developer for fitness website | Directory/Marketplace hybrid (Service Page lite) | Homepage | Landing/Service hybrid | HIGH — right category, insufficient depth, no dedicated page |
| webflow vs framer for freelancers | Comparison Page | `/resources/webflow-vs-framer-freelancers/` | Comparison Page (correct type) | CRITICAL — type is right, table/format execution is wrong |
| core web vitals webflow | Blog Post / Service-tool hybrid | `/resources/core-web-vitals-webflow/` | Blog Post (correct type) | MEDIUM — type correct, evidentiary media missing |
| webflow developer portfolio | Product/Template gallery + individual portfolios | Homepage | Landing/Service hybrid | ALIGNED (low-value keyword, not a real gap) |

---

## User Stories (derived from SERP signals observed above)

1. As a **fitness studio owner evaluating freelancers**, I want to see proof this developer has grown revenue for a business like mine, because I don't have budget to gamble on a redesign that doesn't convert, but I'm blocked by a **trust gap**: the one directly-relevant case study (Arni Fitness Zone) states impressive numbers but has no client quote confirming them. *(Source: Finding 3, quantified results present / testimonial absent)*

2. As a **B2B founder comparing hiring options**, I want a fast way to judge process, pricing range, and fit before booking a call, because directory sites (Upwork/Toptal) already show me rate ranges and reviews upfront, but I'm blocked by **information gap**: the homepage has no visible process/rate-range section, forcing an extra click to a separate blog post to find pricing context. *(Source: Finding 2, SERP dominated by directories showing rates/filters)*

3. As a **fellow developer deciding between Webflow and Framer for a client**, I want to scan a criteria-by-criteria breakdown in seconds, because I'm comparing this article against several others open in other tabs, but I'm blocked by **comparison fatigue made worse by format**: the exact data I need is compressed into one dense paragraph instead of a table. *(Source: Finding 1, competing articles use structured breakdowns; target page uses unstructured prose)*

4. As someone **asking an AI assistant "webflow vs framer, which is cheaper"**, I want a citable, structured answer, because I'm using AI search instead of scrolling ranked pages myself, but I'm blocked by **missing structured data and vague claims**: the Pricing Comparison section gives no actual dollar figures for either platform, making it a weak source for extraction. *(Source: Finding 1, FAQPage schema present but pricing section has no concrete numbers to cite)*

5. As a **freelancer researching Core Web Vitals before a client launch**, I want to see what a real diagnosis looks like, because plain-text advice doesn't tell me what "bad" actually looks like in my own PageSpeed report, but I'm blocked by **lack of visual proof**: the "real client site" section has no screenshot of before/after scores. *(Source: Finding 4, competing SERP results lean on screenshots/tool framing)*

---

## Persona Scoring

| Persona | Journey Stage | Relevance /25 | Clarity /25 | Trust /25 | Action /25 | Total /100 | Rating |
|---|---|---|---|---|---|---|---|
| B2B Founder Hiring (homepage/contact) | Decision | 18 | 14 | 16 | 18 | 66 | Good |
| Fitness/Health Studio Owner (niche hire intent) | Decision | 20 | 15 | 14 | 17 | 66 | Good |
| Fellow Developer / Technical Peer (comparison + CWV articles) | Consideration | 22 | 10 | 18 | 12 | 62 | Good (Clarity is the outlier) |
| AI-Assisted Researcher (LLM/AI Overview seeker) | Awareness/Consideration | 19 | 20 | 14 | 8 | 61 | Good (Action is the outlier) |
| Budget-Conscious Freelancer choosing a platform | Decision | 21 | 13 | 15 | 11 | 60 | Needs Work |

**Weakest dimension across personas: Action (avg 13.2/25) and Clarity (avg 14.4/25).** Every persona hits a CTA that's identical regardless of their journey stage ("Let's work together" appears on the homepage, the case study, and both articles), and the two technical personas are specifically penalized by the same unstructured-comparison-data problem (Finding 1).

**Weakest persona: Budget-Conscious Freelancer choosing a platform (60/100).**
- Top issue: reads a "Pricing Comparison" section that names no prices, then hits a generic bottom-of-page CTA unrelated to the platform-choice decision they just made.
- Recommended fix: add real current pricing figures to the table from Finding 1, and change the article's end CTA from "Let's work together" to something matched to this reader's stage, e.g. "Already sure Webflow's the right call? Here's what a first project with me costs" linking to `/resources/what-i-charge-for-webflow-projects/` or a scoped contact form.

**Priority actions (ordered):**
1. Rebuild the comparison table structure on `/resources/webflow-vs-framer-freelancers/` with real pricing numbers (fixes the Clarity/Action floor for 3 of 5 personas — Finding 1).
2. Add a client testimonial/quote to the Arni Fitness Zone case study (fixes Trust for the two decision-stage hiring personas — Finding 3).
3. Vary the bottom-of-article CTA by content type/persona stage instead of reusing "Let's work together" everywhere (systemic Action gap).
4. Add a visual before/after proof point to the Core Web Vitals article (Finding 4).

---

## SXO Gap Score Breakdown (0–100)

| Dimension | Score | Evidence |
|---|---|---|
| Page-Type Alignment | 11/15 | Blog Post and Comparison Page types correctly match SERP consensus (Findings for queries 2–3); hire-intent has no dedicated Service Page (Finding 2) |
| Content Depth | 10/15 | Articles are appropriately long (2,156–2,448 words); homepage (642 words) and case study (508 words) are thin relative to what commercial-intent competitors show |
| UX Signals | 8/15 | TOC, FAQ accordions, and Cal.com booking are present; but the core comparison data is unscannable prose (Finding 1) and CTAs don't vary by journey stage |
| Schema | 12/15 | BlogPosting, FAQPage, Article, Person, ProfilePage, ContactPage, Organization all present; missing Table/ItemList on comparison content, missing Review/AggregateRating on case studies |
| Media | 6/15 | Case study has 19 images (strong); both sampled long-form articles have only 1 body image, 0 tables, no diagrams despite 2,000+ words each (Findings 1 & 4) |
| Authority | 9/15 | Real author entity with LinkedIn/Instagram sameAs, quantified case-study outcomes; no client testimonial text on case pages, no third-party reviews/press |
| Freshness | 8/10 | `dateModified` current (2026-09-02) on both sampled articles, recent `datePublished` |
| **Total** | **64/100** | |

---

## Limitations

- **WebSearch results, not raw SERP HTML.** Query analysis used the WebSearch tool's synthesized summaries rather than a direct Google SERP scrape, so exact PAA question text, ad copy, related-search chips, and AI Overview citations could not be captured verbatim — user stories above are derived from the aggregate competitor-content patterns visible in search results, which is a reasonable but lower-fidelity proxy.
- **Only 4 of the ~6 query patterns in the brief were analyzed** to stay within the coordinator's time-box. Skipped for time: a niche B2B-specific hire-intent variant (e.g., "webflow developer for B2B saas") and a third informational article (only `webflow-vs-framer-freelancers` and `core-web-vitals-webflow` were sampled in depth; e.g., `client-first-vs-lumos`, `webflow-vs-nextjs-freelancers`, or `what-is-aeo` were not fetched).
- **Only 1 of 6 case studies was fetched and analyzed in depth** (Arni Fitness Zone). Findings about testimonial/quote absence and word count are confirmed only for that page; the other five (Answerlabs, Four Tress Partners, Frontera, Marko Miladinovic, Xerenta) were not individually checked and may differ.
- **No rendered/JS-executed capture was needed** — confirmed via curl that the site is server-rendered Astro HTML with full content in the initial response, not an SPA shell, so this does not affect result validity, but no visual/above-the-fold screenshot comparison was performed.
- **No live PAA/featured-snippet/AI-Overview capture** for any of the four queries — commercial search tooling with real SERP screenshots would materially strengthen Findings 1 and 4.

## Cross-skill references

- Finding 1 (missing Table/ItemList schema) and Finding 3 (missing Review/AggregateRating schema) → recommend `/seo schema` for structured data generation.
- Finding 1's E-E-A-T-adjacent gap (vague pricing claims, no external citations in an opinion-based comparison) → recommend `/seo content` for deeper E-E-A-T analysis.
- Finding 2 (no dedicated hire-intent Service Page) and Finding 6 (thin resource-category hubs) → recommend `/seo page` for page-level audits of a new `/services/` page and the `/resource-category/` templates.

Generate a PDF report? Use `/seo google report`.
