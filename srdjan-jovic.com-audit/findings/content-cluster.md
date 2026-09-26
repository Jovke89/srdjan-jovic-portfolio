# Semantic Content Cluster / Hub-and-Spoke Audit — srdjan-jovic.com

Audited: 2026-09-06
Scope: `/resources/` (36 articles) + 8 `/resource-category/*` taxonomy pages.
Method: full article inventory cross-referenced against `sitemap-urls.txt`, live-fetched all 8 category archive pages to confirm actual article-to-category mapping, live-fetched 4 representative articles to inspect real in-body internal links (not just the archive listing), and ran targeted competitive searches for candidate gap keywords (`webflow zapier integration`, `webflow airtable integration`, `webflow vs webstudio`, `webflow vs wix`, `what is seo`, `what is webflow`) to confirm real-world demand and competition level before recommending net-new articles. Given the site's scale (36 posts, solo author), this is a qualitative SERP-pattern and gap analysis rather than a full 30x30 pairwise SERP-overlap matrix — that overhead isn't justified at this size.

## Category Score: 68 / 100

The site already does something most solo blogs don't: it has topical archive pages *and* real, hand-written contextual internal links inside article bodies that consistently route authority toward five definitional "what is X" posts regardless of which category the linking article lives in. That's a genuinely good instinct. It's held back by three structural issues: the five glossary posts have no dedicated hub of their own (they're scattered one-per-category, so the pattern is invisible in the nav/IA even though it exists in prose), two categories (`webflow`, `blog`) are audience-mixed catch-alls rather than semantic clusters, and the `vibe-coding` category is a single orphaned post with no spokes at all. The `aeo` and `integrations` categories are the strongest examples of real hub-and-spoke thinking already in place.

---

## Article Inventory by Category (ground truth, live-fetched)

| Category | Count | Articles |
|---|---|---|
| `aeo` | 5 | what-is-aeo, faq-content-that-gets-cited-by-ai, measuring-aeo-tracking-ai-citations, webflow-cms-structure-ai-search-aeo, llms-txt-webflow |
| `comparisons` | 5 | webflow-vs-framer-freelancers, webflow-vs-nextjs-freelancers, webflow-vs-shopify-small-ecommerce, webflow-vs-wordpress-small-business, client-first-vs-lumos |
| `integrations` | 5 | webflow-memberstack-integration, webflow-calendly-integration, webflow-stripe-integration, webflow-mailchimp-integration, webflow-hubspot-integration |
| `make-automations` | 5 | automating-webflow-cms-backups-make, automating-client-onboarding-webflow-make-crm, webflow-form-submissions-slack-make, webflow-google-sheets-make-automation, what-is-make |
| `seo` | 5 | webflow-sitemap-robots-txt, webflow-structured-data-schema-markup, core-web-vitals-webflow, webflow-301-redirects-migration, what-is-seo |
| `webflow` | 5 | webflow-localization-multilingual-sites, webflow-memberships-sunset-alternative, webflow-interactions-and-animations, webflow-for-freelancers-first-client-project, what-is-webflow |
| `vibe-coding` | 1 | what-is-vibe-coding |
| `blog` | 5 | client-project-taught-me-to-say-no, what-i-charge-for-webflow-projects, one-month-into-this-resource-center, auditing-client-existing-webflow-site, why-i-document-my-webflow-work |

Total: 36. Matches sitemap count. Every category page is a bare card-grid archive (title, author, read time) with **no intro/pillar copy and no spoke-to-spoke links on the archive page itself** — confirmed by direct fetch of `/resource-category/aeo/`. All cross-linking happens inside article body text instead.

---

## Critical

*(none — no cannibalization, no duplicate primary-keyword targeting found across the 36 posts)*

