import { FileContent } from '../src/persistence/FileContent.ts';
import { VermontTime } from '../src/domain/VermontTime.ts';

const committee = await FileContent.loadCommittee({ contentDirectory: new URL('../src/content/', import.meta.url) });
const now = VermontTime.now();
const overdueDuties = committee.overdueDuties({ now });

for (const meeting of committee.upcomingMeetings({ now })) {
  const agendaDeadline = meeting.agendaDeadline();
  if (agendaDeadline && !meeting.hasPostedAgenda()) {
    const hoursLeft = Math.floor((agendaDeadline.instant.getTime() - now.instant.getTime()) / 3_600_000);
    if (hoursLeft >= 0) console.log(`${meeting.title()}: agenda due by ${agendaDeadline.dateAndTime()} (${hoursLeft} hours left).`);
  }
}

const pastExpectedMeetings = committee.pastExpectedMeetings({ now });
for (const expectedMeeting of pastExpectedMeetings) {
  console.error(
    `${expectedMeeting.title()} has passed. Add its meeting file, or add ${expectedMeeting.day().calendarMonth().isoMonth()} to cancelledMonths in committee.yaml.`,
  );
}

for (const overdueDuty of overdueDuties) console.error(overdueDuty.overdueMessage());
if (overdueDuties.length > 0 || pastExpectedMeetings.length > 0) process.exit(1);
console.log('No agendas or minutes are past their legal deadline.');
