import type { Document } from './Document.ts';
import type { Member } from './Member.ts';
import { Agenda, ElectronicAccess, lookUp, Minutes, PhysicalLocation, Recording } from './MeetingParts.ts';
import type { MeetingData } from './schemas.ts';
import { VermontCalendarDay, VermontTime } from './VermontTime.ts';

const AGENDA_NOTICE_HOURS: Record<MeetingData['kind'], number | undefined> = {
  regular: 48,
  special: 24,
  emergency: undefined,
};

const KIND_NAMES: Record<MeetingData['kind'], string> = {
  regular: 'Regular meeting',
  special: 'Special meeting',
  emergency: 'Emergency meeting',
};

export class OverdueDuty {
  readonly meeting: Meeting;
  readonly duty: 'agenda' | 'minutes';
  readonly deadline: VermontTime;

  constructor({ meeting, duty, deadline }: { meeting: Meeting; duty: 'agenda' | 'minutes'; deadline: VermontTime }) {
    this.meeting = meeting;
    this.duty = duty;
    this.deadline = deadline;
  }

  describe(): string {
    const subject = this.duty === 'agenda' ? 'the agenda was' : 'the minutes were';
    return `${this.meeting.title()}: ${subject} due by ${this.deadline.dateAndTime()} and not posted.`;
  }
}

export class Meeting {
  readonly id: string;
  readonly kind: MeetingData['kind'];
  readonly startsAt: VermontTime;
  readonly endsAt: VermontTime | undefined;
  readonly updatedOn: VermontCalendarDay;
  readonly physicalLocation: PhysicalLocation;
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
    this.physicalLocation = new PhysicalLocation({ data: data.physicalLocation });
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

  agendaDeadline(): VermontTime | undefined {
    const hours = AGENDA_NOTICE_HOURS[this.kind];
    return hours === undefined ? undefined : this.startsAt.plusHours({ hours: -hours });
  }

  minutesDeadline(): VermontTime {
    return this.day().plusDays({ days: 5 }).endsAt();
  }

  minutesKeepUntil(): VermontCalendarDay {
    return this.day().plusYears({ years: 1 });
  }

  hasPostedAgenda(): boolean {
    return this.agenda !== undefined;
  }

  agendaAndMinutes(): Document[] {
    return [this.agenda?.document, this.minutes?.document].filter((document): document is Document => document !== undefined);
  }

  overdueDuties({ now }: { now: VermontTime }): OverdueDuty[] {
    const overdue: OverdueDuty[] = [];
    const agendaDeadline = this.agendaDeadline();
    if (agendaDeadline && !this.hasPostedAgenda() && agendaDeadline.isBefore({ other: now })) {
      overdue.push(new OverdueDuty({ meeting: this, duty: 'agenda', deadline: agendaDeadline }));
    }
    if (!this.minutes && this.minutesDeadline().isBefore({ other: now })) {
      overdue.push(new OverdueDuty({ meeting: this, duty: 'minutes', deadline: this.minutesDeadline() }));
    }
    return overdue;
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
      `LOCATION:${escapeCalendarText({ text: this.physicalLocation.singleLine() })}`,
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
