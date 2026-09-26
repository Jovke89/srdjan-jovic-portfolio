# Structured Data / JSON-LD Audit — srdjan-jovic.com

Audited: 2026-09-06
Source of truth read directly: `src/lib/seo/jsonld.ts`, `src/lib/seo/site.ts`
Live pages fetched and parsed (raw HTML, curl, JSON-LD extracted + `json.loads` validated):
`/`, `/contact/`, `/case-studies/`, `/case-studies/frontera/`, `/case-studies/answerlabs/`, `/case-studies/arni-fitness-zone/`, `/case-studies/four-tress-partners/`, `/case-studies/marko-miladinovic/`, `/case-studies/xerenta/`, `/resources/`, `/resources/webflow-structured-data-schema-markup/` (+ 35 more resource articles checked for FAQPage prevalence), `/events/`, `/events/flowconf-2026/`, `/resource-category/webflow/`.

Site is Astro with server-rendered (build-time) JSON-LD via `<script slot="jsonld">` — no client-side injection, so raw HTML == rendered HTML for schema purposes. Playwright rendering was not needed.

## Category Score: 80 / 100

Solid architecture (single `@context: https://schema.org`, absolute URLs everywhere, ISO 8601 dates on articles, correct conditional emission of FAQPage only when FAQ content exists, `@graph` used correctly for BlogPosting+FAQPage, prior Review/aggregateRating cleanup verified still clean). Docked mainly for one broken required property on Event, a full page-type with zero structured data despite being indexable, and sitewide FAQPage markup that no longer earns any Google rich result.

---

## Confirmed Clean (no action needed)

### Finding: No Review/aggregateRating JSON-LD anywhere on the live site
- **Severity:** Info (confirmed fix holds)
- **Evidence:** `grep` for `"@type":"Review"` and `aggregateRating` across the homepage, `/case-studies/`, all 5 case-study detail pages, `/resources/`, a resource article, `/events/`, and the event detail page returned zero matches in any JSON-LD block. The one hit for the string "Review" (in `resources/webflow-structured-data-schema-markup/`) is prose text discussing FAQ/Review schema misuse, not a JSON-LD type.
- **Recommendation:** No action. Commit `2d69ad1` (removal of `review[]` from ProfilePage and case-study-list JSON-LD) is verified live and stable. Do not re-add a `review` array to `ProfilePage`/`ItemList`/`WebPage` without an `aggregateRating` and a valid parent type (`Product`, `LocalBusiness`, `Organization`, `Recipe`, etc.) — those are the only types Google accepts for review-snippet rich results.

---

## Critical

### Finding: Event JSON-LD emits `startDate: ""` — invalid required property
- **Severity:** Critical
- **Evidence:** Live `/events/flowconf-2026/` JSON-LD:
  ```json
  {
    "@type": "Event",
    "name": "flowConf",
    "startDate": "",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    ...
  }
  ```
  Root cause traced to `src/pages/events/[slug].astro`: `startDate: event.startDate ?? undefined` passed into `buildEventLd()`, and in `src/lib/seo/jsonld.ts` (`buildEventLd`) the field is built unconditionally as `startDate: opts.startDate || ''`. The Sanity schema (`src/sanity/schemaTypes/documents/event.ts`) does have a proper `startDate` datetime field, but it is not populated for the flowConf-2026 document — only the free-text `year` field is filled in and shown in the UI (`InfoRow label="year:"`).
  `startDate` is a **required** property for Google's Event rich result. A present-but-empty string fails validation exactly the way empty `datePublished` used to fail on BlogPosting (that case was already fixed with a conditional `...(opts.datePublished ? {...} : {})` pattern — `buildEventLd` was never given the same treatment).
- **Recommendation:**
  1. Populate `startDate` in Sanity for `flowConf-2026` (and any future event documents) — this is a content gap, not just a code gap.
  2. Fix `buildEventLd` in `src/lib/seo/jsonld.ts` to omit `startDate` entirely when empty, matching the pattern already used for `datePublished`/`dateModified` in `buildBlogPostingWithFaqLd`:
     ```js
     ...(opts.startDate ? { startDate: opts.startDate } : {}),
     ```
     This prevents a future event created without a date from shipping invalid Event markup again.
  3. Same guard is worth applying to `image: opts.imageUrl || ''` in the same function — currently safe because the one live event has a cover image, but it will silently emit an empty string the day an event is published without one.

---

## Medium

