import { statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { marked } from 'marked';
import type { Publication, PublicationTopic } from './data';

function requireText(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field}: expected nonempty text.`);
  }
}

function requirePositiveInteger(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field}: expected a positive integer.`);
  }
}

/** Check local assets without making builds depend on external websites. */
export function validateUrl(value: unknown, field: string) {
  requireText(value, field);
  const url = value.trim();
  if (!/^\/(?:files|images)\//.test(url)) return;

  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(url, 'https://local.invalid').pathname);
  } catch {
    throw new Error(`${field}: invalid local asset URL "${value}".`);
  }
  const publicDir = resolve('public');
  const asset = resolve(publicDir, `.${pathname}`);
  if (!asset.startsWith(publicDir + sep) || !statSync(asset, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`${field}: missing local asset "${value}" in public/.`);
  }
}

export function validateLinks(value: unknown, field: string) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    throw new Error(`${field}: expected a list of links.`);
  }
  value.forEach((link, index) => {
    const entry = `${field}[${index}]`;
    if (!link || typeof link !== 'object' || Array.isArray(link)) {
      throw new Error(`${entry}: expected a link with a label and URL.`);
    }
    requireText(link.label, `${entry}.label`);
    validateUrl(link.url, `${entry}.url`);
  });
}

/** Use the same inline Markdown parser as rendering to find linked assets. */
export function validateMarkdown(value: string | undefined, field: string) {
  if (value === undefined) return;
  marked.walkTokens(marked.Lexer.lexInline(value), (token) => {
    if (token.type === 'link' || token.type === 'image') {
      validateUrl(token.href, field);
    }
  });
}

export function validatePublications(publications: Publication[], topics: PublicationTopic[]) {
  if (!Array.isArray(topics)) {
    throw new Error('publication-topics.yaml: expected a list of topics.');
  }
  const topicIds = new Set<string>();
  topics.forEach((topic, index) => {
    const field = `publication-topics.yaml[${index}].id`;
    requireText(topic?.id, field);
    if (topicIds.has(topic.id)) {
      throw new Error(`${field}: duplicate topic ID "${topic.id}".`);
    }
    topicIds.add(topic.id);
  });

  if (!Array.isArray(publications)) {
    throw new Error('publications.yaml: expected a list of publications.');
  }
  const selectedOrders = new Set<number>();
  publications.forEach((pub, index) => {
    const entry = `publications.yaml[${index}] (${pub?.title ?? 'untitled'})`;
    requirePositiveInteger(pub?.year, `${entry}.year`);
    for (const field of ['volume', 'issue'] as const) {
      if (pub[field] !== undefined) requirePositiveInteger(pub[field], `${entry}.${field}`);
    }
    if (pub.issue !== undefined && pub.volume === undefined) {
      throw new Error(`${entry}.issue: an issue requires a volume.`);
    }
    if (pub.selected !== undefined) {
      requirePositiveInteger(pub.selected?.order, `${entry}.selected.order`);
      requireText(pub.selected?.summary, `${entry}.selected.summary`);
      if (selectedOrders.has(pub.selected.order)) {
        throw new Error(`${entry}.selected.order: duplicate order ${pub.selected.order}.`);
      }
      selectedOrders.add(pub.selected.order);
    }
    validateLinks(pub.links, `${entry}.links`);

    if (!Array.isArray(pub.topics) || pub.topics.length === 0) {
      throw new Error(`${entry}.topics: expected at least one topic.`);
    }
    const assignedTopics = new Set<string>();
    for (const topicId of pub.topics) {
      if (!topicIds.has(topicId)) {
        throw new Error(`${entry}.topics: unknown topic "${topicId}".`);
      }
      if (assignedTopics.has(topicId)) {
        throw new Error(`${entry}.topics: duplicate topic "${topicId}".`);
      }
      assignedTopics.add(topicId);
    }
  });
}
