import { defineType, defineField } from 'sanity';

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photo',
      type: 'image',
      title: 'Photo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
    }),
    defineField({ name: 'bio', type: 'text', rows: 4 }),
    defineField({ name: 'legacyId', type: 'string', title: 'Webflow item ID', readOnly: true, hidden: true }),
  ],
  preview: { select: { title: 'name', subtitle: 'slug.current', media: 'photo' } },
});
