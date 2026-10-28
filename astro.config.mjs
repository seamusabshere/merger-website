import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { BuiltPage } from './src/persistence/BuiltPage.ts';

export default defineConfig({
  site: 'https://burlington-south-burlington-winooski-merger-study.org',
  output: 'static',
  trailingSlash: 'always',
  redirects: {
    '/calendar/': '/deadlines/',
  },
  integrations: [
    sitemap({
      // The sitemap integration writes after the pages are built, so each page's own "Last updated" date is readable here.
      serialize: async (item) => ({
        ...item,
        lastmod: (
          await BuiltPage.load({ url: item.url, outputDirectory: new URL('./dist/', import.meta.url) })
        ).updatedOn().startsAt().isoStringWithOffset(),
      }),
    }),
  ],
});
