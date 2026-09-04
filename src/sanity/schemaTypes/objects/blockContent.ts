import { defineType, defineArrayMember, defineField } from 'sanity';

/* Rich text for resource / event bodies. Mirrors the Webflow rich-text output:
   h2-h4, quote, ordered/unordered lists, links, inline images and simple tables. */
export const blockContent = defineType({
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              defineField({
                name: 'href',
                type: 'url',
                title: 'URL',
                validation: (rule) =>
                  rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
              }),
              defineField({
                name: 'blank',
                type: 'boolean',
                title: 'Open in new tab',
                initialValue: false,
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      name: 'image',
      title: 'Image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          validation: (rule) => rule.warning('Add alt text for accessibility and SEO.'),
        }),
        defineField({ name: 'caption', type: 'string', title: 'Caption' }),
      ],
    }),
    defineArrayMember({
      type: 'object',
      name: 'htmlEmbed',
      title: 'HTML embed',
      fields: [defineField({ name: 'html', type: 'text', title: 'HTML' })],
      preview: { select: { html: 'html' }, prepare: ({ html }) => ({ title: 'HTML embed', subtitle: html?.slice(0, 60) }) },
    }),
    defineArrayMember({
      type: 'object',
      name: 'table',
      title: 'Table',
      fields: [
        defineField({ name: 'hasHeader', type: 'boolean', title: 'First row is a header', initialValue: true }),
        defineField({
          name: 'rows',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'tableRow',
              fields: [defineField({ name: 'cells', type: 'array', of: [{ type: 'string' }] })],
              preview: { select: { cells: 'cells' }, prepare: ({ cells }) => ({ title: (cells || []).join(' | ') }) },
            }),
          ],
        }),
      ],
      preview: { prepare: () => ({ title: 'Table' }) },
    }),
  ],
});
