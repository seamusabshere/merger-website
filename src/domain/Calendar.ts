import type { VermontCalendarDay, VermontTime } from './VermontTime.ts';

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

export class Calendar {
  readonly entries: CalendarEntry[];

  constructor({ entries }: { entries: CalendarEntry[] }) {
    this.entries = [...entries].sort((a, b) => a.sortsAt().instant.getTime() - b.sortsAt().instant.getTime());
  }

  upcoming({ now }: { now: VermontTime }): Calendar {
    return new Calendar({ entries: this.entries.filter((entry) => !entry.isOver({ now })) });
  }
}
