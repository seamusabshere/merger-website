import { District } from './District.ts';
import { Document } from './Document.ts';
import { Meeting, type OverdueDuty } from './Meeting.ts';
import { lookUp } from './MeetingParts.ts';
import { Facilitator, Member } from './Member.ts';
import type { CommitteeData, DistrictData, DocumentData, MeetingData, MemberData } from './schemas.ts';
import { VermontCalendarDay, type VermontTime } from './VermontTime.ts';

export class MeetingMonth {
  readonly label: string;
  readonly meetings: Meeting[];

  constructor({ label, meetings }: { label: string; meetings: Meeting[] }) {
    this.label = label;
    this.meetings = meetings;
  }
}

export class DistrictVotes {
  readonly district: District;
  readonly count: number;

  constructor({ district, count }: { district: District; count: number }) {
    this.district = district;
    this.count = count;
  }

  label(): string {
    return this.count === 1 ? '1 vote' : `${this.count} votes`;
  }

  clause(): string {
    return `${this.district.city} has ${this.label()}`;
  }
}

export class ProportionalRepresentation {
  readonly decidedAt: Meeting;
  readonly districtVotes: DistrictVotes[];

  constructor({ decidedAt, districtVotes, districts }: { decidedAt: Meeting; districtVotes: DistrictVotes[]; districts: District[] }) {
    const votedDistrictIds = new Set(districtVotes.map((districtVotes) => districtVotes.district.id));
    const missingDistricts = districts.filter((district) => !votedDistrictIds.has(district.id));
    if (missingDistricts.length > 0 || votedDistrictIds.size !== districts.length) {
      const missing = missingDistricts.map((district) => district.id).join(', ');
      throw new Error(`Proportional representation must name every district once. Missing: ${missing || 'none'}.`);
    }
    this.decidedAt = decidedAt;
    this.districtVotes = districtVotes;
  }

  forDistrict({ district }: { district: District }): DistrictVotes {
    const districtVotes = this.districtVotes.find((votes) => votes.district === district);
    if (!districtVotes) throw new Error(`No vote count for ${district.name}.`);
    return districtVotes;
  }

  wasDecidedAt({ meeting }: { meeting: Meeting }): boolean {
    return this.decidedAt === meeting;
  }

  summary(): string {
    const clauses = this.districtVotes.map((districtVotes) => districtVotes.clause());
    const lastClause = clauses.at(-1) ?? '';
    const leadingClauses = clauses.slice(0, -1);
    if (leadingClauses.length === 0) return lastClause;
    return `${leadingClauses.join(', ')}, and ${lastClause}`;
  }
}

export class DistrictDelegation {
  readonly district: District;
  readonly votes: DistrictVotes;
  readonly members: Member[];
  readonly alternates: Member[];

  constructor({
    district,
    votes,
    members,
    alternates,
  }: {
    district: District;
    votes: DistrictVotes;
    members: Member[];
    alternates: Member[];
  }) {
    this.district = district;
    this.votes = votes;
    this.members = members;
    this.alternates = alternates;
  }

  contactMember(): Member | undefined {
    return [...this.members, ...this.alternates].find((member) => member.chairsTheDistrictBoard());
  }
}

export class Committee {
  readonly name: string;
  readonly officialName: string;
  readonly stateGroup: string;
  readonly membersUpdatedOn: VermontCalendarDay;
  readonly proportionalRepresentation: ProportionalRepresentation;
  readonly facilitator: Facilitator;
  readonly chair: Member;
  readonly districts: District[];
  readonly members: Member[];
  readonly meetings: Meeting[];
  readonly documents: Document[];

  constructor({
    committeeData,
    districtsData,
    membersData,
    meetingsData,
    documentsData,
  }: {
    committeeData: CommitteeData;
    districtsData: DistrictData[];
    membersData: MemberData[];
    meetingsData: { id: string; data: MeetingData }[];
    documentsData: { id: string; data: DocumentData }[];
  }) {
    this.name = committeeData.name;
    this.officialName = committeeData.officialName;
    this.stateGroup = committeeData.stateGroup;
    this.membersUpdatedOn = VermontCalendarDay.parse({ isoDate: committeeData.membersUpdatedOn });
    this.facilitator = new Facilitator({
      name: committeeData.facilitator.name,
      title: committeeData.facilitator.title,
      organization: committeeData.facilitator.organization,
      organizationUrl: committeeData.facilitator.organizationUrl,
      email: committeeData.facilitator.email,
      phone: committeeData.facilitator.phone,
      sourceTitle: committeeData.facilitator.source.title,
      sourceUrl: committeeData.facilitator.source.url,
    });

    this.districts = districtsData
      .map((data) => new District({ data }))
      .sort((a, b) => a.compareAlphabetically({ other: b }));
    const districtsById = new Map(this.districts.map((district) => [district.id, district]));

    this.members = membersData
      .map(
        (data) =>
          new Member({
            data,
            district: lookUp({ map: districtsById, id: data.districtId, kind: 'district' }),
            chairsTheCommittee: data.id === committeeData.chairMemberId,
          }),
      )
      .sort((a, b) => a.compareBySurname({ other: b }));
    const chairs = this.members.filter((member) => member.isChair());
    if (chairs.length !== 1) {
      throw new Error(
        `The committee's chair must be exactly one member. chairMemberId is "${committeeData.chairMemberId}" and ${chairs.length} members match.`,
      );
    }
    this.chair = chairs[0]!;
    const membersById = new Map(this.members.map((member) => [member.id, member]));

    this.documents = documentsData
      .map(({ id, data }) => new Document({ id, data }))
      .sort((a, b) => a.compareNewestFirst({ other: b }));
    const documentsById = new Map(this.documents.map((document) => [document.id, document]));

    this.meetings = meetingsData
      .map(({ id, data }) => new Meeting({ id, data, documentsById, membersById }))
      .sort((a, b) => a.startsAt.instant.getTime() - b.startsAt.instant.getTime());
    const meetingsById = new Map(this.meetings.map((meeting) => [meeting.id, meeting]));

    this.proportionalRepresentation = new ProportionalRepresentation({
      decidedAt: lookUp({
        map: meetingsById,
        id: committeeData.proportionalRepresentation.decidedAtMeetingId,
        kind: 'meeting',
      }),
      districtVotes: committeeData.proportionalRepresentation.votes.map(
        (vote) =>
          new DistrictVotes({
            district: lookUp({ map: districtsById, id: vote.districtId, kind: 'district' }),
            count: vote.count,
          }),
      ),
      districts: this.districts,
    });
  }

