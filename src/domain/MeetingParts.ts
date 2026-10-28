import type { Document } from './Document.ts';
import type {
  AgendaData,
  ElectronicAccessData,
  MinutesData,
  PhysicalLocationData,
  RecordingData,
} from './schemas.ts';
import { VermontCalendarDay, VermontTime } from './VermontTime.ts';

export class PhysicalLocation {
  readonly name: string;
  readonly streetAddress: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly room: string | undefined;
  readonly accessNotes: string[];

  constructor({ data }: { data: PhysicalLocationData }) {
    this.name = data.name;
    this.streetAddress = data.streetAddress;
    this.city = data.city;
    this.state = data.state;
    this.postalCode = data.postalCode;
    this.room = data.room;
    this.accessNotes = data.accessNotes;
  }

  cityLine(): string {
    return `${this.city}, ${this.state} ${this.postalCode}`;
  }

  singleLine(): string {
    return [this.name, this.room, this.streetAddress, this.cityLine()].filter(Boolean).join(', ');
  }

  mapUrl(): string {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${this.streetAddress}, ${this.cityLine()}`)}`;
  }
}

export class ElectronicAccess {
  readonly platform: string;
  readonly url: string | undefined;
  readonly meetingId: string | undefined;
  readonly passcode: string | undefined;
  readonly phoneNumber: string | undefined;
  readonly phonePin: string | undefined;

  constructor({ data }: { data: ElectronicAccessData }) {
    this.platform = data.platform;
    this.url = data.url;
    this.meetingId = data.meetingId;
    this.passcode = data.passcode;
    this.phoneNumber = data.phoneNumber;
    this.phonePin = data.phonePin;
  }

  hasJoinDetails(): boolean {
    return this.url !== undefined || this.phoneNumber !== undefined;
  }

  telephoneHref(): string | undefined {
    if (!this.phoneNumber) return undefined;
    const digits = this.phoneNumber.replace(/\D/g, '');
    const pinDigits = this.phonePin?.replace(/\D/g, '');
    return pinDigits ? `tel:+${digits},,${pinDigits}%23` : `tel:+${digits}`;
  }
}

export class Agenda {
  readonly postedAt: VermontTime | undefined;
  readonly document: Document;

  constructor({ data, documentsById }: { data: AgendaData; documentsById: Map<string, Document> }) {
    this.postedAt = data.postedAt ? VermontTime.parse({ isoInstant: data.postedAt }) : undefined;
    this.document = lookUp({ map: documentsById, id: data.documentId, kind: 'document' });
  }
}

export class Minutes {
  readonly status: 'draft' | 'approved';
  readonly postedAt: VermontTime;
  readonly approvedOn: VermontCalendarDay | undefined;
  readonly document: Document | undefined;
  readonly sourceUrl: string | undefined;

  constructor({ data, documentsById }: { data: MinutesData; documentsById: Map<string, Document> }) {
    this.status = data.status;
    this.postedAt = VermontTime.parse({ isoInstant: data.postedAt });
    this.approvedOn = data.approvedOn ? VermontCalendarDay.parse({ isoDate: data.approvedOn }) : undefined;
    this.document = data.documentId ? lookUp({ map: documentsById, id: data.documentId, kind: 'document' }) : undefined;
    this.sourceUrl = data.sourceUrl;
  }

  isDraft(): boolean {
    return this.status === 'draft';
  }

  statusNote(): string {
    if (this.isDraft()) {
      return 'Draft. The committee has not approved these minutes yet, and they may change.';
    }
    return this.approvedOn ? `Approved by the committee on ${this.approvedOn.shortDate()}.` : 'Approved by the committee.';
  }
}

const CAPTION_NOTES: Record<NonNullable<RecordingData['captions']>, string> = {
  human: 'Captions written by a person.',
  automatic: 'Captions made by computer. They may contain errors.',
  none: 'No captions yet. Ask us for a transcript.',
};

export class Recording {
  readonly url: string;
  readonly host: string;
  readonly postedAt: VermontTime;
  readonly captions: RecordingData['captions'] | undefined;

  constructor({ data }: { data: RecordingData }) {
    this.url = data.url;
    this.host = data.host;
    this.postedAt = VermontTime.parse({ isoInstant: data.postedAt });
    this.captions = data.captions;
  }

  captionNote(): string | undefined {
    if (this.captions === undefined) return undefined;
    return CAPTION_NOTES[this.captions];
  }

  mustStayUpUntil({ minutes }: { minutes: Minutes }): VermontCalendarDay {
    return minutes.postedAt.calendarDay().plusDays({ days: 30 });
  }
}

export function lookUp<Value>({ map, id, kind }: { map: Map<string, Value>; id: string; kind: string }): Value {
  const value = map.get(id);
  if (value === undefined) throw new Error(`No ${kind} with id "${id}". Check the spelling in the content file.`);
  return value;
}
