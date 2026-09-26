# Core Web Vitals / Performance Audit — srdjan-jovic.com

Audited: 2026-09-06 (re-measurement pass, following the 2026-09-05 fix pass: card-stacking layout thrashing, deferred hero canvas recompute, deferred GA4 to idle/interaction, image sizing fixes, deferred Cal.com widget on `/contact/`, case-study image-sizing fix)

Tool: `claude-seo run pagespeed_check.py <url> --strategy both --json` (PageSpeed Insights v5 / Lighthouse, lab data). **CrUX field data is unavailable for every URL tested** (origin- and URL-level 404 — "insufficient Chrome traffic volume for eligibility") — all numbers below are single-run Lighthouse lab data, not 75th-percentile field data. Treat lab scores as directional; do not report a pass/fail Core Web Vitals verdict against the official 75th-percentile field thresholds until CrUX has enough traffic.

Pages tested: `/`, `/contact/`, `/case-studies/frontera/`, `/resources/`, `/resources/webflow-structured-data-schema-markup/`, `/events/`. Desktop for the resource article failed twice with a transient PSI API 500 (`PSI API error 500: 500 Server Error: Internal Server Error`) — **not re-tested per instruction to avoid looping on transient errors**; mobile data for that page is complete and reliable.

## Category Score: 83 / 100

Pulled down primarily by one severe regression: `/contact/` mobile Performance actually **dropped** to 68 (from the stated pre-fix baseline of 73) with a 3.2s Total Blocking Time, because the "deferred" Cal.com widget still dumps ~3.6s of mobile main-thread work and 2MB of transfer once it loads. Everything else measured is solid-to-excellent: the case-study template and `/events/` are now essentially best-in-class, and the homepage/resources CLS and LCP fixes are holding. Docked further for a sitewide render-blocking CSS file and a homepage desktop score that measured lower (83) than the stated 92 baseline, worth re-confirming isn't noise.

---

## Critical

### Finding: Cal.com widget on `/contact/` still causes severe main-thread blocking despite "deferred" fix — mobile score regressed below pre-fix baseline
- **Severity:** Critical
- **Evidence:** `/contact/` mobile: **Performance 68** (pre-fix baseline was 73 — this is now *worse*, not better), **Total Blocking Time 3,200 ms**, LCP 1.5s (good), CLS 0.001 (good — the CLS half of commit `cf94605` held). Max Potential FID audit: 910ms. `third-parties-insight` breakdown:
  ```
  cal.com:              transferSize=2,086,893 B   mainThreadTime=3,631 ms  (mobile)
  cal.com:              transferSize=2,086,323 B   mainThreadTime=1,232 ms  (desktop)
  Google Tag Manager:   transferSize=170,694 B     mainThreadTime=371 ms (mobile) / 110 ms (desktop)
  ```
  Desktop fares much better (Performance 87, TBT 270ms) because of the faster CPU throttling multiplier, but the underlying problem (2MB of Cal.com JS/assets executing on the main thread) is identical. `image-delivery-insight` also flags the **same Cal.com host avatar PNG loaded twice** (`https://cal.com/api/avatar/59bca6a3-ff4c-4dc7-a28f-b90c014e248d.png`, ~77KB wasted, duplicated in the network log), suggesting the embed is instantiating more than once or not de-duping a request.
  A TBT of 3.2s on mobile means real users will almost certainly see INP well above the 500ms "poor" threshold the moment they interact with the page while the widget is still initializing — this is the single biggest Core Web Vitals risk on the site, and it sits on the highest-intent page (booking a call).
- **Recommendation:**
  1. Verify the "defer" in commit `cf94605` is actually deferring *execution*, not just *initial paint*. If it's using `requestIdleCallback`/`IntersectionObserver` to inject the Cal.com `<script>` early but the script itself still runs its full bootstrap (loading the embed iframe, fonts, avatar assets) as soon as it's injected, the perceived defer doesn't reduce total main-thread cost — it just changes *when* the 3.6s of blocking work happens (often right as the user starts interacting, which is worse for INP than blocking during initial load).
  2. Load Cal.com **only on user intent**: render a static "Book a call" button/placeholder that swaps in the real Cal.com embed on click or on scroll-into-view with a real intersection threshold (not just idle-callback on page load), so the 2MB payload and its main-thread cost aren't paid until the user actually wants to schedule.
  3. Investigate and fix the duplicate avatar image request — check for the embed being mounted twice (e.g., once in a hidden/preloaded state and once visible).
  4. Re-measure `/contact/` after the fix; target TBT under 200ms mobile (Lighthouse) as a proxy for a real-user INP that stays in the "good" ≤200ms field bucket.

