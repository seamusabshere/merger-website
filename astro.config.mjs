import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://burlington-south-burlington-winooski-merger-study.org',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
