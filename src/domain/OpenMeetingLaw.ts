import type { MeetingData } from './schemas.ts';
import type { VermontCalendarDay, VermontTime } from './VermontTime.ts';

const AGENDA_NOTICE_HOURS: Record<MeetingData['kind'], number | undefined> = {
  regular: 48,
  special: 24,
  emergency: undefined,
};

export class OpenMeetingLaw {
  static readonly MINUTES_DAYS = 5;

  static agendaNoticeHours({ kind }: { kind: MeetingData['kind'] }): number | undefined {
    return AGENDA_NOTICE_HOURS[kind];
  }

  static agendaDeadline({ kind, startsAt }: { kind: MeetingData['kind']; startsAt: VermontTime }): VermontTime | undefined {
    const hours = OpenMeetingLaw.agendaNoticeHours({ kind });
    return hours === undefined ? undefined : startsAt.plusHours({ hours: -hours });
  }

  static minutesDeadline({ meetingDay }: { meetingDay: VermontCalendarDay }): VermontTime {
    return meetingDay.plusDays({ days: OpenMeetingLaw.MINUTES_DAYS }).endsAt();
  }

  static minutesKeepUntil({ meetingDay }: { meetingDay: VermontCalendarDay }): VermontCalendarDay {
    return meetingDay.plusYears({ years: 1 });
  }
}
