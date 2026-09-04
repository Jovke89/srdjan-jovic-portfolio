import { defineType, defineField } from 'sanity';

/* No dedicated page. Surfaced as collection lists on the home and case-study
   pages (text cards + video cards). */
export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Person name', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'company', type: 'string', title: 'Firm or organization' }),
    defineField({ name: 'quote', type: 'text', rows: 4, title: 'Quote / card description' }),
    defineField({
      name: 'photo',
      type: 'image',
      title: 'Thumbnail image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
    }),
    defineField({
      name: 'videoUrl',
      type: 'url',
      title: 'Video testimonial URL',
      description: 'MP4 URL. When set, the testimonial renders as a video card.',
    }),
    defineField({
      name: 'videoPoster',
      type: 'image',
      title: 'Video poster',
      options: { hotspot: true },
    }),
    defineField({ name: 'order', type: 'number', title: 'Testimonial order' }),
    defineField({ name: 'legacyId', type: 'string', title: 'Webflow item ID', readOnly: true, hidden: true }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'company', media: 'photo' },
  },
});
