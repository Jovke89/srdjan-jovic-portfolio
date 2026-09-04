import { defineType, defineField } from 'sanity';

/* Reused on every page-backed document. Drives <title>, meta description,
   OG/Twitter tags and JSON-LD. Empty fields fall back to the content itself
   (handled in GROQ / the SEO component), matching the Webflow per-item SEO. */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      title: 'Title tag',
      type: 'string',
      description: 'Overrides the page <title>. Falls back to the content title.',
      validation: (rule) => rule.max(70).warning('Keep under ~70 characters.'),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(180).warning('Keep under ~160 characters.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image',
      type: 'image',
      options: { hotspot: true },
      description: '1200x630 recommended. Falls back to the site default OG image.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
    }),
  ],
});
