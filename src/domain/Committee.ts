import { Deadlines } from './Deadlines.ts';
import { District } from './District.ts';
import { Document } from './Document.ts';
import { Meeting } from './Meeting.ts';
import { lookUp } from './MeetingParts.ts';
import { Facilitator, Member } from './Member.ts';
import type { PostingDeadline } from './PostingDeadline.ts';
import { RegularMeetingSchedule, type ExpectedMeeting } from './RegularMeetingSchedule.ts';
import type { CommitteeData, DistrictData, DocumentData, MeetingData, MemberData, StateDeadlineData } from './schemas.ts';
import { StateDeadline } from './StateDeadline.ts';
import { VermontCalendarDay, type VermontTime } from './VermontTime.ts';

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
  readonly regularMeetingSchedule: RegularMeetingSchedule;
  readonly stateDeadlines: StateDeadline[];

  constructor({
    committeeData,
    districtsData,
    membersData,
    meetingsData,
    documentsData,
    stateDeadlinesData,
  }: {
    committeeData: CommitteeData;
    districtsData: DistrictData[];
    membersData: MemberData[];
    meetingsData: { id: string; data: MeetingData }[];
    documentsData: { id: string; data: DocumentData }[];
    stateDeadlinesData: StateDeadlineData[];
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
    this.documents = documentsData
      .map(({ id, data }) => new Document({ id, data }))
      .sort((a, b) => a.compareNewestFirst({ other: b }));
    const documentsById = new Map(this.documents.map((document) => [document.id, document]));

    this.meetings = meetingsData
      .map(({ id, data }) => new Meeting({ id, data, documentsById }))
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

    this.regularMeetingSchedule = new RegularMeetingSchedule({ data: committeeData.regularMeetingSchedule });

    this.stateDeadlines = stateDeadlinesData.map((data) => new StateDeadline({ data }));
  }

  stateDeadlineById({ id }: { id: string }): StateDeadline {
    return lookUp({ map: new Map(this.stateDeadlines.map((stateDeadline) => [stateDeadline.id, stateDeadline])), id, kind: 'state deadline' });
  }

  expectedMeetings(): ExpectedMeeting[] {
    return this.regularMeetingSchedule.expectedMeetings({ meetings: this.meetings });
  }

  // An expected meeting in the past means a meeting file is missing, or the month should be in cancelledMonths.
  pastExpectedMeetings({ now }: { now: VermontTime }): ExpectedMeeting[] {
    return this.expectedMeetings().filter((expectedMeeting) => expectedMeeting.isOver({ now }));
  }

  deadlines(): Deadlines {
    return new Deadlines({ stateDeadlines: this.stateDeadlines });
  }

  upcomingPublicMeetings({ now }: { now: VermontTime }): (Meeting | ExpectedMeeting)[] {
    return [...this.upcomingMeetings({ now }), ...this.expectedMeetings().filter((expectedMeeting) => !expectedMeeting.isOver({ now }))].sort(
      (a, b) => a.startsAt.instant.getTime() - b.startsAt.instant.getTime(),
    );
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

  pastMeetings({ now }: { now: VermontTime }): Meeting[] {
    return this.meetings.filter((meeting) => meeting.hasStarted({ now })).reverse();
  }

  meetingsUsing({ document }: { document: Document }): Meeting[] {
    return this.meetings.filter(
      (meeting) =>
        meeting.documents.includes(document) ||
        meeting.agenda?.document === document ||
        meeting.minutes?.document === document,
    );
  }

  records(): Document[] {
    const agendaAndMinutes = this.agendaAndMinutes();
    return this.documents.filter((document) => document.createdByTheCommittee && !agendaAndMinutes.has(document));
  }

  recordsFromOtherSources(): Document[] {
    const agendaAndMinutes = this.agendaAndMinutes();
    return this.documents.filter((document) => !document.createdByTheCommittee && !agendaAndMinutes.has(document));
  }

  private agendaAndMinutes(): Set<Document> {
    return new Set(this.meetings.flatMap((meeting) => meeting.agendaAndMinutes()));
  }

  overdueDuties({ now }: { now: VermontTime }): PostingDeadline[] {
    return this.meetings.flatMap((meeting) => meeting.overdueDuties({ now }));
  }

  meetingsUpdatedOn(): VermontCalendarDay {
    return latestDay({
      days: [this.regularMeetingSchedule.updatedOn, ...this.meetings.map((meeting) => meeting.updatedOn)],
    });
  }

  documentsUpdatedOn(): VermontCalendarDay {
    return latestDay({ days: this.documents.map((document) => document.updatedOn) });
  }

  deadlinesUpdatedOn(): VermontCalendarDay {
    return latestDay({ days: this.stateDeadlines.map((stateDeadline) => stateDeadline.updatedOn) });
  }

  updatedOn(): VermontCalendarDay {
    return latestDay({
      days: [this.meetingsUpdatedOn(), this.deadlinesUpdatedOn(), this.documentsUpdatedOn(), this.membersUpdatedOn],
    });
  }

  cityList(): string {
    return englishList({ items: this.districts.map((district) => district.city) });
  }

  districtAbbreviationList(): string {
    return englishList({ items: this.districts.map((district) => district.abbreviation) });
  }

  schemaOrgOrganization({ siteUrl }: { siteUrl: string }): Record<string, unknown> {
    return {
      '@type': 'Organization',
      name: this.name,
      alternateName: this.officialName,
      url: siteUrl,
    };
  }
}

function englishList({ items }: { items: string[] }): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function latestDay({ days }: { days: VermontCalendarDay[] }): VermontCalendarDay {
  return days.reduce((latest, day) => (day.compare({ other: latest }) > 0 ? day : latest));
}