### Finding: `/resource-category/[slug]/` pages ship zero JSON-LD
- **Severity:** Medium
- **Evidence:** `/resource-category/webflow/` returns `0` matches for `application/ld+json` in the raw response (confirmed against `src/pages/resource-category/[slug].astro`, which passes only `{ title, description }` into `BaseLayout` — no `jsonld` slot is populated at all, unlike every other list/detail template in the site).
  These 7 taxonomy pages (`aeo`, `blog`, `comparisons`, `integrations`, `make-automations`, `seo`, `vibe-coding`, `webflow`) were explicitly kept indexable in commit `2d69ad1` ("stays indexable as a real topic hub"), so this isn't a case of intentionally thin/noindexed pages — it's a genuine gap versus the rest of the site's schema coverage.
- **Recommendation:** Add a `CollectionPage` block, mirroring `buildResourcesListLd`'s shape (same pattern already used for `/resources/` and `/events/`):
  ```json
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Webflow — Webflow & automation resources",
    "description": "Webflow articles and guides from Srdjan Jovic, a Webflow developer and Make automation specialist.",
    "url": "https://www.srdjan-jovic.com/resource-category/webflow",
    "inLanguage": "en",
    "isPartOf": { "@type": "CollectionPage", "@id": "https://www.srdjan-jovic.com/resources" },
    "hasPart": [
      { "@type": "Article", "@id": "https://www.srdjan-jovic.com/resources/<slug>", "headline": "…" }
    ]
  }
  ```
  Add a `buildResourceCategoryLd()` builder in `jsonld.ts` (reuse the `hasPart` article-stub shape from `buildResourcesListLd`) and wire it into `src/pages/resource-category/[slug].astro`.

---

## Info (no SERP benefit, no urgent risk)

### Finding: FAQPage present on every checked resource article — no Google rich-result benefit
- **Severity:** Info
- **Evidence:** Checked all 36 fetched `/resources/[slug]/` pages (everything except the `/resources/` index itself) — all 36 currently emit an `FAQPage` block inside the `@graph` alongside `BlogPosting` (e.g. `/resources/webflow-structured-data-schema-markup/` has 6 Q&A pairs, correctly structured with `Question`/`acceptedAnswer`/`Answer`). Google retired FAQ rich results for all sites on 2026-05-07, so this markup no longer produces a SERP feature for any of these pages. The code's conditional emission (`if (opts.faqs.length > 0)`) is correct engineering — the issue is purely that the entire category of markup is now inert for Google, not that it's implemented wrong.
- **Recommendation:** Not urgent — this is inert, not broken, and costs only a small amount of page weight. Two options, pick based on appetite:
  1. Leave as-is if there's a working assumption that AI answer engines (ChatGPT, Perplexity, ChatGPT/Claude browsing, etc.) still parse FAQPage for citation context — this is plausible given the site's AEO focus (see `/resources/faq-content-that-gets-cited-by-ai/`, `/resources/what-is-aeo/`) but is **unconfirmed**, not a guaranteed benefit.
  2. If simplifying is preferred, stop emitting `FAQPage` for new articles and rely on the visible on-page FAQ content alone (which AI crawlers can already read without JSON-LD).
  Either way: do not add `FAQPage` under the belief it will produce a Google SERP rich result — it will not.

### Finding: Case-study "about" Organization applied to an individual person client
- **Severity:** Info
- **Evidence:** `/case-studies/marko-miladinovic/` uses the same `Article.about` shape as every other case study:
  ```json
  "about": { "@type": "Organization", "name": "Marko Miladinovic", "description": "Marko Miladinovic is a graphic designer working with clients around the world on branding and logo design.", "url": "https://www.markodesigns.com/" }
  ```
  Marko Miladinovic is described in the copy itself as an individual freelance graphic designer, not a company — tagging him `Organization` is a minor type mismatch (schema.org would call for `Person` here).
  All other case studies (Frontera, Arni Fitness Zone, Four Tress Partners, Xerenta, Answerlabs) are genuine companies, so `Organization` is correct for those five.
- **Recommendation:** Low priority since it carries no rich-result risk (Article's `about` property isn't itself a rich-result trigger). If touching `jsonld.ts`/`buildArticleLd` anyway, accept an optional `clientOrg.type` (`'Organization' | 'Person'`) so the one-off individual client can be typed correctly.

### Finding: `hasPart` Article stubs on `/resources/` list page omit `url`
- **Severity:** Info
- **Evidence:** Every item in `resources.html`'s `CollectionPage.hasPart` array has `@id` (absolute URL) but no separate `url` property, e.g.:
  ```json
  { "@type": "Article", "@id": "https://www.srdjan-jovic.com/resources/what-is-vibe-coding", "headline": "…", "author": {...}, "image": "…", "articleSection": "…" }
  ```
  `@id` functions as an identifier, not necessarily a dereferenceable `url` in the strictest schema.org sense, though in practice Google and most consumers treat them interchangeably when `@id` is a real HTTPS link (as it is here). Not a validation failure, just not textbook-complete.
