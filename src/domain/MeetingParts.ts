import type { Document } from './Document.ts';
import type { Member } from './Member.ts';
import type {
  AgendaData,
  AgendaItemData,
  ElectronicAccessData,
  MinutesData,
  MotionData,
  PhysicalLocationData,
  RecordingData,
  VoteData,
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

export class AgendaItem {
  readonly number: number;
  readonly title: string;
  readonly description: string | undefined;
  readonly subitems: string[];
  readonly proposedExecutiveSessionNature: string | undefined;
  readonly documents: Document[];

  constructor({ number, data, documents }: { number: number; data: AgendaItemData; documents: Document[] }) {
    this.number = number;
    this.title = data.title;
    this.description = data.description;
    this.subitems = data.subitems;
    this.proposedExecutiveSessionNature = data.proposedExecutiveSession?.natureOfBusiness;
    this.documents = documents;
  }

  heading(): string {
    if (this.proposedExecutiveSessionNature) {
      return `Proposed executive session: ${this.proposedExecutiveSessionNature}`;
    }
    return this.title;
  }
}

export class Agenda {
  readonly postedAt: VermontTime | undefined;
  readonly document: Document;
  readonly items: AgendaItem[];

  constructor({ data, documentsById }: { data: AgendaData; documentsById: Map<string, Document> }) {
    this.postedAt = data.postedAt ? VermontTime.parse({ isoInstant: data.postedAt }) : undefined;
    this.document = lookUp({ map: documentsById, id: data.documentId, kind: 'document' });
    this.items = data.items.map(
      (item, index) =>
        new AgendaItem({
          number: index + 1,
          data: item,
          documents: item.documentIds.map((documentId) => lookUp({ map: documentsById, id: documentId, kind: 'document' })),
        }),
    );
  }

  hasPublicComment(): boolean {
    return this.items.some((item) => /public (input|comment)/i.test(item.title));
  }
}

const VOTE_WORDS: Record<'yes' | 'no' | 'abstain' | 'absent', string> = {
  yes: 'Yes',
  no: 'No',
  abstain: 'Abstained',
  absent: 'Absent',
};

export class RollCallEntry {
  readonly member: Member;
  readonly vote: 'yes' | 'no' | 'abstain' | 'absent';

  constructor({ member, vote }: { member: Member; vote: 'yes' | 'no' | 'abstain' | 'absent' }) {
    this.member = member;
    this.vote = vote;
  }

  voteWord(): string {
    return VOTE_WORDS[this.vote];
  }
}

const VOTE_METHOD_NAMES: Record<VoteData['method'], string> = {
  voice: 'Voice vote',
  'roll-call': 'Roll call vote',
  'unanimous-consent': 'Unanimous consent',
  consensus: 'Consensus',
};

export class Vote {
  readonly method: VoteData['method'];
  readonly yes: number | undefined;
  readonly no: number | undefined;
  readonly abstain: number | undefined;
  readonly rollCall: RollCallEntry[];

  constructor({ data, membersById }: { data: VoteData; membersById: Map<string, Member> }) {
    this.method = data.method;
    this.yes = data.yes;
    this.no = data.no;
    this.abstain = data.abstain;
    this.rollCall = data.rollCall.map(
      (entry) => new RollCallEntry({ member: lookUp({ map: membersById, id: entry.memberId, kind: 'member' }), vote: entry.vote }),
    );
  }

  isRollCall(): boolean {
    return this.method === 'roll-call';
  }

  describe(): string {
    const counts = [
      this.yes !== undefined ? `${this.yes} yes` : undefined,
      this.no !== undefined ? `${this.no} no` : undefined,
      this.abstain !== undefined ? `${this.abstain} abstained` : undefined,
    ].filter(Boolean);
    return counts.length > 0 ? `${VOTE_METHOD_NAMES[this.method]}: ${counts.join(', ')}` : VOTE_METHOD_NAMES[this.method];
  }
}

const MOTION_RESULT_WORDS: Record<MotionData['result'], string> = {
  passed: 'Passed',
  failed: 'Failed',
  withdrawn: 'Withdrawn',
  tabled: 'Tabled',
};

export class Motion {
  readonly text: string;
  readonly movedBy: Member | undefined;
  readonly secondedBy: Member | undefined;
  readonly result: MotionData['result'];
  readonly vote: Vote | undefined;

  constructor({ data, membersById }: { data: MotionData; membersById: Map<string, Member> }) {
    this.text = data.text;
    this.movedBy = data.movedByMemberId ? lookUp({ map: membersById, id: data.movedByMemberId, kind: 'member' }) : undefined;
    this.secondedBy = data.secondedByMemberId
      ? lookUp({ map: membersById, id: data.secondedByMemberId, kind: 'member' })
      : undefined;
    this.result = data.result;
    this.vote = data.vote ? new Vote({ data: data.vote, membersById }) : undefined;
  }

  resultWord(): string {
    return MOTION_RESULT_WORDS[this.result];
  }
}

export class Minutes {
  readonly status: 'draft' | 'approved';
  readonly postedAt: VermontTime;
  readonly approvedOn: VermontCalendarDay | undefined;
  readonly document: Document | undefined;
  readonly sourceUrl: string | undefined;
  readonly membersPresent: Member[];
  readonly otherParticipants: string[];
  readonly discussion: { topic: string; summary: string }[];
  readonly motions: Motion[];

  constructor({
    data,
    membersById,
    documentsById,
  }: {
    data: MinutesData;
    membersById: Map<string, Member>;
    documentsById: Map<string, Document>;
  }) {
    this.status = data.status;
    this.postedAt = VermontTime.parse({ isoInstant: data.postedAt });
    this.approvedOn = data.approvedOn ? VermontCalendarDay.parse({ isoDate: data.approvedOn }) : undefined;
    this.document = data.documentId ? lookUp({ map: documentsById, id: data.documentId, kind: 'document' }) : undefined;
    this.sourceUrl = data.sourceUrl;
    this.membersPresent = data.membersPresentIds.map((memberId) => lookUp({ map: membersById, id: memberId, kind: 'member' }));
    this.otherParticipants = data.otherParticipants;
    this.discussion = data.discussion;
    this.motions = data.motions.map((motion) => new Motion({ data: motion, membersById }));
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

const CAPTION_NOTES: Record<RecordingData['captions'], string> = {
  human: 'Captions written by a person.',
  automatic: 'Captions made by computer. They may contain errors.',
  none: 'No captions yet. Ask us for a transcript.',
};

export class Recording {
  readonly url: string;
  readonly host: string;
  readonly postedAt: VermontTime;
  readonly captions: RecordingData['captions'];

  constructor({ data }: { data: RecordingData }) {
    this.url = data.url;
    this.host = data.host;
    this.postedAt = VermontTime.parse({ isoInstant: data.postedAt });
    this.captions = data.captions;
  }

  captionNote(): string {
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
