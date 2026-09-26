# Technical SEO Findings — srdjan-jovic.com

Audit date: 2026-09-06
Crawl seed: `srdjan-jovic.com-audit/sitemap-urls.txt` (58 URLs), spot checks of noindexed dynamic routes (`/industry/`, `/tech-stack/`, `/authors/`, `/testimonials/`) and two sitemap-listed dev/leftover pages (`/style-guide/`, `/video/`).
Tools used: `render_page.py` (raw fetch, no forced JS render), `sitemap_discovery.py`, `pagespeed_check.py` (PSI Lighthouse + CrUX), direct `curl` header/status checks, repo source inspection (`astro.config.mjs`, `src/lib/seo/site.ts`, `src/components/seo/BaseHead.astro`, `src/pages/style-guide.astro`, `src/pages/video.astro`, dynamic route templates).

**Category score: 74/100**

---

## What works

- `robots.txt` (`public/robots.txt`) is well structured: allows AI answer/citation bots (ChatGPT-User, PerplexityBot, Claude-User, etc.), blocks AI training crawlers (GPTBot, CCBot, Bytespider, etc.), leaves `Google-Extended` unblocked intentionally, allows `User-agent: *`, and declares `Sitemap: https://www.srdjan-jovic.com/sitemap-index.xml`.
- Sitemap passes validation: `sitemap_discovery.py --json` confirms the robots.txt-declared sitemap resolves (`sitemap-index.xml` → `sitemap-0.xml`, HTTP 200, `valid: true`, `kind: sitemapindex`), and all 58 URLs sampled from `sitemap-urls.txt` return HTTP 200.
- HTTPS is enforced site-wide: `http://` and non-`www` requests 308-redirect to `https://www.srdjan-jovic.com`, and `Strict-Transport-Security: max-age=63072000` is sent on every response checked.
- The four intentionally-thin taxonomy templates (`src/pages/industry/[slug].astro`, `tech-stack/[slug].astro`, `authors/[slug].astro`, `testimonials/[slug].astro`) all set `noindex: true` in `BaseLayout`/`BaseHead`, and none of the sampled pages (`/`, `/case-studies/frontera/`, `/resources/what-is-webflow/`) link to them — correctly orphaned, noindexed, and excluded from the sitemap filter in `astro.config.mjs`.
- Structured data is present per template type: `Person`/`ProfilePage` on the homepage, `Article`/`Organization` on case studies, `FAQPage`/`BlogPosting` on resources, `Event`/`Place` on the events page, `ContactPage` on `/contact/`. The previously-fixed invalid `review[]` JSON-LD (commit `2d69ad1`) was checked on `/case-studies/frontera/` and does not appear — no `Review`/`AggregateRating` types present, fix confirmed still in place.
- All sampled content pages are plain server-rendered HTML (`render_page.py` reports `is_spa: false`, `mode_used: raw`) — no JavaScript-rendering dependency for indexable content, good for crawl reliability.
- Viewport meta (`width=device-width, initial-scale=1`) present on every page checked; PSI mobile Lighthouse Accessibility score is 100.
- No hreflang tags found anywhere sampled — correct, since the site is single-market/English-only and needs none.
- 404 handling returns a real HTTP 404 (`https://www.srdjan-jovic.com/this-page-does-not-exist-xyz` → `404 Not Found`), not a soft-404.

---

## Findings

### 1. Systemic canonical URL / actual-URL mismatch (trailing slash) — High

**Evidence:** `canonicalFor()` in `src/lib/seo/site.ts` always strips the trailing slash (`.replace(/\/$/, '')`), but the site is built with `build.format: 'directory'` (`astro.config.mjs`), which serves every non-root page at a trailing-slash URL, and the sitemap lists trailing-slash URLs exclusively (e.g. `<loc>https://www.srdjan-jovic.com/case-studies/</loc>`). Confirmed on multiple templates:

- `/case-studies/` serves canonical `<link rel="canonical" href="https://www.srdjan-jovic.com/case-studies">` (no slash).
- `/video/` serves canonical `href="https://www.srdjan-jovic.com/video"` (no slash).

Critically, **both URL forms are live and return identical 200 content with no redirect either direction**:
```
GET https://www.srdjan-jovic.com/case-studies   -> 200, Content-Length: 42130
GET https://www.srdjan-jovic.com/case-studies/  -> 200, Content-Length: 42130 (same ETag content)
```
This means every indexed page (57 of 58 sitemap URLs; homepage is the only exception since root has no path to strip) declares a canonical that points to a *different, non-redirecting* URL than the one actually being crawled/indexed via the sitemap. Google generally resolves this correctly via signal consolidation, but it is a self-referencing-canonical failure by definition and creates two crawlable duplicate URLs per page with no authoritative redirect between them.

