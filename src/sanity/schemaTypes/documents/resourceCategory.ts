import { defineType, defineField } from 'sanity';

export const resourceCategory = defineType({
  name: 'resourceCategory',
  title: 'Resource category',
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
      name: 'order',
      type: 'number',
      title: 'Category order',
      description: 'Controls the order of the filter buttons on /resources.',
    }),
    defineField({ name: 'legacyId', type: 'string', title: 'Webflow item ID', readOnly: true, hidden: true }),
  ],
  orderings: [{ title: 'Category order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'slug.current' } },
});
