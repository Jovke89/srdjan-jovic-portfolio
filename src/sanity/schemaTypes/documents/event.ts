import { defineType, defineField } from 'sanity';

/* /events/[slug]. JSON-LD: Event (Place / PostalAddress / Organizer). */
export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  groups: [
    { name: 'main', title: 'Main', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'name', type: 'string', group: 'main', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'main',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'overview', title: 'Event overview', type: 'text', rows: 3, group: 'main' }),
    defineField({ name: 'year', type: 'string', group: 'main' }),
    defineField({ name: 'host', type: 'string', group: 'main' }),
    defineField({ name: 'location', type: 'string', title: 'Location (city)', group: 'main' }),
    defineField({ name: 'startDate', type: 'datetime', title: 'Event date', group: 'main' }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
      fields: [defineField({ name: 'alt', type: 'string' })],
    }),
    defineField({
      name: 'thumbnail',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
      fields: [defineField({ name: 'alt', type: 'string' })],
    }),
    defineField({ name: 'body', title: 'Body text', type: 'blockContent', group: 'main' }),
    defineField({ name: 'datePublished', type: 'datetime', group: 'seo' }),
    defineField({ name: 'dateModified', type: 'datetime', group: 'seo' }),
    defineField({ name: 'seo', type: 'seo', group: 'seo' }),
    defineField({ name: 'legacyId', type: 'string', title: 'Webflow item ID', readOnly: true, hidden: true, group: 'seo' }),
  ],
  orderings: [{ title: 'Newest', name: 'newest', by: [{ field: 'startDate', direction: 'desc' }] }],
  preview: { select: { title: 'name', subtitle: 'year', media: 'thumbnail' } },
});
