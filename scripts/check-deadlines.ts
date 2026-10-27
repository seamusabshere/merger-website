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

if (overdueDuties.length > 0) {
  for (const overdueDuty of overdueDuties) console.error(overdueDuty.describe());
  process.exit(1);
}
console.log('No agendas or minutes are past their legal deadline.');
