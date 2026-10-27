import type { VermontCalendarDay, VermontCalendarMonth, VermontTime } from './VermontTime.ts';

export class CalendarLink {
  readonly href: string;
  readonly text: string;

  constructor({ href, text }: { href: string; text: string }) {
    this.href = href;
    this.text = text;
  }
}

export interface CalendarEntry {
  day(): VermontCalendarDay;
  sortsAt(): VermontTime;
  isOver({ now }: { now: VermontTime }): boolean;
  calendarKind(): string;
  calendarTitle(): string;
  calendarTime(): string | undefined;
  calendarDetails(): string[];
  calendarLink(): CalendarLink | undefined;
}

export class CalendarMonthOfEntries {
  readonly month: VermontCalendarMonth;
  readonly entries: CalendarEntry[];

  constructor({ month, entries }: { month: VermontCalendarMonth; entries: CalendarEntry[] }) {
    this.month = month;
    this.entries = entries;
  }

  headingId(): string {
    return `month-${this.month.isoMonth()}`;
  }
}

export class Calendar {
  readonly entries: CalendarEntry[];

  constructor({ entries }: { entries: CalendarEntry[] }) {
    this.entries = [...entries].sort((a, b) => a.sortsAt().instant.getTime() - b.sortsAt().instant.getTime());
  }

  upcoming({ now }: { now: VermontTime }): Calendar {
    return new Calendar({ entries: this.entries.filter((entry) => !entry.isOver({ now })) });
  }

  months(): CalendarMonthOfEntries[] {
    const months: CalendarMonthOfEntries[] = [];
    for (const entry of this.entries) {
      const month = entry.day().calendarMonth();
      const latest = months.at(-1);
      if (latest && latest.month.compare({ other: month }) === 0) {
        latest.entries.push(entry);
      } else {
        months.push(new CalendarMonthOfEntries({ month, entries: [entry] }));
      }
    }
    return months;
  }
}
