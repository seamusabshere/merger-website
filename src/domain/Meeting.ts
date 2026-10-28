import type { Committee } from './Committee.ts';
import type { Document } from './Document.ts';
import type { Member } from './Member.ts';
import { Agenda, ElectronicAccess, lookUp, Minutes, PhysicalLocation, Recording } from './MeetingParts.ts';
import { OpenMeetingLaw } from './OpenMeetingLaw.ts';
import { PostedRecord, PostingDeadline } from './PostingDeadline.ts';
import type { MeetingData } from './schemas.ts';
import { VermontCalendarDay, VermontTime } from './VermontTime.ts';

const KIND_NAMES: Record<MeetingData['kind'], string> = {
  regular: 'Regular meeting',
  special: 'Special meeting',
  emergency: 'Emergency meeting',
};

export class Meeting {
  readonly id: string;
  readonly kind: MeetingData['kind'];
  readonly startsAt: VermontTime;
  readonly endsAt: VermontTime | undefined;
  readonly updatedOn: VermontCalendarDay;
  readonly physicalLocation: PhysicalLocation | undefined;
  readonly electronicAccess: ElectronicAccess | undefined;
  readonly agenda: Agenda | undefined;
  readonly minutes: Minutes | undefined;
  readonly recording: Recording | undefined;
  readonly documents: Document[];
  readonly notes: string[];

  constructor({
    id,
    data,
    documentsById,
    membersById,
  }: {
    id: string;
    data: MeetingData;
    documentsById: Map<string, Document>;
    membersById: Map<string, Member>;
  }) {
    this.id = id;
    this.kind = data.kind;
    this.startsAt = VermontTime.parse({ isoInstant: data.startsAt });
    this.endsAt = data.endsAt ? VermontTime.parse({ isoInstant: data.endsAt }) : undefined;
    this.updatedOn = VermontCalendarDay.parse({ isoDate: data.updatedOn });
    this.physicalLocation = data.physicalLocation ? new PhysicalLocation({ data: data.physicalLocation }) : undefined;
    this.electronicAccess = data.electronicAccess ? new ElectronicAccess({ data: data.electronicAccess }) : undefined;
    this.agenda = data.agenda ? new Agenda({ data: data.agenda, documentsById }) : undefined;
    this.minutes = data.minutes ? new Minutes({ data: data.minutes, membersById, documentsById }) : undefined;
    this.recording = data.recording ? new Recording({ data: data.recording }) : undefined;
    this.documents = data.documentIds.map((documentId) => lookUp({ map: documentsById, id: documentId, kind: 'document' }));
    this.notes = data.notes;
  }

  kindName(): string {
    return KIND_NAMES[this.kind];
  }

  day(): VermontCalendarDay {
    return this.startsAt.calendarDay();
  }

  title(): string {
    return `Committee meeting, ${this.day().longDate()}`;
  }

  timeRange(): string {
    if (!this.endsAt) return `${this.startsAt.clockTime()} ${this.startsAt.timeZoneAbbreviation()}`;
    return `${this.startsAt.clockTime()} to ${this.endsAt.clockTime()} ${this.endsAt.timeZoneAbbreviation()}`;
  }

  path(): string {
    return `/meetings/${this.id}/`;
  }

  calendarFilePath(): string {
    return `/meetings/${this.id}.ics`;
  }

  hasStarted({ now }: { now: VermontTime }): boolean {
    return !now.isBefore({ other: this.startsAt });
  }

  // A meeting with no stated end stays open to join through the end of that calendar day.
  hasEnded({ now }: { now: VermontTime }): boolean {
    return !now.isBefore({ other: this.endsAt ?? this.day().endsAt() });
  }

  agendaDeadline(): VermontTime | undefined {
    return OpenMeetingLaw.agendaDeadline({ kind: this.kind, startsAt: this.startsAt });
  }

  minutesDeadline(): VermontTime {
    return OpenMeetingLaw.minutesDeadline({ meetingDay: this.day() });
  }

  minutesKeepUntil(): VermontCalendarDay {
    return OpenMeetingLaw.minutesKeepUntil({ meetingDay: this.day() });
  }

  hasPostedAgenda(): boolean {
    return this.agenda !== undefined;
  }

  agendaAndMinutes(): Document[] {
    return [this.agenda?.document, this.minutes?.document].filter((document): document is Document => document !== undefined);
  }

