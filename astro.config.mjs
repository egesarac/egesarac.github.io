// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://egesarac.github.io',
  trailingSlash: 'ignore',
  // Preserve spaces between inline elements when templates span multiple lines.
  compressHTML: true,
  // Preserves incoming links to the old Jekyll URL.
  redirects: {
    '/teaching_and_mentoring': '/teaching',
  },
});
