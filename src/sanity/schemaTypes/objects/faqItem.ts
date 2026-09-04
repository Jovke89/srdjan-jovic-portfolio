import { defineType, defineField } from 'sanity';

/* One FAQ entry. Resources have up to 6, surfaced in the on-page FAQ block
   and in the FAQPage JSON-LD. */
export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ item',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'answer',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'question', subtitle: 'answer' },
  },
});
