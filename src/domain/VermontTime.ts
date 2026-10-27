const VERMONT_TIME_ZONE = 'America/New_York';

export class VermontTime {
  readonly instant: Date;

  constructor({ instant }: { instant: Date }) {
    this.instant = instant;
  }

  static parse({ isoInstant }: { isoInstant: string }): VermontTime {
    const instant = new Date(isoInstant);
    if (Number.isNaN(instant.getTime())) {
      throw new Error(`Not a valid date and time: ${isoInstant}`);
    }
    return new VermontTime({ instant });
  }

  static now(): VermontTime {
    return new VermontTime({ instant: new Date() });
  }

  static fromWallClock({
    year,
    month,
    day,
    hour,
    minute,
    second,
  }: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  }): VermontTime {
    const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    const firstGuess = new Date(wallClockAsUtc - VermontTime.offsetMinutesAt({ instant: new Date(wallClockAsUtc) }) * 60_000);
    // A second pass corrects guesses that land on the other side of a daylight saving change.
    const instant = new Date(wallClockAsUtc - VermontTime.offsetMinutesAt({ instant: firstGuess }) * 60_000);
    return new VermontTime({ instant });
  }

  private static offsetMinutesAt({ instant }: { instant: Date }): number {
    const offsetName = new Intl.DateTimeFormat('en-US', {
      timeZone: VERMONT_TIME_ZONE,
      timeZoneName: 'longOffset',
    })
      .formatToParts(instant)
      .find((part) => part.type === 'timeZoneName')!.value;
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(offsetName);
    if (!match) return 0;
    const sign = match[1] === '-' ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3]));
  }

  plusHours({ hours }: { hours: number }): VermontTime {
    return new VermontTime({ instant: new Date(this.instant.getTime() + hours * 3_600_000) });
  }

  isBefore({ other }: { other: VermontTime }): boolean {
    return this.instant.getTime() < other.instant.getTime();
  }

  calendarDay(): VermontCalendarDay {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: VERMONT_TIME_ZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(this.instant);
    const value = (type: string) => Number(parts.find((part) => part.type === type)!.value);
    return new VermontCalendarDay({ year: value('year'), month: value('month'), day: value('day') });
  }

  clockTime(): string {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: VERMONT_TIME_ZONE,
      hour: 'numeric',
      minute: '2-digit',
    })
      .format(this.instant)
      .replace('AM', 'a.m.')
      .replace('PM', 'p.m.');
  }

  timeZoneAbbreviation(): string {
    return new Intl.DateTimeFormat('en-US', { timeZone: VERMONT_TIME_ZONE, timeZoneName: 'short' })
      .formatToParts(this.instant)
      .find((part) => part.type === 'timeZoneName')!.value;
  }

  dateAndTime(): string {
    return `${this.calendarDay().longDate()}, ${this.clockTime()} ${this.timeZoneAbbreviation()}`;
  }

  isoString(): string {
    return this.instant.toISOString();
  }

  isoStringWithOffset(): string {
    const offsetMinutes = VermontTime.offsetMinutesAt({ instant: this.instant });
    const wallClock = new Date(this.instant.getTime() + offsetMinutes * 60_000).toISOString().replace(/\.\d{3}Z$/, '');
    const sign = offsetMinutes < 0 ? '-' : '+';
    const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
    return `${wallClock}${sign}${hours}:${minutes}`;
  }

  iCalendarUtc(): string {
    return this.instant.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
}

export class VermontCalendarDay {
  readonly year: number;
  readonly month: number;
  readonly day: number;

