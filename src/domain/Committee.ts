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

export class DistrictDelegation {
  readonly district: District;
  readonly members: Member[];
  readonly alternates: Member[];

  constructor({ district, members, alternates }: { district: District; members: Member[]; alternates: Member[] }) {
    this.district = district;
    this.members = members;
    this.alternates = alternates;
  }

  contactMember(): Member | undefined {
    return [...this.members, ...this.alternates].find((member) => member.email !== undefined);
  }
}

export class Committee {
  readonly name: string;
  readonly officialName: string;
  readonly stateGroup: string;
  readonly isAdvisoryBody: boolean | null;
  readonly membersUpdatedOn: VermontCalendarDay;
  readonly facilitator: Facilitator;
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
    this.isAdvisoryBody = committeeData.isAdvisoryBody;
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
      .map((data) => new Member({ data, district: lookUp({ map: districtsById, id: data.districtId, kind: 'district' }) }))
      .sort((a, b) => a.compareBySurname({ other: b }));
    const membersById = new Map(this.members.map((member) => [member.id, member]));

    this.documents = documentsData
      .map(({ id, data }) => new Document({ id, data }))
      .sort((a, b) => a.compareNewestFirst({ other: b }));
    const documentsById = new Map(this.documents.map((document) => [document.id, document]));

    this.meetings = meetingsData
      .map(({ id, data }) => new Meeting({ id, data, documentsById, membersById }))
      .sort((a, b) => a.startsAt.instant.getTime() - b.startsAt.instant.getTime());
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
        meeting.documents.includes(document) || (meeting.agenda?.items.some((item) => item.documents.includes(document)) ?? false),
    );
  }

  latestDocuments({ count }: { count: number }): Document[] {
    return this.documents.slice(0, count);
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

  remoteOnlyMeetingsNote(): string {
    if (this.isAdvisoryBody === null) {
      return 'It is not yet settled whether the committee counts as an advisory body under Vermont law. Until it is, every meeting has a physical place you can attend.';
    }
    if (this.isAdvisoryBody) {
      return 'As an advisory body, the committee may meet online only, but must still offer a way to join by phone.';
    }
    return 'The committee is not an advisory body, so every meeting has a physical place you can attend.';
  }
}

function latestDay({ days }: { days: VermontCalendarDay[] }): VermontCalendarDay {
  return days.reduce((latest, day) => (day.compare({ other: latest }) > 0 ? day : latest));
}
