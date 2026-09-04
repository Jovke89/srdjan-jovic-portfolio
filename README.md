# srdjan-jovic-portfolio

Portfolio site of Srdjan Jovic (Webflow developer), migrated from Webflow to
**Astro 7** + **Sanity** (headless CMS), deployed on **Vercel**.

## Stack

- Astro 7 (static output) + `@astrojs/vercel`
- Sanity embedded Studio at `/studio` (`@sanity/astro`)
- GSAP + Lenis for the ported Webflow interactions
- The 3 original Webflow CSS files, kept verbatim (`src/styles/webflow/`)

## Local development

```bash
npm install          # run from this folder
cp .env.example .env  # fill in the values
npm run dev           # http://localhost:4321  (Studio at /studio)
npm run build
```

## Environment variables

See `.env.example`. `SITE_URL` drives canonical URLs, absolute OG images and every
JSON-LD `url`/`@id` — set it to the production domain.

## Content

Sanity project `jhuyq5eb`, dataset `cms-data-base`. Schema in `src/sanity/schemaTypes/`.
Deploy schema changes with `npx sanity schema deploy`; regenerate types with
`npx sanity typegen generate`.

The one-off Webflow CSV import lives in `sanity/migrations/` (`node --env-file=.env sanity/migrations/run.ts`).

## Structure

```
src/
├── components/     shared UI (Nav, Footer, cards, SEO, ...)
├── layouts/        BaseLayout
├── lib/
│   ├── sanity/     client, image, portable text, GROQ queries
│   └── seo/        JSON-LD builders, canonical helpers
├── pages/          routes (index, case-studies, resources, events, ...)
├── scripts/        client-side TS (GSAP/Lenis, resource filter, ...)
├── sanity/         Studio schema + generated types
└── styles/         webflow/*.css (verbatim) + app.css
```
