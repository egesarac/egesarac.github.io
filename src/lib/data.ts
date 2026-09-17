import { parse } from 'yaml';
import { validateLinks, validateMarkdown, validatePublications, validateUrl } from './validation';

import siteRaw from '../data/site.yaml?raw';
import aboutRaw from '../data/about.yaml?raw';
import publicationsRaw from '../data/publications.yaml?raw';
import publicationTopicsRaw from '../data/publication-topics.yaml?raw';
import talksRaw from '../data/talks.yaml?raw';
import teachingRaw from '../data/teaching.yaml?raw';
import supervisionRaw from '../data/supervision.yaml?raw';
import researchRaw from '../data/research.yaml?raw';

export interface Link {
  label: string;
  url: string;
}

export interface Site {
  name: string;
  pronunciation?: string;
  portrait?: string;
  role: string;
  location: string;
  highlight_author: string;
  links: Link[];
  cv: string;
  description: string;
}

export interface About {
  bio: string[];
  news: { date: string; text: string }[];
}

export interface Publication {
  title: string;
  authors: string;
  venue: string;
  short?: string;
  year: number;
  kind: 'conference' | 'journal' | 'thesis';
  topics: string[];
  volume?: number;
  issue?: number;
  note?: string;
  links?: Link[];
  selected?: {
    order: number;
    summary: string;
  };
}

export interface PublicationTopic {
  id: string;
  title: string;
  additional?: boolean;
}

export interface Talk {
  title: string;
  slides?: string;
  video?: string;
  given: { at: string; url?: string; when: string }[];
}

export interface TeachingEntry {
  course: string;
  role: string;
  org: string;
  when: string;
  links?: Link[];
}

export interface Supervision {
  intro: string[];
  projects: {
    project: string;
    student: string;
    type: string;
    role: string;
    where: string;
    when: string;
    detail?: string;
    links?: Link[];
  }[];
  mentoring: {
    title: string;
    role: string;
    where: string;
    when: string;
    detail: string;
  }[];
}

export interface ResearchArea {
  title: string;
  image: string;
  definition: string;
  contribution: string;
}

export interface Research {
  intro: string;
  areas: ResearchArea[];
  project: {
    title: string;
    full_title: string;
    programme: string;
    dates: string;
    description: string;
    record: string;
  };
}

export const site = parse(siteRaw) as Site;
export const about = parse(aboutRaw) as About;
export const publications = parse(publicationsRaw) as Publication[];
export const publicationTopics = parse(publicationTopicsRaw) as PublicationTopic[];
export const talks = parse(talksRaw) as Talk[];
export const teaching = parse(teachingRaw) as TeachingEntry[];
export const supervision = parse(supervisionRaw) as Supervision;
export const research = parse(researchRaw) as Research;

// Validate the error-prone fields once when data loads, before any page renders.
validatePublications(publications, publicationTopics);
validateLinks(site.links, 'site.yaml.links');
validateUrl(site.cv, 'site.yaml.cv');
if (site.portrait !== undefined) validateUrl(site.portrait, 'site.yaml.portrait');
validateMarkdown(site.role, 'site.yaml.role');
about.bio.forEach((text, i) => validateMarkdown(text, `about.yaml.bio[${i}]`));
about.news.forEach((news, i) => validateMarkdown(news.text, `about.yaml.news[${i}].text`));
research.areas.forEach((area, i) => validateUrl(area.image, `research.yaml.areas[${i}].image`));
validateUrl(research.project.record, 'research.yaml.project.record');
talks.forEach((talk, i) => {
  const entry = `talks.yaml[${i}] (${talk.title})`;
  if (talk.slides !== undefined) validateUrl(talk.slides, `${entry}.slides`);
  if (talk.video !== undefined) validateUrl(talk.video, `${entry}.video`);
  talk.given.forEach((event, j) => {
    if (event.url !== undefined) validateUrl(event.url, `${entry}.given[${j}].url`);
  });
});
teaching.forEach((entry, i) => validateLinks(entry.links, `teaching.yaml[${i}].links`));
supervision.intro.forEach((text, i) => validateMarkdown(text, `supervision.yaml.intro[${i}]`));
supervision.projects.forEach((project, i) => {
  validateLinks(project.links, `supervision.yaml.projects[${i}].links`);
  validateMarkdown(project.detail, `supervision.yaml.projects[${i}].detail`);
});
supervision.mentoring.forEach((entry, i) => validateMarkdown(entry.detail, `supervision.yaml.mentoring[${i}].detail`));

/** Homepage selections use an editorial order independent of the full bibliography. */
export function selectedPublications() {
  return publications
    .flatMap((pub) => pub.selected ? [{ pub, ...pub.selected }] : [])
    .sort((a, b) => a.order - b.order);
}

/** Publications grouped by year, newest year first, original order kept inside a year. */
export function publicationsByYear(): { year: number; entries: Publication[] }[] {
  const groups = new Map<number, Publication[]>();
  for (const pub of publications) {
    if (!groups.has(pub.year)) groups.set(pub.year, []);
    groups.get(pub.year)!.push(pub);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, entries]) => ({ year, entries }));
}

/** Topics follow editorial order; publications are newest first within each topic. */
export function publicationsByTopic(): (PublicationTopic & { entries: Publication[] })[] {
  const sortedPublications = [...publications].sort((a, b) => b.year - a.year);
  return publicationTopics
    .map((topic) => ({
      ...topic,
      entries: sortedPublications.filter((pub) => pub.topics.includes(topic.id)),
    }))
    .filter((group) => group.entries.length > 0);
}
