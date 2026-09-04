import { defineType, defineField } from 'sanity';

/* A single result / metric on a case study (e.g. value "200", label
   "Consultation conversion rate"). */
export const statItem = defineType({
  name: 'statItem',
  title: 'Result',
  type: 'object',
  fields: [
    defineField({ name: 'value', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
  ],
  preview: {
    select: { title: 'value', subtitle: 'label' },
  },
});
