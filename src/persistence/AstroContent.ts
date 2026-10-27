import { getCollection, getEntry, render } from 'astro:content';
import { Committee } from '../domain/Committee.ts';
import { Page } from '../domain/Page.ts';

type PageBody = Awaited<ReturnType<typeof render>>['Content'];

export class AstroContent {
  static async loadCommittee(): Promise<Committee> {
    const [committeeEntries, districtEntries, memberEntries, meetingEntries, documentEntries] = await Promise.all([
      getCollection('committee'),
      getCollection('districts'),
      getCollection('members'),
      getCollection('meetings'),
      getCollection('documents'),
    ]);
    if (committeeEntries.length !== 1) {
      throw new Error(`src/content/committee.yaml must hold exactly one committee; found ${committeeEntries.length}.`);
    }
    return new Committee({
      committeeData: committeeEntries[0]!.data,
      districtsData: districtEntries.map((entry) => entry.data),
      membersData: memberEntries.map((entry) => entry.data),
      meetingsData: meetingEntries.map((entry) => ({ id: entry.id, data: entry.data })),
      documentsData: documentEntries.map((entry) => ({ id: entry.id, data: entry.data })),
    });
  }

  static async loadPage({ locale, slug }: { locale: string; slug: string }): Promise<Page<PageBody>> {
    const entry = await getEntry('pages', `${locale}/${slug}`);
    if (!entry) throw new Error(`No page at src/content/pages/${locale}/${slug}.md`);
    const { Content } = await render(entry);
    return new Page({ id: slug, locale, data: entry.data, body: Content });
  }
}
