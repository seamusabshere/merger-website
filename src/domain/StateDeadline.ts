import { CalendarLink, type CalendarEntry } from './Calendar.ts';
import type { StateDeadlineData } from './schemas.ts';
import { VermontCalendarDay, type VermontTime } from './VermontTime.ts';

export class StateDeadline implements CalendarEntry {
  readonly id: string;
  readonly on: VermontCalendarDay;
  readonly timing: StateDeadlineData['timing'];
  readonly updatedOn: VermontCalendarDay;
  readonly title: string;
  readonly description: string;
  readonly citationTitle: string;
  readonly citationUrl: string;

  constructor({ data }: { data: StateDeadlineData }) {
    this.id = data.id;
    this.on = VermontCalendarDay.parse({ isoDate: data.on });
    this.timing = data.timing;
    this.updatedOn = VermontCalendarDay.parse({ isoDate: data.updatedOn });
    this.title = data.title;
    this.description = data.description;
    this.citationTitle = data.citation.title;
    this.citationUrl = data.citation.url;
  }

  dateLabel(): string {
    return this.timing === 'on-or-before' ? `By ${this.on.shortDate()}` : this.on.shortDate();
  }

  day(): VermontCalendarDay {
    return this.on;
  }

  sortsAt(): VermontTime {
    return this.on.startsAt();
  }

  isOver({ now }: { now: VermontTime }): boolean {
    return !now.isBefore({ other: this.on.endsAt() });
  }

  calendarKind(): string {
    return 'Set by Act 170';
  }

  calendarTitle(): string {
    return this.title;
  }

  calendarTime(): string | undefined {
    return this.timing === 'on-or-before' ? 'On or before this date' : undefined;
  }

  calendarDetails(): string[] {
    return [this.description];
  }

  calendarLink(): CalendarLink {
    return new CalendarLink({ href: this.citationUrl, text: this.citationTitle });
  }
}
