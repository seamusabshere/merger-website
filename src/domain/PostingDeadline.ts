import { CalendarLink, type CalendarEntry } from './Calendar.ts';
import type { Meeting } from './Meeting.ts';
import { OpenMeetingLaw } from './OpenMeetingLaw.ts';
import type { ExpectedMeeting } from './RegularMeetingSchedule.ts';
import type { VermontCalendarDay, VermontTime } from './VermontTime.ts';

type Duty = 'agenda' | 'minutes';

export class PostedRecord {
  readonly postedAt: VermontTime | undefined;
  readonly path: string;

  constructor({ postedAt, path }: { postedAt: VermontTime | undefined; path: string }) {
    this.postedAt = postedAt;
    this.path = path;
  }
}

export class PostingDeadline<DueFor extends Meeting | ExpectedMeeting> implements CalendarEntry {
  readonly meeting: DueFor;
  readonly duty: Duty;
  readonly deadline: VermontTime;
  readonly posted: PostedRecord | undefined;

  constructor({
    meeting,
    duty,
    deadline,
    posted,
  }: {
    meeting: DueFor;
    duty: Duty;
    deadline: VermontTime;
    posted: PostedRecord | undefined;
  }) {
    this.meeting = meeting;
    this.duty = duty;
    this.deadline = deadline;
    this.posted = posted;
  }

  isOverdue({ now }: { now: VermontTime }): boolean {
    return !this.posted && this.deadline.isBefore({ other: now });
  }

  overdueMessage(): string {
    const subject = this.duty === 'agenda' ? 'the agenda was' : 'the minutes were';
    return `${this.meeting.title()}: ${subject} due by ${this.deadline.dateAndTime()} and not posted.`;
  }

  day(): VermontCalendarDay {
    return this.deadline.calendarDay();
  }

  sortsAt(): VermontTime {
    return this.deadline;
  }

  isOver({ now }: { now: VermontTime }): boolean {
    return !now.isBefore({ other: this.deadline });
  }

  calendarKind(): string {
    return 'Set by the Open Meeting Law';
  }

  calendarTitle(): string {
    const record = this.duty === 'agenda' ? 'Agenda' : 'Minutes';
    return `${record} due for the ${this.meeting.day().shortDate()} meeting`;
  }

  calendarTime(): string {
    if (this.duty === 'minutes') return 'By the end of the day';
    return `By ${this.deadline.clockTime()} ${this.deadline.timeZoneAbbreviation()}`;
  }

  calendarDetails(): string[] {
    if (this.posted) {
      return [this.posted.postedAt ? `Posted ${this.posted.postedAt.dateAndTime()}.` : 'Posted.'];
    }
    if (this.duty === 'minutes') {
      return [`Minutes must be on this website within ${OpenMeetingLaw.MINUTES_DAYS} days of the meeting.`];
    }
    return [
      `The agenda must be on this website at least ${OpenMeetingLaw.agendaNoticeHours({ kind: this.meeting.kind })} hours before the meeting.`,
    ];
  }

  calendarLink(): CalendarLink | undefined {
    if (!this.posted) return undefined;
    return new CalendarLink({ href: this.posted.path, text: this.duty === 'agenda' ? 'Read the agenda' : 'Read the minutes' });
  }
}