### Finding: No keyword cannibalization detected
- **Severity:** Info (confirmed clean, listed here for completeness since it's a required check)
- **Evidence:** Reviewed all 36 titles/slugs for overlapping primary intent. The closest pairs (`webflow-vs-shopify-small-ecommerce` vs `webflow-vs-wordpress-small-business`, `webflow-structured-data-schema-markup` vs `core-web-vitals-webflow`) target distinct competitor/topic combinations with no shared primary keyword. No two posts compete for the same query.
- **Recommendation:** No action needed now. When adding the net-new articles recommended below, keep each to one clearly distinct head term (e.g. don't let a future "webflow vs wix" post also try to rank for "webflow vs webstudio").

---

## High

### Finding: The five "what is X" glossary posts form a real cluster but have no hub — they're invisible as a group in the IA
- **Severity:** High
- **Evidence:** `what-is-aeo`, `what-is-seo`, `what-is-webflow`, `what-is-vibe-coding`, `what-is-make` are split one-each across five different `/resource-category/` pages (aeo, seo, webflow, vibe-coding, make-automations) with no shared category, no glossary index, and no page that lists them together. Yet live-fetched article bodies show the site is *already* treating them as a cluster in practice: `webflow-vs-framer-freelancers` links to both `what-is-webflow` and `what-is-seo`; `webflow-calendly-integration` links to both `what-is-webflow` and `what-is-make`; `what-is-seo` itself links to `what-is-aeo` and `what-is-webflow`; `faq-content-that-gets-cited-by-ai` links to `what-is-aeo`. These five posts are functioning as de facto cross-cluster pillars purely through organic in-body linking, but the taxonomy gives them zero reinforcement (no dedicated archive, no "start here" glossary page, no way for a new visitor to discover all five as a set).
- **Competitive context:** Searched `what is seo definition` and `what is webflow definition` — both are dominated by Wikipedia, Google Search Central, Semrush, Search Engine Land, and Webflow's own domain. A solo freelancer's individual glossary post has near-zero odds of ranking page 1 for the bare definitional query standalone. Their real value is (a) AEO/LLM-citation surface area (short, extractable definitions — which this site already optimizes for per its own AEO cluster) and (b) internal link equity distribution, not organic SERP competition on the head term.
- **Recommendation:** Create a lightweight glossary index (either a new `/resource-category/glossary/` taxonomy value applied to all five, or a static `/resources/glossary/` page) that lists and links all five "what is X" posts together, and add a "See also" or "Glossary" module to each of the five posts linking to the other four. This costs zero new articles, formalizes a pattern that's already proving itself in the content, and gives the glossary set the internal-link concentration it currently only gets by accident.

### Finding: `webflow` category is an audience-mixed catch-all, not a semantic cluster
- **Severity:** High
- **Evidence:** The `webflow` category bundles `webflow-localization-multilingual-sites` (technical implementation, targets clients/other builders), `webflow-memberships-sunset-alternative` (news/timely, targets anyone affected by the Memberships shutdown), `webflow-interactions-and-animations` (technical showcase), `what-is-webflow` (definitional, broadest possible audience), and `webflow-for-freelancers-first-client-project` (business/practice advice aimed at *other freelancers*, not end clients). That last post shares far more topical and audience DNA with the `blog` category's `what-i-charge-for-webflow-projects`, `auditing-client-existing-webflow-site`, and `why-i-document-my-webflow-work` (all peer-freelancer business-practice content) than with the four technical posts it's currently grouped with.
- **Recommendation:** Split into two real clusters: keep `webflow` as the technical/product cluster (what-is-webflow as pillar, localization/interactions/memberships-sunset as spokes), and pull `webflow-for-freelancers-first-client-project` out to join a new or relabeled "Freelance Business" cluster alongside the relevant `blog` posts (what-i-charge-for-webflow-projects, auditing-client-existing-webflow-site, why-i-document-my-webflow-work, client-project-taught-me-to-say-no). `one-month-into-this-resource-center` can stay meta/blog since it's about the resource center itself, not freelance practice. This is a re-tagging exercise, not new content.

### Finding: `vibe-coding` category is a single orphaned post — no spoke reinforcement possible
- **Severity:** High
- **Evidence:** `what-is-vibe-coding` is the only article in its category. A one-post "cluster" cannot receive spoke-to-pillar internal links from within its own silo, so all of its topical authority has to come from other clusters linking in — which is a weaker signal than a real hub-and-spoke structure with 2-4 spokes.
- **Recommendation:** See net-new article recommendation #5 below (de-orphan with one companion post before investing further in this angle).

---

## Medium

### Finding: `integrations` cluster is missing the two most commonly targeted companion integrations
- **Severity:** Medium
- **Evidence:** Current spokes cover Memberstack, Calendly, Stripe, Mailchimp, HubSpot. Searched `webflow zapier integration guide` — returned active, current (2026) competing articles from flow.ninja, rsacreativestudio, shadowdigital.cc, loudface.co, and ammo.studio, all using near-identical title patterns to this site's existing integration posts. Searched `webflow airtable integration` — returned Zapier, Webflow's own PowerImporter marketplace listing, and Whalesync as active competitors. Both are real, currently-targeted keywords in the exact niche this cluster already occupies, and both are structurally easy wins since the site already has the exact template (a practical setup guide) proven across 5 existing posts.
- **Recommendation:** See net-new article recommendations #1 and #4 below.

### Finding: `comparisons` cluster omits the two most-searched Webflow alternatives
- **Severity:** Medium
- **Evidence:** Current spokes cover Framer, Next.js, Shopify, WordPress, and a naming-convention comparison (Client-First vs Lumos). Searched `webflow vs wix freelancers comparison` — this is one of the single most heavily contested comparison pairs in the entire Webflow content space (9+ active competing articles from bullet.so, websiteplanet, wix.com itself, creativecorner.studio, websitebuilderexpert, litextension, pixeto.co, uistudioz, thatwebflowagency, all dated 2026), meaning it's an expected/default comparison a visitor researching "Webflow vs X" content would look for but not find here. Searched `webflow vs webstudio comparison` — also actively covered by 7+ agency/freelancer blogs as of 2026 (lowcode.agency, wmtips, gemeosagency, efficient.app, createtoday.io, sanjeewa.works), but is a newer, lower-competition, more differentiated topic (Webstudio is the open-source, developer-oriented Webflow alternative) that better matches this author's more technical positioning and is easier to actually rank for than the saturated Wix comparison.
- **Recommendation:** See net-new article recommendations #2 and #3 below.

---

## Low

### Finding: Category archive pages carry no pillar copy or spoke-to-spoke links of their own
- **Severity:** Low
- **Evidence:** Live fetch of `/resource-category/aeo/` returned only a page title and 5 bare article cards — no intro paragraph, no synthesized overview, no links between the articles at the archive-page level. All actual hub-and-spoke linking happens inside individual article bodies instead (confirmed across 4 sampled articles, each carrying 2-4 contextual internal links).
- **Recommendation:** Low priority given the in-body linking already does the heavy lifting. If revisited, add 2-3 sentences of synthesized intro copy to each category page (what the cluster covers, who it's for) — this also gives each archive page unique, indexable content instead of being a pure duplicate-pattern template across all 8 categories, which has minor thin-content upside for the category pages themselves.

---

## Best Pillar Candidate for Internal-Link Authority Consolidation

**`aeo` cluster, anchored by `what-is-aeo`.**

Reasoning:
1. It's the only cluster where the taxonomy, the pillar candidate, and the spokes already line up perfectly — all 5 posts live in the same category, and `what-is-aeo` is the natural broad/definitional pillar for `faq-content-that-gets-cited-by-ai`, `measuring-aeo-tracking-ai-citations`, `webflow-cms-structure-ai-search-aeo`, and `llms-txt-webflow`.
2. It's a genuinely low-competition, emerging topic. Unlike `what is seo` or `what is webflow` (dominated by Wikipedia/Google/Semrush/Webflow-proper), "AEO" content has far less entrenched authority to out-rank, meaning link equity concentrated here has a realistically higher ROI on actual rankings.
3. It's the strongest differentiation angle for a solo Webflow freelancer positioning against generic competitors — AI-search/answer-engine readiness is a forward-looking topic that doubles as a business-development signal, not just an SEO exercise.
4. `integrations` is the runner-up (also tightly coherent, decent commercial intent) but its 5 topics are semantically loose relative to each other (Stripe payments and Calendly booking share little topical overlap beyond "third-party tool + Webflow"), so authority consolidated there has less compounding value than AEO's tighter conceptual cluster.

---

## Net-New Article Opportunities (prioritized, 5 max)

1. **"Webflow + Zapier Integration" (or "Webflow Automation: Zapier vs Make.com for Freelancers")** — Priority: High. Closes the single clearest gap in the `integrations` cluster (confirmed active competing content, see Medium finding above) and, if framed as a comparison rather than a pure how-to, doubles as a bridge post between `integrations` and `make-automations` — two clusters that currently don't cross-link at all. Strong authenticity angle given the author's existing Make.com specialization.
2. **"Webflow vs Webstudio for Freelancers"** — Priority: High. Timely (2026), lower-competition than the Wix pairing, matches the technical/developer-oriented audience this site already writes for, and completes the `comparisons` cluster with a topic actively being covered by peer agencies right now.
3. **"Webflow vs Wix for Small Business / Solo Founders"** — Priority: Medium. Highest-volume, most-expected comparison pairing missing from the cluster, but heavily saturated (9+ active competitors) — worth doing for completeness/topical coverage of the cluster rather than as a quick-win ranking bet.
4. **"Webflow + Airtable Integration (via Make)"** — Priority: Medium. Parallels the existing `webflow-google-sheets-make-automation` post almost exactly, confirmed active competing demand, and reinforces the `integrations`/`make-automations` bridge started by #1.
5. **A second `vibe-coding` post** (e.g. "Using AI Coding Agents Inside a Webflow Freelance Workflow" or "Vibe Coding vs Custom Code in Webflow: When Each Makes Sense") — Priority: Medium. De-orphans the single-post `vibe-coding` category so it can function as an actual hub-and-spoke cluster instead of a standalone page with no internal spoke reinforcement.

---

## Validation Summary

| Check | Result |
|---|---|
| Category-hub structure matches real SERP/topic clustering | Partial — `aeo`, `integrations`, `make-automations`, `comparisons`, `seo` are coherent; `webflow` and `blog` are audience-mixed catch-alls; glossary cluster exists in practice but not in taxonomy |
| Cannibalization across 36 posts | None found |
| Every cluster has a plausible pillar | 7 of 8 yes; `vibe-coding` has no cluster (single post) |
| In-body internal linking present | Yes, confirmed on all 4 sampled articles (2-4 contextual links each), consistently routing to the 5 glossary posts |
| Archive/category pages contain pillar copy or spoke links | No — bare card grids on all 8 checked |
| Gaps vs. active competitor content confirmed via search | Yes — Zapier integration, Airtable integration, Webflow vs Webstudio, Webflow vs Wix all confirmed as actively targeted by competing content in 2026 |