  meetingById({ id }: { id: string }): Meeting {
    return lookUp({ map: new Map(this.meetings.map((meeting) => [meeting.id, meeting])), id, kind: 'meeting' });
  }

  documentById({ id }: { id: string }): Document {
    return lookUp({ map: new Map(this.documents.map((document) => [document.id, document])), id, kind: 'document' });
  }

  delegations(): DistrictDelegation[] {
    return this.districts.map(
      (district) =>
        new DistrictDelegation({
          district,
          votes: this.proportionalRepresentation.forDistrict({ district }),
          members: this.members.filter((member) => member.district === district && !member.isAlternate()),
          alternates: this.members.filter((member) => member.district === district && member.isAlternate()),
        }),
    );
  }

  upcomingMeetings({ now }: { now: VermontTime }): Meeting[] {
    return this.meetings.filter((meeting) => !meeting.hasStarted({ now }));
  }

  nextMeeting({ now }: { now: VermontTime }): Meeting | undefined {
    return this.upcomingMeetings({ now })[0];
  }

  pastMeetingsByMonth({ now }: { now: VermontTime }): MeetingMonth[] {
    const months = new Map<string, Meeting[]>();
    for (const meeting of [...this.meetings].reverse().filter((meeting) => meeting.hasStarted({ now }))) {
      const key = meeting.day().monthKey();
      months.set(key, [...(months.get(key) ?? []), meeting]);
    }
    return [...months.values()].map((meetings) => new MeetingMonth({ label: meetings[0]!.day().monthAndYear(), meetings }));
  }

  meetingsUsing({ document }: { document: Document }): Meeting[] {
    return this.meetings.filter(
      (meeting) =>
        meeting.documents.includes(document) ||
        meeting.agenda?.document === document ||
        (meeting.agenda?.items.some((item) => item.documents.includes(document)) ?? false),
    );
  }

  records(): Document[] {
    const agendaAndMinutes = new Set(this.meetings.flatMap((meeting) => meeting.agendaAndMinutes()));
    return this.documents.filter((document) => document.createdByTheCommittee && !agendaAndMinutes.has(document));
  }

  overdueDuties({ now }: { now: VermontTime }): OverdueDuty[] {
    return this.meetings.flatMap((meeting) => meeting.overdueDuties({ now }));
  }

  meetingsUpdatedOn(): VermontCalendarDay {
    return latestDay({ days: this.meetings.map((meeting) => meeting.updatedOn) });
  }

  documentsUpdatedOn(): VermontCalendarDay {
    return latestDay({ days: this.documents.map((document) => document.updatedOn) });
  }

  updatedOn(): VermontCalendarDay {
    return latestDay({ days: [this.meetingsUpdatedOn(), this.documentsUpdatedOn(), this.membersUpdatedOn] });
  }

  officialWebsiteStatement(): string {
    const cities = this.districts.map((district) => district.city);
    const lastCity = cities.at(-1) ?? '';
    const leadingCities = cities.slice(0, -1);
    const cityList = leadingCities.length === 0 ? lastCity : `${leadingCities.join(', ')}, and ${lastCity}`;
    return `Official website of the Act 170 Merger Committee for ${cityList}`;
  }

  howYouKnow(): string {
    if (this.districts.every((district) => district.pageThatLinksHere.published)) {
      return "Each school district's website links to this page. That is how you know this is the committee's official website.";
    }
    return "Each school district's website will link to this page. That is how you know this is the committee's official website.";
  }
}

function latestDay({ days }: { days: VermontCalendarDay[] }): VermontCalendarDay {
  return days.reduce((latest, day) => (day.compare({ other: latest }) > 0 ? day : latest));
}