---

## High

### Finding: Render-blocking `BaseLayout.css` delays first paint sitewide, with ~15-17KB (roughly 70%) unused on every page
- **Severity:** High
- **Evidence:** `render-blocking-insight` flags the same file on every page tested, with a consistent mobile penalty of ~300ms and desktop penalty of ~80-120ms:
  ```
  /                                          mobile wastedMs=321   desktop wastedMs=122
  /contact/                                  mobile wastedMs=302   desktop wastedMs=82
  /case-studies/frontera/                    mobile wastedMs=302   desktop wastedMs=82
  /resources/                                mobile wastedMs=152
  /resources/webflow-structured-data-...     mobile wastedMs=164
  /events/                                   mobile wastedMs=303   desktop wastedMs=81
  ```
  `unused-css-rules` consistently reports the same file, e.g. on the homepage: `totalBytes: 22,203`, `wastedBytes: 15,973` (~72% unused on that page); on the resource article `totalBytes: 22,205`, `wastedBytes: 16,549` (~74% unused). Since it's a single global stylesheet shared across every template, no single page uses more than ~30% of it — this is a monolithic-CSS problem, not a per-page issue.
- **Recommendation:**
  1. Split `BaseLayout.css` (or extract per-route critical CSS) so each template only loads the rules it needs. Astro's built-in per-page CSS chunking (scoped `<style>` in `.astro` components, or `astro:assets`/Vite CSS code-splitting) should do this automatically if global styles are currently being imported into one shared layout bundle instead of per-component.
  2. Inline the small amount of truly above-the-fold critical CSS and load the rest with `media="print" onload="this.media='all'"` or a `<link rel="preload" as="style">` swap, so the stylesheet stops blocking first paint entirely.
  3. Expected impact: ~150-320ms LCP/FCP improvement on every page sitewide (biggest relative win on `/events/` and `/case-studies/frontera/`, which are otherwise near-perfect).

### Finding: Homepage desktop Performance measured lower than the stated post-fix baseline — verify it's not a regression
- **Severity:** High
- **Evidence:** Baseline states homepage went "61→93 mobile, 57→92 desktop" after the 2026-09-05 fix pass. This re-measurement: **mobile 93** (matches baseline exactly), but **desktop 83** (9 points below the claimed 92). Desktop lab metrics: LCP 0.8s (good), CLS 0 (good), but **Total Blocking Time 350ms** (score 0.49, "needs improvement" territory) and Max Potential FID 360ms. `mainthread-work-breakdown` on desktop shows Style & Layout at 871ms and "Other" at 807ms — both much higher, proportionally, than the mobile run's 325ms/250ms — and `forced-reflow-insight` is still a **failed** audit on both mobile and desktop for the homepage.
  The forced-reflow finding is notable because the baseline fix pass specifically targeted "layout thrashing in card stacking JS" — the fact that `forced-reflow-insight` still fails post-fix suggests either a different forced-reflow source than the one fixed, or the card-stacking fix only partially addressed the geometry-read-after-write pattern.
