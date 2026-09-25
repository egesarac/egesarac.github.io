import { marked } from 'marked';
import { site } from './data';

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
 * Render an author list, emphasizing your own name and styling the
 * corresponding-author asterisk. The "and" before the last
 * author is dropped: names are separated by commas only.
 */
export function authors(list: string): string {
  const me = site.highlight_author;
  const escaped = escapeHtml(list.replace(/,?\s+and\s+/g, ', '));
  const pattern = new RegExp(`${escapeRegExp(me)}(\\*?)`, 'g');
  return escaped.replace(
    pattern,
    (_match, star: string) =>
      `<span class="me">${me}</span>` + (star ? '<span class="star">*</span>' : ''),
  );
}
