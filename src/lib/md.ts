import { marked } from 'marked';
import { site, type Publication } from './data';

/**
 * Render a YAML string with inline markdown: *italics*, **bold**,
 * [links](https://…), `code`. Returns HTML.
 */
export function md(text: string): string {
  return marked.parseInline(text.trim(), { async: false });
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Render an author list, emphasizing your own name. Publication metadata adds
 * corresponding-author and contribution-order superscripts; omit it for compact
 * homepage citations. The "and" before the last author is dropped.
 */
export function authors(list: string, publication?: Pick<Publication, 'corresponding' | 'author_order'>): string {
  const me = site.highlight_author;
  const escaped = escapeHtml(list.replace(/,?\s+and\s+/g, ', '));
  const pattern = new RegExp(escapeRegExp(me), 'g');
  let markers = '';
  if (publication) {
    if (publication.corresponding ?? true) {
      markers += '<sup class="star" title="Corresponding author">*</sup>';
    }
    if (publication.author_order === 'contribution') {
      markers += '<sup class="dagger" title="Authors ordered by contribution">†</sup>';
    }
  }
  return escaped.replace(pattern, () => `<span class="me">${me}</span>${markers}`);
}