- **Recommendation:**
  1. Re-run PSI desktop on the homepage 2-3 more times to rule out single-run noise (lab TBT is often the noisiest lab metric, especially on desktop where the CPU throttle is light and background load on Google's test runners varies more relative to the small absolute times involved).
  2. If desktop TBT/forced-reflow consistently reproduces, use Chrome DevTools Performance panel (or Lighthouse's `forced-reflow-insight` node reference) to find the remaining `offsetWidth`/`getBoundingClientRect()`-after-DOM-mutation call — it's very likely still in the hero canvas or card-stacking interaction code, just not the exact code path the previous fix touched.
  3. Target: desktop TBT under 150ms.

---

## Medium

### Finding: `/resources/` listing has a materially worse desktop TBT than every other page
- **Severity:** Medium
- **Evidence:** `/resources/` desktop: **Performance 81**, **TBT 440ms** (the highest of any page/strategy combination measured), LCP 0.6s (good), CLS 0 (good). Third-party breakdown: Google Tag Manager `mainThreadTime=410ms` on desktop alone — higher than GTM's cost on any other page tested (compare: homepage desktop GTM isn't even in the top third-party list; `/events/` desktop GTM is 211ms). `render-blocking-insight` on this page shows `wastedMs: None` for the CSS entry, an inconsistency in the tool's output worth spot-checking manually.
- **Recommendation:** The listing page likely renders more DOM nodes / card components than other templates, which increases the cost of executing GTM's event-binding and any site scripts that run a full-page query (e.g., `querySelectorAll` over every card). Confirm GA4/GTM initialization isn't re-scanning the DOM per resource card, and consider paginating or lazy-mounting card interactivity below the fold on this template specifically.

### Finding: GA4 (via Google Tag Manager) is a consistent, sitewide 130-410ms main-thread cost once it fires
- **Severity:** Medium
- **Evidence:** GTM's `gtag.js` appears in `third-parties-insight` on every single page tested, with `mainThreadTime` ranging 130-410ms and `unused-javascript` flagging ~72KB of its ~170KB payload as unused on every page (e.g., homepage: `totalBytes: 170,006`, `wastedBytes: 72,799`). Deferring GA4 to idle/interaction (per the baseline fix) correctly keeps it off the LCP critical path (LCP scores are good everywhere), but once it does execute — which Lighthouse's extended trace window still captures — it remains one of the two or three biggest single main-thread cost centers on every page, homepage included (144ms mobile) and is the single largest contributor on `/resources/` desktop (410ms).
- **Recommendation:** This is expected/acceptable for a tag manager and not a new regression, but worth two small hardening steps: (1) confirm GTM is loaded via the async default snippet and not synchronously anywhere, (2) if GA4 doesn't need full GTM container overhead, consider loading `gtag.js` directly (skipping the GTM container fetch) to cut the ~72KB of consistently-unused JavaScript in half.

---

## Confirmed Fixed / Good — no action needed

### Finding: CLS is effectively zero across the entire site
- **Severity:** Info (confirmed fix holds)
- **Evidence:** CLS measured 0 or near-0 on every single page/strategy combination tested: `/` 0 (both), `/contact/` 0.001 mobile / 0.024 desktop, `/case-studies/frontera/` 0 (both), `/resources/` 0 (both), resource article 0, `/events/` 0 (both). This confirms the contact-page CLS fix (commit `cf94605`) and the image-sizing fixes (commits `f34f103` and the earlier homepage pass) are holding in production.
- **Recommendation:** No action. Keep width/height attributes and reserved space enforced as a standing convention for any new image/embed component (per the project's own image-sizing pattern) so this doesn't regress.

### Finding: Case-study template and `/events/` are now near-perfect
- **Severity:** Info (confirmed fix holds / exceeds baseline)
- **Evidence:** `/case-studies/frontera/`: **mobile 91** (up from baseline 82), **desktop 100** (up from baseline 90). LCP 2.2s mobile / 0.5s desktop, TBT 320ms mobile / 60ms desktop, CLS 0 both. `/events/`: **mobile 100, desktop 100**, LCP 1.4s/0.5s, TBT 40ms/60ms, CLS 0 both. The commit `f34f103` image-sizing fix on the case-study template clearly worked and over-delivered versus the stated goal.
- **Recommendation:** No action needed on these templates. The only remaining opportunity on both is the sitewide render-blocking CSS finding above (est. 80-300ms savings), which would push case-study mobile into the high-90s.

### Finding: Resource article page is excellent on mobile
- **Severity:** Info
- **Evidence:** `/resources/webflow-structured-data-schema-markup/` mobile: **Performance 98**, LCP 2.3s, TBT 50ms, CLS 0. Desktop could not be confirmed this run (transient PSI 500 error, not a site issue — retry later). One unrelated accessibility issue surfaced in the same audit run (`color-contrast` failing on body text and a newsletter modal input, contrast ratio as low as 1.47:1) — flagging for the accessibility findings owner, not a performance item.
- **Recommendation:** No performance action needed on this template beyond the sitewide CSS fix. Re-run desktop PSI on this URL when convenient to close out the one untested cell.

---

## Summary Table (Lab Data — Lighthouse via PSI v5, single run each)

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
| `/resources/webflow-structured-data-schema-markup/` | Desktop | not tested (PSI 500, transient) | — | — | — |
| `/events/` | Mobile | 100 | 1.4s | 40ms | 0 |
| `/events/` | Desktop | 100 | 0.5s | 60ms | 0 |

Note: CrUX field data returned "no data" (insufficient traffic volume) for every URL and the origin itself, so none of the above can yet be verified against the official 75th-percentile Core Web Vitals thresholds — treat as lab-only until field data accrues.
