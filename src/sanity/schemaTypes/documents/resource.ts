import { defineType, defineField } from 'sanity';

/* /resources/[slug]. JSON-LD: BlogPosting + FAQPage in one @graph. */
export const resource = defineType({
  name: 'resource',
  title: 'Resource',
  type: 'document',
  groups: [
    { name: 'main', title: 'Main', default: true },
    { name: 'body', title: 'Body' },
    { name: 'faq', title: 'FAQ' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Title', type: 'string', group: 'main', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'main',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
      fields: [defineField({ name: 'alt', type: 'string' })],
    }),
    defineField({ name: 'category', type: 'reference', to: [{ type: 'resourceCategory' }], group: 'main' }),
    defineField({ name: 'author', type: 'reference', to: [{ type: 'author' }], group: 'main' }),
    defineField({ name: 'publishDate', type: 'datetime', group: 'main' }),
    defineField({ name: 'featured', type: 'boolean', initialValue: false, group: 'main' }),
    defineField({ name: 'timeToRead', title: 'Time to read (minutes)', type: 'number', group: 'main' }),

    defineField({ name: 'tldr', title: 'TL;DR', type: 'blockContent', group: 'body' }),
    defineField({ name: 'body', title: 'Body content', type: 'blockContent', group: 'body' }),

    defineField({
      name: 'faqs',
      title: 'FAQ',
      type: 'array',
      of: [{ type: 'faqItem' }],
      group: 'faq',
      validation: (rule) => rule.max(6),
    }),

    defineField({ name: 'dateModified', type: 'datetime', group: 'seo' }),
    defineField({ name: 'seo', type: 'seo', group: 'seo' }),
    defineField({ name: 'legacyId', type: 'string', title: 'Webflow item ID', readOnly: true, hidden: true, group: 'seo' }),
  ],
  orderings: [{ title: 'Newest', name: 'newest', by: [{ field: 'publishDate', direction: 'desc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'category.name', media: 'coverImage' },
  },
});