  constructor({ year, month, day }: { year: number; month: number; day: number }) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  static parse({ isoDate }: { isoDate: string }): VermontCalendarDay {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!match) throw new Error(`Not a calendar date like 2026-11-02: ${isoDate}`);
    return new VermontCalendarDay({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) });
  }

  plusDays({ days }: { days: number }): VermontCalendarDay {
    const shifted = new Date(Date.UTC(this.year, this.month - 1, this.day + days));
    return new VermontCalendarDay({
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
    });
  }

  plusYears({ years }: { years: number }): VermontCalendarDay {
    return new VermontCalendarDay({ year: this.year + years, month: this.month, day: this.day });
  }

  startsAt(): VermontTime {
    return VermontTime.fromWallClock({ year: this.year, month: this.month, day: this.day, hour: 0, minute: 0, second: 0 });
  }

  endsAt(): VermontTime {
    return VermontTime.fromWallClock({ year: this.year, month: this.month, day: this.day, hour: 23, minute: 59, second: 59 });
  }

  calendarMonth(): VermontCalendarMonth {
    return new VermontCalendarMonth({ year: this.year, month: this.month });
  }

  weekday(): Weekday {
    return WEEKDAYS[this.asUtcNoon().getUTCDay()]!;
  }

  compare({ other }: { other: VermontCalendarDay }): number {
    return this.isoDate().localeCompare(other.isoDate());
  }

  isoDate(): string {
    return `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
  }

  private asUtcNoon(): Date {
    return new Date(Date.UTC(this.year, this.month - 1, this.day, 12));
  }

  longDate(): string {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(this.asUtcNoon());
  }

  shortDate(): string {
    return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(
      this.asUtcNoon(),
    );
  }
}

export const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export class VermontCalendarMonth {
  readonly year: number;
  readonly month: number;

  constructor({ year, month }: { year: number; month: number }) {
    this.year = year;
    this.month = month;
  }

  static parse({ isoMonth }: { isoMonth: string }): VermontCalendarMonth {
    const match = /^(\d{4})-(\d{2})$/.exec(isoMonth);
    if (!match) throw new Error(`Not a month like 2026-11: ${isoMonth}`);
    return new VermontCalendarMonth({ year: Number(match[1]), month: Number(match[2]) });
  }

  next(): VermontCalendarMonth {
    return this.month === 12
      ? new VermontCalendarMonth({ year: this.year + 1, month: 1 })
      : new VermontCalendarMonth({ year: this.year, month: this.month + 1 });
  }

  firstDay(): VermontCalendarDay {
    return new VermontCalendarDay({ year: this.year, month: this.month, day: 1 });
  }

  // The first Monday is occurrence 1 of Monday; the third Tuesday is occurrence 3 of Tuesday.
  nthWeekday({ weekday, occurrence }: { weekday: Weekday; occurrence: number }): VermontCalendarDay {
    const daysUntilWeekday = (WEEKDAYS.indexOf(weekday) - WEEKDAYS.indexOf(this.firstDay().weekday()) + 7) % 7;
    return this.firstDay().plusDays({ days: daysUntilWeekday + (occurrence - 1) * 7 });
  }

  includes({ day }: { day: VermontCalendarDay }): boolean {
    return day.year === this.year && day.month === this.month;
  }

  compare({ other }: { other: VermontCalendarMonth }): number {
    return this.isoMonth().localeCompare(other.isoMonth());
  }

  isoMonth(): string {
    return `${this.year}-${String(this.month).padStart(2, '0')}`;
  }

  name(): string {
    return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long' }).format(
      new Date(Date.UTC(this.year, this.month - 1, 1, 12)),
    );
  }
}

export class VermontClockTime {
  readonly hour: number;
  readonly minute: number;

  constructor({ hour, minute }: { hour: number; minute: number }) {
    this.hour = hour;
    this.minute = minute;
  }

  static parse({ hoursAndMinutes }: { hoursAndMinutes: string }): VermontClockTime {
    const match = /^(\d{2}):(\d{2})$/.exec(hoursAndMinutes);
    if (!match) throw new Error(`Not a 24-hour clock time like 16:00: ${hoursAndMinutes}`);
    return new VermontClockTime({ hour: Number(match[1]), minute: Number(match[2]) });
  }

  label(): string {
    return `${this.hour % 12 === 0 ? 12 : this.hour % 12}:${String(this.minute).padStart(2, '0')} ${this.hour < 12 ? 'a.m.' : 'p.m.'}`;
  }

  on({ day }: { day: VermontCalendarDay }): VermontTime {
    return VermontTime.fromWallClock({ year: day.year, month: day.month, day: day.day, hour: this.hour, minute: this.minute, second: 0 });
  }
}
