# Manual findings (collected directly, outside subagents)

1. **[Medium] Orphan utility pages indexable and in sitemap**: `/video/` and `/style-guide/` are leftover Webflow-export scaffold pages (Finsweet Client-First style guide reference; raw video test page). Neither is linked from any navigation (confirmed via grep across src/) — both are true orphans. `/style-guide/` correctly sets `noindex` in its template (`src/pages/style-guide.astro`) but is NOT excluded from the sitemap filter in `astro.config.mjs` (conflicting signal — same class of bug already fixed for `/industry/`, `/tech-stack/`, `/authors/`, `/testimonials/`). `/video/` has NO noindex, NO meta description, and a lowercase generic `<title>video</title>` — fully indexable thin content in the public sitemap.
   Fix: add `!page.includes('/style-guide')` and `!page.includes('/video')` to the sitemap filter in `astro.config.mjs`; add `noindex: true` to `video.astro`'s SEO prop (or delete the page entirely if it serves no purpose — it isn't linked anywhere).

2. **[Low] Homepage meta description over length**: 185 characters (recommended ≤160, ideally ~120-155). Will truncate in SERP snippet.

3. **[Low] 3 case-study meta descriptions slightly over 160 chars**: `/case-studies/arni-fitness-zone/` (163), `/case-studies/four-tress-partners/` (166), `/case-studies/xerenta/` (163). Minor truncation risk, likely templated from a shared field pattern.

4. **[Low] 2 resource-category titles over ~65 chars**: `/resource-category/integrations/` (66) and `/resource-category/make-automations/` (70). Borderline for SERP pixel-width truncation.

5. **[Info, confirmed clean]** No duplicate `<title>` tags across all 58 sitemap URLs. All canonical tags are absolute, self-referencing, and trailing-slash-consistent with the sitemap URL. H1 count = 1 on all sampled key page types (home, case study, resource article, contact).