- **Recommendation:** Optional: add `"url": "<same value as @id>"` in `buildResourcesListLd`'s `hasPart.map()`. Low value since these are reference stubs, not standalone rich-result targets — the full `Article`/`BlogPosting` markup living on each article's own page is what Google actually evaluates for rich results.

---

## Missed Opportunities (schema not currently used)

### Opportunity: BreadcrumbList — not recommended yet, no matching UI
- **Severity:** N/A (do not implement now)
- **Evidence:** `grep -ri "breadcrumb\|crumb"` across `src/` returned zero matches — there is no visible breadcrumb trail component anywhere on the site (case-study detail, resource article, or resource-category pages all lack an on-page breadcrumb nav).
- **Recommendation:** Do **not** add `BreadcrumbList` JSON-LD without a matching visible breadcrumb UI — Google's structured-data guidelines require markup to reflect visible page content, and a breadcrumb-only-in-JSON-LD with no on-page equivalent risks a manual-action-style mismatch flag. If a breadcrumb UI is ever added to `/case-studies/[slug]/`, `/resources/[slug]/`, or `/resource-category/[slug]/`, add `BreadcrumbList` at the same time, e.g.:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Resources", "item": "https://www.srdjan-jovic.com/resources" },
      { "@type": "ListItem", "position": 2, "name": "Webflow Structured Data: Adding Schema Markup the Right Way", "item": "https://www.srdjan-jovic.com/resources/webflow-structured-data-schema-markup" }
    ]
  }
  ```

### Opportunity: Service schema for the freelance offering
- **Severity:** Low
- **Evidence:** `grep -rn "Service\|LocalBusiness\|Offer" src/lib/seo/jsonld.ts` returned nothing — the site has no `Service`/`Offer` markup anywhere, despite `/contact/` and the homepage both being built around "hire me for a Webflow project" intent (copy: "Get in touch about a Webflow project, a migration or a custom build. I work with health, fitness and B2B companies from Figma handoff to launch.").
- **Recommendation:** Optional addition to `ContactPage` (or a new standalone block) describing the freelance service, provider referencing the existing `Person`:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Webflow Development",
    "provider": { "@type": "Person", "name": "Srdjan Jovic", "url": "https://www.srdjan-jovic.com" },
    "areaServed": "Worldwide",
    "audience": { "@type": "Audience", "audienceType": "Health, fitness and B2B companies" },
    "description": "Webflow design and development, Figma-to-Webflow handoff, CMS architecture, custom code, API and Make.com automation integrations."
  }
  ```
  Do not use `LocalBusiness` unless a real, disclosable business address exists — a freelancer without a public storefront/office should stick to `Person` + `Service`, not fabricate a `PostalAddress`.

---

## Validation Summary by Page Type

| Page | @type(s) | @context correct | Required props present | Issues |
|---|---|---|---|---|
| `/` | ProfilePage + Person | ✅ | ✅ | None — Review array confirmed absent |
| `/contact/` | ContactPage + Person | ✅ | ✅ | None |
| `/case-studies/` | WebPage + ItemList + CreativeWork + Person | ✅ | ✅ | None — Review array confirmed absent |
| `/case-studies/[slug]/` (5 checked) | Article + Organization + Person + ImageObject | ✅ | ✅ | Marko Miladinovic typed `Organization` not `Person` (Info) |
| `/resources/` | CollectionPage + Article (stubs) + Person | ✅ | ✅ | `hasPart` Article stubs missing `url` (Info) |
| `/resources/[slug]/` (36 checked) | BlogPosting + Blog + FAQPage + Question + Answer + WebPage + Person | ✅ | ✅ | FAQPage present on 36/36 — no Google SERP benefit anymore (Info) |
| `/events/` | CollectionPage + Event + Person + ImageObject | ✅ | ✅ | None at list level |
| `/events/[slug]/` | Event | ✅ | ❌ `startDate` empty string | **Critical** |
| `/resource-category/[slug]/` | — none — | N/A | N/A | **Medium** — zero JSON-LD despite being an indexable topic hub |

No deprecated types found anywhere (no HowTo, no SpecialAnnouncement, no CourseInfo/EstimatedSalary/LearningVideo). All JSON-LD uses `https://schema.org`, absolute URLs, and ISO 8601 dates (aside from the empty-string `startDate` defect above).
