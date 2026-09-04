import { defineType, defineField } from 'sanity';

/* /case-study/[slug]. JSON-LD: Article + about Organization (the client). */
export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case study',
  type: 'document',
  groups: [
    { name: 'main', title: 'Main', default: true },
    { name: 'overview', title: 'Overview' },
    { name: 'challenge', title: 'Challenge' },
    { name: 'role', title: 'My role' },
    { name: 'approach', title: 'Technical approach' },
    { name: 'results', title: 'Results' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Client / project name', type: 'string', group: 'main', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'main',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'clientDescription', title: 'Client description', type: 'text', rows: 3, group: 'main' }),
    defineField({ name: 'year', type: 'string', group: 'main' }),
    defineField({ name: 'industry', type: 'reference', to: [{ type: 'industry' }], group: 'main' }),
    defineField({ name: 'currentWebsite', title: 'Current website URL', type: 'url', group: 'main' }),
    defineField({
      name: 'cardThumbnail',
      title: 'Card thumbnail',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
      fields: [defineField({ name: 'alt', type: 'string' })],
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
      fields: [defineField({ name: 'alt', type: 'string' })],
    }),
    defineField({ name: 'techStack', title: 'Tech stack', type: 'array', of: [{ type: 'reference', to: [{ type: 'techStack' }] }], group: 'main' }),
    defineField({ name: 'testimonial', type: 'reference', to: [{ type: 'testimonial' }], group: 'main' }),
    defineField({ name: 'cardNumber', title: 'Card number', type: 'number', group: 'main' }),
    defineField({ name: 'order', type: 'number', group: 'main' }),

    // Overview
    defineField({ name: 'overviewParagraph', title: 'Overview paragraph', type: 'text', rows: 4, group: 'overview' }),
    defineField({
      name: 'marqueeImages',
      title: 'Overview marquee images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', type: 'string' })] }],
      group: 'overview',
    }),

    // Challenge
    defineField({ name: 'challengeParagraph1', title: 'Challenge paragraph 1', type: 'text', rows: 3, group: 'challenge' }),
    defineField({ name: 'challengeParagraph2', title: 'Challenge paragraph 2', type: 'text', rows: 3, group: 'challenge' }),
    defineField({ name: 'challengeImage', title: 'Challenge image', type: 'image', options: { hotspot: true }, group: 'challenge', fields: [defineField({ name: 'alt', type: 'string' })] }),

    // My role
    defineField({ name: 'roleParagraph1', title: 'My role paragraph 1', type: 'text', rows: 3, group: 'role' }),
    defineField({ name: 'roleParagraph2', title: 'My role paragraph 2', type: 'text', rows: 3, group: 'role' }),
    defineField({ name: 'roleImage', title: 'My role image', type: 'image', options: { hotspot: true }, group: 'role', fields: [defineField({ name: 'alt', type: 'string' })] }),

    // Technical approach
    defineField({ name: 'approachParagraph', title: 'Technical approach paragraph', type: 'text', rows: 4, group: 'approach' }),
    defineField({ name: 'approachImage', title: 'Technical approach image', type: 'image', options: { hotspot: true }, group: 'approach', fields: [defineField({ name: 'alt', type: 'string' })] }),

    // Results
    defineField({
      name: 'stats',
      title: 'Results',
      type: 'array',
      of: [{ type: 'statItem' }],
      group: 'results',
      validation: (rule) => rule.max(2),
    }),
    defineField({ name: 'keyTakeaway', title: 'Key takeaway paragraph', type: 'text', rows: 4, group: 'results' }),

    // SEO / dates
    defineField({ name: 'datePublished', type: 'datetime', group: 'seo' }),
    defineField({ name: 'dateModified', type: 'datetime', group: 'seo' }),
    defineField({ name: 'seo', type: 'seo', group: 'seo' }),
    defineField({ name: 'legacyId', type: 'string', title: 'Webflow item ID', readOnly: true, hidden: true, group: 'seo' }),
  ],
  orderings: [
    { title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Newest', name: 'newest', by: [{ field: 'datePublished', direction: 'desc' }] },
  ],
  preview: { select: { title: 'name', subtitle: 'year', media: 'cardThumbnail' } },
});