**Recommendation:** Pick one canonical URL shape and make the other actually redirect to it (don't rely on Google to dedupe). Simplest fix given `format: 'directory'`: change `canonicalFor()`/`absUrl()` in `src/lib/seo/site.ts` to preserve the trailing slash (matches sitemap output, matches Astro's actual serving behavior) — e.g. build `SITE_URL + clean + '/'` instead of stripping it. Alternatively, keep canonicals without the slash but add a Vercel-level redirect from `/path/` → `/path` (more invasive, breaks the `format: 'directory'` contract already relied on for `/contact/index.html`-style URLs). Preserving the slash in the canonical is the lower-risk change.

### 2. `/video/` is indexable, has no noindex, no meta description, and a generic unbranded title — High

**Evidence:** `src/pages/video.astro` renders via `BaseLayout seo={{ title: 'video', description: undefined }}` — no `noindex` flag at all (contrast with `style-guide.astro`, which does set `noindex: true`). Live check confirms:
```
<title>video</title>
<link rel="canonical" href="https://www.srdjan-jovic.com/video">
(no <meta name="robots"> tag present)
(no <meta name="description"> tag present)
```
The page body is just two autoplaying/looping background `<video>` elements (leftover Webflow-export testimonial video showcase) with effectively no extractable text — `render_page.py`'s heuristic even flags it as `is_spa: true` because there is so little text content in the raw HTML. The URL is also present in the live sitemap (`sitemap-0.xml` contains `/video/`). This is a fully indexable, thin, unbranded page that can surface in search with a bare "video" title and no description, and dilutes overall site content-quality signals.

**Recommendation:** Set `noindex: true` on `video.astro` (matching the pattern already used on `style-guide.astro`) and remove it from the sitemap via the existing `astro.config.mjs` sitemap `filter` (add `!page.includes('/video')`), unless this page is meant to be a real, linked, indexable asset — in which case give it a real title, meta description, and on-page text content instead.

### 3. `/style-guide/` is noindexed but still submitted in the sitemap — Medium

**Evidence:** `src/pages/style-guide.astro` correctly sets `noindex: true`, confirmed live: `<meta name="robots" content="noindex">` on `https://www.srdjan-jovic.com/style-guide/`. However it is **not** excluded by the `sitemap()` filter in `astro.config.mjs` (which only excludes `/studio`, `/401/`, `/404/`, `/industry/`, `/tech-stack/`, `/authors/`, `/testimonials/`), and `curl https://www.srdjan-jovic.com/sitemap-0.xml` confirms `style-guide` is present in the live sitemap. This is the exact conflicting-signal pattern ("noindex page submitted in sitemap") Google Search Console flags under Indexing > Excluded, and wastes crawl budget on a Finsweet/Webflow Client-First style-guide export page with zero search value.

**Recommendation:** Add `!page.includes('/style-guide')` (and `/video` per Finding 2) to the sitemap `filter` in `astro.config.mjs`, consistent with how `/industry/`, `/tech-stack/`, `/authors/`, `/testimonials/` are already handled.

### 4. Two-hop redirect chain from bare apex HTTP to canonical host — Medium

**Evidence:**
```
curl -I http://srdjan-jovic.com/
  -> 308 Location: https://srdjan-jovic.com/
curl -I https://srdjan-jovic.com/
  -> 308 Location: https://www.srdjan-jovic.com/
```
`curl -L -w "num_redirects:%{num_redirects}"` on a test path confirms 2 redirects before reaching the final `https://www.` URL. This is a Vercel domain-level redirect chain (no `vercel.json` in the repo controls this), not an application-level issue, but it's an extra network round-trip for any crawler or user hitting the bare non-HTTPS apex, and a longer chain than necessary (ideally apex HTTP → www HTTPS in one hop).

**Recommendation:** In the Vercel project's Domains settings, point the apex domain redirect directly at `https://www.srdjan-jovic.com` instead of chaining through `https://srdjan-jovic.com` first. Low effort, removes one hop.

### 5. No hardening security headers beyond HSTS — Medium

