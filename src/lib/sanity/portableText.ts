import { toHTML, type PortableTextHtmlComponents } from '@portabletext/to-html';
import { urlFor } from './image';

/** Plain text from a Portable Text array (for meta descriptions, JSON-LD, ToC). */
function toPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map((block: { _type?: string; children?: { text?: string }[] }) => {
      if (block?._type !== 'block' || !Array.isArray(block.children)) return '';
      return block.children.map((c) => c.text ?? '').join('');
    })
    .filter(Boolean)
    .join('\n\n');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const components: Partial<PortableTextHtmlComponents> = {
  types: {
    image: ({ value }) => {
      const set = urlFor(value).width(1200).auto('format').url();
      const srcset = [640, 960, 1200, 1600]
        .map((w) => `${urlFor(value).width(w).auto('format').url()} ${w}w`)
        .join(', ');
      const alt = esc(value?.alt || '');
      const cap = value?.caption ? `<figcaption>${esc(value.caption)}</figcaption>` : '';
      return `<figure class="w-richtext-figure-type-image"><div><img src="${set}" srcset="${srcset}" sizes="(max-width: 767px) 100vw, 800px" alt="${alt}" loading="lazy" decoding="async" /></div>${cap}</figure>`;
    },
    // Raw by design: mirrors Webflow rich-text embeds (iframes/scripts).
    // Authored only by the single trusted CMS editor.
    htmlEmbed: ({ value }) => value?.html || '',
    table: ({ value }) => {
      const rows: { cells?: string[] }[] = value?.rows || [];
      if (!rows.length) return '';
      const hasHeader = value?.hasHeader !== false;
      const head = hasHeader
        ? `<thead><tr>${(rows[0].cells || [])
            .map((c) => `<th>${esc(c)}</th>`)
            .join('')}</tr></thead>`
        : '';
      const bodyRows = hasHeader ? rows.slice(1) : rows;
      const body = `<tbody>${bodyRows
        .map(
          (r) =>
            `<tr>${(r.cells || []).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`,
        )
        .join('')}</tbody>`;
      return `<div class="w-richtext-figure-type-table"><table>${head}${body}</table></div>`;
    },
  },
  block: {
    h2: ({ children, value }) =>
      `<h2 id="${slugify(toPlainText(value))}">${children}</h2>`,
    h3: ({ children, value }) =>
      `<h3 id="${slugify(toPlainText(value))}">${children}</h3>`,
    h4: ({ children, value }) =>
      `<h4 id="${slugify(toPlainText(value))}">${children}</h4>`,
    blockquote: ({ children }) => `<blockquote>${children}</blockquote>`,
    normal: ({ children }) => `<p>${children}</p>`,
  },
  marks: {
    strong: ({ children }) => `<strong>${children}</strong>`,
    em: ({ children }) => `<em>${children}</em>`,
    code: ({ children }) => `<code>${children}</code>`,
    link: ({ children, value }) => {
      const raw = (value?.href || '').trim();
      const href =
        /^(https?:|mailto:|tel:|\/|#)/i.test(raw) && !/^javascript:/i.test(raw) ? raw : '#';
      const external = /^https?:\/\//i.test(href);
      const attrs = value?.blank || external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${esc(href)}"${attrs}>${children}</a>`;
    },
  },
  list: {
    bullet: ({ children }) => `<ul role="list">${children}</ul>`,
    number: ({ children }) => `<ol role="list">${children}</ol>`,
  },
  listItem: {
    bullet: ({ children }) => `<li>${children}</li>`,
    number: ({ children }) => `<li>${children}</li>`,
  },
};

export function portableTextToHtml(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return '';
  return toHTML(value, { components });
}

export function portableTextToPlain(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return toPlainText(value);
}

export type TocEntry = { text: string; id: string; level: number };

export function extractToc(blocks: unknown): TocEntry[] {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter(
      (b: { _type?: string; style?: string }) =>
        b?._type === 'block' && ['h2', 'h3', 'h4'].includes(b.style ?? ''),
    )
    .map((b: { style: string; children?: { text?: string }[] }) => {
      const text = (b.children || []).map((c) => c.text ?? '').join('');
      return { text, id: slugify(text), level: Number(b.style.replace('h', '')) };
    })
    .filter((e) => e.text);
}

export function readingTimeMinutes(...blocks: unknown[]): number {
  const words = blocks
    .map((b) => portableTextToPlain(b))
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
