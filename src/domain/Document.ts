import type { DocumentData, DocumentFileData } from './schemas.ts';
import { VermontCalendarDay } from './VermontTime.ts';

const FORMAT_NAMES: Record<DocumentFileData['format'], string> = {
  pdf: 'PDF',
  'web-page': 'Web page',
  'google-doc': 'Google Doc',
  video: 'Video',
};

export class DocumentFile {
  readonly label: string;
  readonly language: string;
  readonly format: DocumentFileData['format'];
  readonly sizeBytes: number | undefined;
  readonly accessibility: DocumentFileData['accessibility'];
  readonly url: string;

  constructor({ data }: { data: DocumentFileData }) {
    this.label = data.label;
    this.language = data.language;
    this.format = data.format;
    this.sizeBytes = data.sizeBytes;
    this.accessibility = data.accessibility;
    this.url = data.url;
  }

  formatName(): string {
    return FORMAT_NAMES[this.format];
  }

  sizeDescription(): string | undefined {
    if (this.sizeBytes === undefined) return undefined;
    if (this.sizeBytes >= 1_000_000) return `${(this.sizeBytes / 1_000_000).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(this.sizeBytes / 1000))} KB`;
  }

  typeAndSize(): string {
    return [this.formatName(), this.sizeDescription()].filter(Boolean).join(', ');
  }

  accessibilityNote(): string | undefined {
    if (this.accessibility === 'not-accessible') {
      return 'This file does not work well with screen readers.';
    }
    return undefined;
  }
}

export class Document {
  readonly id: string;
  readonly title: string;
  readonly publisher: string;
  readonly publishedOn: VermontCalendarDay | undefined;
  readonly updatedOn: VermontCalendarDay;
  readonly summaryParagraphs: string[];
  readonly files: DocumentFile[];

  constructor({ id, data }: { id: string; data: DocumentData }) {
    this.id = id;
    this.title = data.title;
    this.publisher = data.publisher;
    this.publishedOn = data.publishedOn ? VermontCalendarDay.parse({ isoDate: data.publishedOn }) : undefined;
    this.updatedOn = VermontCalendarDay.parse({ isoDate: data.updatedOn });
    this.summaryParagraphs = data.summary
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    this.files = data.files.map((file) => new DocumentFile({ data: file }));
  }

  path(): string {
    return `/records/${this.id}/`;
  }

  hasFileNeedingAnotherFormat(): boolean {
    return this.files.some((file) => file.accessibility !== 'checked-accessible' && file.format !== 'web-page');
  }

  publishedDescription(): string {
    return this.publishedOn ? this.publishedOn.shortDate() : 'Date not given';
  }

  compareNewestFirst({ other }: { other: Document }): number {
    if (this.publishedOn && other.publishedOn) {
      return other.publishedOn.compare({ other: this.publishedOn }) || this.title.localeCompare(other.title);
    }
    if (this.publishedOn) return -1;
    if (other.publishedOn) return 1;
    return this.title.localeCompare(other.title);
  }
}