**Evidence:** Headers captured via `curl -D -` on `/`, `/resources/`, `/case-studies/frontera/`, `/robots.txt`, and `/sitemap-index.xml` are consistent and include only `Strict-Transport-Security: max-age=63072000`. None of the following are present on any page checked: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options` (or `frame-ancestors`), `Referrer-Policy`, `Permissions-Policy`. (PSI's Lighthouse "Best Practices" score is 100/100, but that audit does not fully check for CSP/X-Frame-Options presence — it's not a substitute for a manual header review.) Also note the HSTS value lacks `includeSubDomains` and `preload`.

**Recommendation:** Add security headers via Vercel config (`vercel.json` `headers` block, since Astro static output has no server middleware) for at least `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Frame-Options: DENY` (or an equivalent `frame-ancestors 'none'` CSP directive). Extend HSTS to `max-age=63072000; includeSubDomains; preload` once subdomain HTTPS coverage is confirmed. Not urgent for rankings directly, but closes an easy trust/security gap and is a standard technical-audit line item.

### 6. Core Web Vitals: LCP and TBT flagged in lab data (mobile) — High

**Evidence:** `pagespeed_check.py --strategy mobile` on `https://www.srdjan-jovic.com/`:
- Performance score: 69/100
- LCP: 3.06s (lab) — **Needs Improvement** band (>2.5s threshold)
- Total Blocking Time: 1,222ms — very high; TBT this large typically correlates with **Poor** INP once field data accrues (INP good threshold is ≤200ms)
- CLS: 0 (lab) — **Good**
- Time to Interactive: 4.83s
- Diagnostics: main-thread work 4.6s (score 0), JS execution/bootup time 2.0s (score 0), "Est savings of 103 KiB" from unused JavaScript, "Est savings of 43 KiB" from image delivery, 9 long main-thread tasks detected, "Max Potential First Input Delay" flagged at 990ms (a legacy Lighthouse diagnostic audit name — do not confuse with the retired FID field metric; treat this as a TBT/INP-risk signal, not FID reporting)
- CrUX field data: **not yet available** — `crux_history.py`/`--crux-only` returns `"error": "No CrUX data for this origin. The site likely has insufficient Chrome traffic volume for eligibility."` This is expected and consistent with the known ~2-day-old GSC/traffic ramp context; not a new issue, but flag that once traffic accrues, the current lab-measured TBT/LCP puts the site at real risk of a Poor/Needs-Improvement INP and LCP field verdict if unaddressed.

**Recommendation:** Reduce main-thread JS work before real-user traffic ramps: audit third-party/embedded scripts (Cal.com booking widget was already deferred per commit `cf94605` — verify no other blocking third-party scripts remain), code-split or defer non-critical JS bundles, and address the 103 KiB of unused JavaScript and 43 KiB of deferrable image bytes PSI identified on the homepage. Re-run `pagespeed_check.py` after changes and monitor CrUX via `crux_history.py` once the origin becomes eligible.

### 7. No IndexNow integration — Low

**Evidence:** No IndexNow key file (`/<key>.txt` at site root) or IndexNow submission call found in the repo (`grep -ri indexnow` across `.ts/.js/.astro/.json` returns nothing), and no key file is served from `public/`.

**Recommendation:** Since the site already publishes a clean sitemap and has a content-publishing workflow (Sanity webhook → rebuild), adding an IndexNow ping on publish (Bing/Yandex/Naver) is low effort and would speed up discovery of new `/resources/` and `/case-studies/` pages beyond what sitemap crawling alone provides. Not urgent given Google is the primary target engine, but a cheap win.

### 8. Sitemap has no `<lastmod>` values — Low

**Evidence:** `sitemap-0.xml` contains 58 `<url>` entries, 0 `<lastmod>` elements (`grep -c "<lastmod>"` = 0), despite pages having real, varying `Last-Modified` HTTP headers (e.g. `/case-studies/frontera/` shows `Last-Modified: Sun, 06 Sep 2026 09:08:20 GMT`, `/resources/` shows a different, older timestamp).

**Recommendation:** Configure `@astrojs/sitemap`'s `serialize` option to emit `lastmod` from each page's known content-update timestamp (Sanity's `_updatedAt` field is a natural source here). Not critical — Google largely relies on its own crawl/recrawl signals — but it's a low-cost improvement for freshness signaling on the resources/blog section.

### 9. Resource-category hub pages carry no structured data — Info

**Evidence:** `/resource-category/blog/` returns `structured_data.block_count: 0` (no JSON-LD at all), while every other template checked (home, case study, resource article, event, contact) has at least one JSON-LD block.

**Recommendation:** Informational only — full schema strategy is owned by the schema specialist. Flagging that these taxonomy/hub pages are the one template family with zero structured data, worth a `CollectionPage`/`ItemList` recommendation from that review.

---

## Category summary

| Sub-area | Status |
|---|---|
| Crawlability (robots.txt, sitemap, noindex) | Pass with 2 conflicts (Findings 2, 3) |
| Indexability (canonicals, duplicates) | Fail — systemic canonical/trailing-slash mismatch (Finding 1) |
| Security (HTTPS, headers) | Partial — HTTPS enforced, hardening headers missing (Finding 5) |
| URL structure / redirects | Pass with inefficiency (Finding 4) |
| Mobile-friendliness | Pass |
| Core Web Vitals (lab) | Needs Improvement (Finding 6) |
| Structured data (presence only) | Pass, one gap (Finding 9) |
| JS rendering | Pass (SSG, no CSR dependency) |
| IndexNow | Not implemented (Finding 7) |
| hreflang | N/A — correctly absent, single-market site |

**Overall Technical SEO score: 74/100** — solid crawlability/robots/sitemap/SSG foundation and confirmed structured-data presence, held back primarily by the site-wide canonical/trailing-slash inconsistency (Finding 1), two dev-leftover pages leaking into the public sitemap (Findings 2–3), and mobile CWV lab metrics (LCP 3.1s, TBT 1.2s) that risk a Poor field-data verdict once the domain accrues enough CrUX traffic.
