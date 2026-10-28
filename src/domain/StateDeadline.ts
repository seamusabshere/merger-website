import type { StateDeadlineData } from './schemas.ts';
import { VermontCalendarDay, type VermontTime } from './VermontTime.ts';

export class StateDeadline {
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

  isOver({ now }: { now: VermontTime }): boolean {
    return !now.isBefore({ other: this.on.endsAt() });
  }
}
