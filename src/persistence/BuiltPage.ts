import { readFile } from 'node:fs/promises';
import { VermontCalendarDay } from '../domain/VermontTime.ts';

export class BuiltPage {
  readonly url: string;
  readonly html: string;

  constructor({ url, html }: { url: string; html: string }) {
    this.url = url;
    this.html = html;
  }

  static async load({ url, outputDirectory }: { url: string; outputDirectory: URL }): Promise<BuiltPage> {
    return new BuiltPage({
      url,
      html: await readFile(new URL(`.${new URL(url).pathname}index.html`, outputDirectory), 'utf8'),
    });
  }

  updatedOn(): VermontCalendarDay {
    const match = /<p class="updated"[^>]*>[^<]*<time datetime="(\d{4}-\d{2}-\d{2})"/.exec(this.html);
    if (!match) throw new Error(`No "Last updated" date in the built page for ${this.url}`);
    return VermontCalendarDay.parse({ isoDate: match[1]! });
  }
}