  postingDeadlines(): PostingDeadline[] {
    const agendaDeadline = this.agendaDeadline();
    return [
      agendaDeadline &&
        new PostingDeadline({
          meeting: this,
          duty: 'agenda',
          deadline: agendaDeadline,
          posted: this.agenda && new PostedRecord({ postedAt: this.agenda.postedAt, path: `${this.path()}#agenda` }),
        }),
      new PostingDeadline({
        meeting: this,
        duty: 'minutes',
        deadline: this.minutesDeadline(),
        posted: this.minutes && new PostedRecord({ postedAt: this.minutes.postedAt, path: `${this.path()}#minutes` }),
      }),
    ].filter((postingDeadline): postingDeadline is PostingDeadline => postingDeadline !== undefined);
  }

  overdueDuties({ now }: { now: VermontTime }): PostingDeadline[] {
    return this.postingDeadlines().filter((postingDeadline) => postingDeadline.isOverdue({ now }));
  }

  schemaOrgEvent({
    siteUrl,
    committee,
    now,
  }: {
    siteUrl: string;
    committee: Committee;
    now: VermontTime;
  }): Record<string, unknown> {
    const pageUrl = new URL(this.path(), siteUrl).toString();
    const place = this.physicalLocation && {
      '@type': 'Place',
      name: this.physicalLocation.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: this.physicalLocation.streetAddress,
        addressLocality: this.physicalLocation.city,
        addressRegion: this.physicalLocation.state,
        postalCode: this.physicalLocation.postalCode,
        addressCountry: 'US',
      },
    };
    const joinUrl = this.hasEnded({ now }) ? undefined : this.electronicAccess?.url;
    const virtualLocation = this.electronicAccess && {
      '@type': 'VirtualLocation',
      // Google rejects a VirtualLocation without a url, so the meeting page stands in until the join link is known.
      // After the meeting, the page stands in again so the old video link is not offered as a way to join.
      url: joinUrl ?? pageUrl,
    };
    const locations = [place, virtualLocation].filter((location) => location);
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `${committee.name}: ${this.kindName()}`,
      description: `${this.kindName()} of the ${committee.name}. Open to the public.`,
      startDate: this.startsAt.isoStringWithOffset(),
      ...(this.endsAt && { endDate: this.endsAt.isoStringWithOffset() }),
      eventStatus: 'https://schema.org/EventScheduled',
      ...(this.physicalLocation &&
        this.electronicAccess && { eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode' }),
      ...(this.physicalLocation &&
        !this.electronicAccess && { eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode' }),
      ...(!this.physicalLocation &&
        this.electronicAccess && { eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode' }),
      ...(locations.length > 0 && { location: locations.length === 1 ? locations[0] : locations }),
      isAccessibleForFree: true,
      organizer: committee.schemaOrgOrganization({ siteUrl }),
      url: pageUrl,
    };
  }

  calendarEvent({ siteUrl }: { siteUrl: string }): string {
    const pageUrl = new URL(this.path(), siteUrl).toString();
    const description = [
      'Burlington, South Burlington, and Winooski Act 170 merger committee.',
      this.electronicAccess?.url ? `Join online: ${this.electronicAccess.url}` : undefined,
      this.electronicAccess?.phoneNumber
        ? `Join by phone: ${this.electronicAccess.phoneNumber}${this.electronicAccess.phonePin ? `, PIN ${this.electronicAccess.phonePin}` : ''}`
        : undefined,
      `Agenda and details: ${pageUrl}`,
    ]
      .filter(Boolean)
      .join('\n');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//burlington-south-burlington-winooski-merger-study.org//Meetings//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${this.id}@burlington-south-burlington-winooski-merger-study.org`,
      `DTSTAMP:${this.updatedOn.endsAt().iCalendarUtc()}`,
      `DTSTART:${this.startsAt.iCalendarUtc()}`,
      this.endsAt ? `DTEND:${this.endsAt.iCalendarUtc()}` : undefined,
      `SUMMARY:${escapeCalendarText({ text: 'Merger study committee meeting' })}`,
      this.physicalLocation ? `LOCATION:${escapeCalendarText({ text: this.physicalLocation.singleLine() })}` : undefined,
      `DESCRIPTION:${escapeCalendarText({ text: description })}`,
      `URL:${pageUrl}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter((line): line is string => line !== undefined);
    return lines.map((line) => foldCalendarLine({ line })).join('\r\n') + '\r\n';
  }
}

function escapeCalendarText({ text }: { text: string }): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function foldCalendarLine({ line }: { line: string }): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const pieces: string[] = [];
  let current = '';
  for (const character of line) {
    if (encoder.encode(current + character).length > (pieces.length === 0 ? 75 : 74)) {
      pieces.push(current);
      current = '';
    }
    current += character;
  }
  pieces.push(current);
  return pieces.join('\r\n ');
}
