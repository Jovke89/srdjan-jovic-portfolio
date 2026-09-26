# Google Field Data (CrUX) Check — srdjan-jovic.com

Audited: 2026-09-06
Scope: Supplements the separate lab-data Performance audit (`performance.md`). This check queries Google's own field-data and identity APIs directly (PageSpeed Insights v5 + Chrome UX Report API + CrUX History API) rather than running Lighthouse locally, to determine whether real-user (RUM) Core Web Vitals exist for this domain yet, and to confirm which Google APIs are currently authorized for this project.
Tool: `claude-seo` scripts — `google_auth.py --check`, `pagespeed_check.py <url> --json`, `crux_history.py <origin> --origin --json`.
Credential tier: **Tier 0 (API key only)** — PageSpeed Insights v5 and CrUX API are authorized. Search Console API, Indexing API, and GA4 Data API are **not authorized** (no OAuth token or service account configured).

---

## Findings

### Finding: No CrUX field data exists yet for this domain — origin, homepage, and `/contact/` all return "insufficient traffic"
- **Severity:** Info (expected for a young, low-traffic site; not a defect)
- **Evidence:** Queried CrUX directly at three levels, all returned the same eligibility error:
  - Origin-level, current period (`pagespeed_check.py` embedded CrUX call for `https://www.srdjan-jovic.com`): `"error": "No CrUX data for this origin. The site likely has insufficient Chrome traffic volume for eligibility."`
  - URL-level, `/contact/`: `"error": "No CrUX data for this URL. The site likely has insufficient Chrome traffic volume for eligibility."`
  - Origin-level, 40-week history (`crux_history.py --origin`): `"error": "No CrUX history data for this origin. Insufficient Chrome traffic volume for eligibility."`

  CrUX only publishes a data point for an origin/URL once it clears Chrome's minimum-sample eligibility threshold over a rolling 28-day window. A domain needs a sustained base of real Chrome users visiting it before Google will surface 75th-percentile LCP, INP, and CLS numbers — this is independent of and unrelated to the GSC property being ~2 days old; it is a function of actual Chrome traffic volume, which for a young solo-portfolio site is very plausibly still below the reporting floor.
- **Recommendation:** No action needed on the site itself — this is not fixable by a code or config change, only by real-user traffic accumulating over time. Re-run this same CrUX check in 4-6 weeks (`claude-seo run crux_history.py https://www.srdjan-jovic.com --origin --json`); once eligible, this will produce actual 75th-percentile field CWV numbers to validate (or correct) the lab-data findings in `performance.md`. Until then, treat the PSI/Lighthouse lab data in the Performance audit as the only available performance signal, and do not report a pass/fail Core Web Vitals verdict against the official field-data thresholds — lab data is directional only and commonly optimistic relative to real-world conditions (varied devices, network conditions, and real user interaction patterns that Lighthouse's synthetic run doesn't reproduce).

### Finding: Search Console API and GA4 Data API are not authorized — CrUX/PSI is the only currently-automatable Google data source
- **Severity:** Medium
- **Evidence:** `google_auth.py --check --json` reports Tier 0 only:
  ```
  "gsc":     { "available": false, "error": "No OAuth token or service account found..." }
  "ga4":     { "available": false, "error": "No OAuth token or service account found..." }
  "indexing":{ "available": false, "error": "No OAuth token or service account found..." }
  ```
  This means indexing status, query/impression/click data, URL Inspection results, and organic-traffic-by-landing-page cannot be pulled programmatically for this audit. Per prior session context, the GSC property itself is also only ~2 days old, so even with credentials configured, GSC performance data would be too sparse to be meaningful yet (Search Console typically needs 2-3 weeks of history for query/page data to stabilize, separate from the CrUX eligibility issue above).
- **Recommendation:**
  1. For now, perform indexation and query-visibility checks manually in the Search Console web UI (Coverage/Indexing report, URL Inspection tool, Performance report) rather than via API — this doesn't require any credential changes and can be done today.
  2. If ongoing automated Google-API audits are wanted going forward, configure a service account (or OAuth) per `google_auth.py --auth --creds /path/to/client_secret.json`) to unlock Tier 1 (GSC + URL Inspection) and, if a GA4 property exists for this domain, Tier 2 (organic traffic and landing-page reports). This is a one-time setup step, not something this audit can do on its own.
  3. Re-check GSC data in ~3 weeks once the property has enough history for query/page totals to be reliable (per the `totals_complete` safeguard in the GSC tooling — do not sum anonymized low-volume query rows as a site-wide total before then).

---

## Data Freshness Notes

- **CrUX (field data):** 28-day rolling window; not yet eligible for this domain at any level tested (origin, homepage, `/contact/`, or historical). Re-check periodically as traffic grows.
- **PSI/Lighthouse (lab data):** Single-run synthetic measurement, already covered in depth in `performance.md`. Available and used as the interim signal.
- **GSC:** API not authorized; manual UI checks recommended in the interim; even once authorized, expect incomplete/low-confidence data for the first ~2-3 weeks given the property's age.
- **GA4:** API not authorized; tier/property status unconfirmed.

## Report Generation

A PDF/HTML report was not generated for this sub-check since there is no field data yet to visualize (CrUX returned empty on all three queries) and Tier 0 only supports the CWV-audit report type, which is better run once actual field data exists in ~4-6 weeks. Recommend regenerating this check (and, at that point, a `cwv-audit` report via `google_report.py`) once CrUX eligibility is met, so the report can show real 75th-percentile LCP/INP/CLS trend charts instead of an empty-data placeholder.
