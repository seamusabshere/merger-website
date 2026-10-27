import type { APIRoute } from 'astro';
import { AstroContent } from '../../persistence/AstroContent.ts';

export async function getStaticPaths() {
  const committee = await AstroContent.loadCommittee();
  return committee.meetings.map((meeting) => ({ params: { id: meeting.id }, props: { meetingId: meeting.id } }));
}

export const GET: APIRoute = async ({ props, site }) => {
  const committee = await AstroContent.loadCommittee();
  return new Response(committee.meetingById({ id: props.meetingId }).calendarEvent({ siteUrl: site!.toString() }), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
