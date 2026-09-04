import { htmlToBlocks } from '@portabletext/block-tools';
import { Schema } from '@sanity/schema';
import { JSDOM } from 'jsdom';
import { randomUUID } from 'node:crypto';

/* Compile a minimal block-content schema for block-tools that mirrors
   src/sanity/schemaTypes/objects/blockContent.ts (only the tags the Webflow
   export actually uses: h2-h4, p, ul/ol, strong/em/code, a, table). */
const compiled = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'blockContent',
      type: 'array',
      of: [
        {
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
              {
                name: 'link',
                type: 'object',
                fields: [
                  { name: 'href', type: 'url' },
                  { name: 'blank', type: 'boolean' },
                ],
              },
            ],
          },
        },
        // The Webflow CSV bodies only use block-level tags + tables (no images
        // or embeds), so the compiled schema stays minimal on purpose.
        { type: 'object', name: 'table', fields: [{ name: 'hasHeader', type: 'boolean' }, { name: 'rows', type: 'array', of: [{ type: 'object', name: 'tableRow', fields: [{ name: 'cells', type: 'array', of: [{ type: 'string' }] }] }] }] },
      ],
    },
  ],
});

const blockContentType = compiled.get('blockContent');

const key = () => randomUUID().replace(/-/g, '').slice(0, 12);

export function htmlToPortableText(html: string | undefined | null): unknown[] {
  if (!html || !html.trim()) return [];
  return htmlToBlocks(html, blockContentType, {
    parseHtml: (h) => new JSDOM(h).window.document,
    rules: [
      {
        deserialize(el, _next, block) {
          const tag = (el as Element).tagName?.toLowerCase();
          if (tag !== 'table') return undefined;
          const table = el as HTMLTableElement;
          const headerCells = [...table.querySelectorAll('thead th')].map(
            (c) => c.textContent?.trim() ?? '',
          );
          const bodyRows = [...table.querySelectorAll('tbody tr')].map((tr) => ({
            _type: 'tableRow',
            _key: key(),
            cells: [...tr.children].map((td) => td.textContent?.trim() ?? ''),
          }));
          const rows = headerCells.length
            ? [{ _type: 'tableRow', _key: key(), cells: headerCells }, ...bodyRows]
            : bodyRows;
          return block({ _type: 'table', _key: key(), hasHeader: headerCells.length > 0, rows });
        },
      },
    ],
  }) as unknown[];
}
