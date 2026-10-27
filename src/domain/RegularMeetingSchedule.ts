import type { CalendarEntry, CalendarLink } from './Calendar.ts';
import type { Meeting } from './Meeting.ts';
import type { RegularMeetingScheduleData } from './schemas.ts';
import { VermontCalendarDay, VermontCalendarMonth, VermontClockTime, type VermontTime, type Weekday } from './VermontTime.ts';

const OCCURRENCES: Record<RegularMeetingScheduleData['week'], number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
};

export class RegularMeetingSchedule {
  readonly updatedOn: VermontCalendarDay;
  readonly week: RegularMeetingScheduleData['week'];
  readonly weekday: Weekday;
  readonly startsAt: VermontClockTime;
  readonly firstMonth: VermontCalendarMonth;
  readonly lastMonth: VermontCalendarMonth;
  readonly cancelledMonths: VermontCalendarMonth[];

  constructor({ data }: { data: RegularMeetingScheduleData }) {
    this.updatedOn = VermontCalendarDay.parse({ isoDate: data.updatedOn });
    this.week = data.week;
    this.weekday = data.weekday;
    this.startsAt = VermontClockTime.parse({ hoursAndMinutes: data.startsAt });
    this.firstMonth = VermontCalendarMonth.parse({ isoMonth: data.firstMonth });
    this.lastMonth = VermontCalendarMonth.parse({ isoMonth: data.lastMonth });
    if (this.firstMonth.compare({ other: this.lastMonth }) > 0) {
      throw new Error(`The regular meeting schedule's firstMonth (${data.firstMonth}) comes after its lastMonth (${data.lastMonth}).`);
    }
    this.cancelledMonths = data.cancelledMonths.map((isoMonth) => VermontCalendarMonth.parse({ isoMonth }));
    const monthsOutsideSchedule = this.cancelledMonths.filter(
      (month) => month.compare({ other: this.firstMonth }) < 0 || month.compare({ other: this.lastMonth }) > 0,
    );
    if (monthsOutsideSchedule.length > 0) {
      throw new Error(
        `cancelledMonths must fall from ${data.firstMonth} through ${data.lastMonth}. Outside: ${monthsOutsideSchedule.map((month) => month.isoMonth()).join(', ')}.`,
      );
    }
  }

  months(): VermontCalendarMonth[] {
    const months: VermontCalendarMonth[] = [];
    for (let month = this.firstMonth; month.compare({ other: this.lastMonth }) <= 0; month = month.next()) {
      if (!this.cancelledMonths.some((cancelledMonth) => cancelledMonth.compare({ other: month }) === 0)) months.push(month);
    }
    return months;
  }

  meetingDayIn({ month }: { month: VermontCalendarMonth }): VermontCalendarDay {
    return month.nthWeekday({ weekday: this.weekday, occurrence: OCCURRENCES[this.week] });
  }

  private weekdayName(): string {
    return `${this.weekday[0]!.toUpperCase()}${this.weekday.slice(1)}`;
  }

  describe(): string {
    return `${this.week[0]!.toUpperCase()}${this.week.slice(1)} ${this.weekdayName()} of each month, ${this.startsAt.label()}`;
  }

  sentence(): string {
    // The clock label ends in "a.m." or "p.m.", which also ends the sentence.
    return `The committee meets on the ${this.week} ${this.weekdayName()} of each month at ${this.startsAt.label()}`;
  }

  // A regular meeting on file for a month takes that month's place, even on another day, because the committee moved it.
  expectedMeetings({ meetings }: { meetings: Meeting[] }): ExpectedMeeting[] {
    return this.months()
      .filter((month) => !meetings.some((meeting) => meeting.kind === 'regular' && month.includes({ day: meeting.day() })))
      .map((month) => new ExpectedMeeting({ schedule: this, startsAt: this.startsAt.on({ day: this.meetingDayIn({ month }) }) }));
  }
}

export class ExpectedMeeting implements CalendarEntry {
  readonly schedule: RegularMeetingSchedule;
  readonly startsAt: VermontTime;
  readonly kind = 'regular';

  constructor({ schedule, startsAt }: { schedule: RegularMeetingSchedule; startsAt: VermontTime }) {
    this.schedule = schedule;
    this.startsAt = startsAt;
  }

  day(): VermontCalendarDay {
    return this.startsAt.calendarDay();
  }

  title(): string {
    return `Expected committee meeting, ${this.day().longDate()}`;
  }

  sortsAt(): VermontTime {
    return this.startsAt;
  }

  isOver({ now }: { now: VermontTime }): boolean {
    return !now.isBefore({ other: this.day().endsAt() });
  }

  calendarKind(): string {
    return 'Expected regular meeting';
  }

  calendarTitle(): string {
    return 'Committee meeting';
  }

  calendarTime(): string {
    return `${this.startsAt.clockTime()} ${this.startsAt.timeZoneAbbreviation()}`;
  }

  calendarDetails(): string[] {
    return [
      `${this.schedule.sentence()} The notice for this meeting is not out yet. It will give the place and how to join by video or phone.`,
    ];
  }

  calendarLink(): CalendarLink | undefined {
    return undefined;
  }
}
