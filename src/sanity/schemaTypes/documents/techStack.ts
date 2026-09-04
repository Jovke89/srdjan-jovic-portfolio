import { defineType, defineField } from 'sanity';

export const techStack = defineType({
  name: 'techStack',
  title: 'Tech stack',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'icon', type: 'image', title: 'Icon / logo', options: { hotspot: true } }),
    defineField({ name: 'legacyId', type: 'string', title: 'Webflow item ID', readOnly: true, hidden: true }),
  ],
  preview: { select: { title: 'name', subtitle: 'slug.current', media: 'icon' } },
});
