import type { Meeting } from './Meeting.ts';
import type { VermontTime } from './VermontTime.ts';

type Duty = 'agenda' | 'minutes';

export class PostedRecord {
  readonly postedAt: VermontTime | undefined;
  readonly path: string;

  constructor({ postedAt, path }: { postedAt: VermontTime | undefined; path: string }) {
    this.postedAt = postedAt;
    this.path = path;
  }
}

export class PostingDeadline {
  readonly meeting: Meeting;
  readonly duty: Duty;
  readonly deadline: VermontTime;
  readonly posted: PostedRecord | undefined;

  constructor({
    meeting,
    duty,
    deadline,
    posted,
  }: {
    meeting: Meeting;
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
}
