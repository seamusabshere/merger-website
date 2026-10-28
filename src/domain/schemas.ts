import { z } from 'astro/zod';
import { WEEKDAYS } from './VermontTime.ts';

const isoInstant = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/,
    'Write a date, time, and UTC offset, like "2026-11-02T16:00:00-05:00". Vermont is -04:00 in summer and -05:00 in winter.',
  );

const calendarDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Write a date like "2026-11-02".');

const calendarMonth = z.string().regex(/^\d{4}-\d{2}$/, 'Write a month like "2026-11".');

const clockTime = z.string().regex(/^\d{2}:\d{2}$/, 'Write a 24-hour time in Vermont, like "16:00" for 4:00 p.m.');

const sourceLink = z.object({
  title: z.string(),
  url: z.url(),
});

const regularMeetingScheduleSchema = z.object({
  updatedOn: calendarDay,
  week: z.enum(['first', 'second', 'third', 'fourth']),
  weekday: z.enum(WEEKDAYS),
  startsAt: clockTime,
  firstMonth: calendarMonth,
  lastMonth: calendarMonth,
  cancelledMonths: z.array(calendarMonth).default([]),
});

export const committeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  officialName: z.string(),
  stateGroup: z.string(),
  membersUpdatedOn: calendarDay,
  chairMemberId: z.string(),
  regularMeetingSchedule: regularMeetingScheduleSchema,
  proportionalRepresentation: z.object({
    decidedAtMeetingId: z.string(),
    votes: z.array(
      z.object({
        districtId: z.string(),
        count: z.number().int().positive(),
      }),
    ),
  }),
  facilitator: z.object({
    name: z.string(),
    title: z.string(),
    organization: z.string(),
    organizationUrl: z.url(),
    email: z.email(),
    phone: z.string(),
    source: sourceLink,
  }),
});

export const districtSchema = z.object({
  id: z.string(),
  name: z.string(),
  legalName: z.string(),
  abbreviation: z.string(),
  city: z.string(),
  website: z.url(),
  act170Page: z.url().optional(),
  boardMeetingsPage: z.url(),
  phone: z.string(),
  logo: z.object({
    path: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  pageThatLinksHere: z.object({
    url: z.url(),
    published: z.boolean(),
  }),
  averageDailyMembership: z.object({
    students: z.number().int(),
    fiscalYear: z.string(),
    source: sourceLink,
  }),
});

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  districtId: z.string(),
  seat: z.enum(['member', 'alternate']),
  boardRole: z.string().optional(),
  email: z.email().optional(),
});

const physicalLocationSchema = z.object({
  name: z.string(),
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  room: z.string().optional(),
  accessNotes: z.array(z.string()).default([]),
});

const electronicAccessSchema = z.object({
  platform: z.string(),
  url: z.url().optional(),
  meetingId: z.string().optional(),
  passcode: z.string().optional(),
  phoneNumber: z.string().optional(),
  phonePin: z.string().optional(),
});

const agendaSchema = z.object({
  postedAt: isoInstant.optional(),
  documentId: z.string(),
}).strict();

const minutesSchema = z.object({
  status: z.enum(['draft', 'approved']),
  postedAt: isoInstant,
  approvedOn: calendarDay.optional(),
  documentId: z.string().optional(),
  sourceUrl: z.url().optional(),
}).strict();

const recordingSchema = z.object({
  url: z.url(),
  host: z.string(),
  postedAt: isoInstant,
  captions: z.enum(['human', 'automatic', 'none']).optional(),
});

export const meetingSchema = z.object({
  kind: z.enum(['regular', 'special', 'emergency']),
  startsAt: isoInstant,
  endsAt: isoInstant.optional(),
  updatedOn: calendarDay,
  physicalLocation: physicalLocationSchema.optional(),
  electronicAccess: electronicAccessSchema.optional(),
  agenda: agendaSchema.optional(),
  minutes: minutesSchema.optional(),
  recording: recordingSchema.optional(),
  documentIds: z.array(z.string()).default([]),
}).strict();

const documentFileSchema = z.object({
  label: z.string(),
  language: z.string(),
  format: z.enum(['pdf', 'web-page', 'google-doc', 'video']),
  sizeBytes: z.number().int().optional(),
  accessibility: z.enum(['checked-accessible', 'not-accessible', 'not-checked']),
  url: z.string().refine((value) => (value.startsWith('/') && !value.startsWith('//') && !/\s/.test(value)) || URL.canParse(value), {
    message: 'Write a full URL, or a path on this site starting with /, like "/documents/agenda.pdf".',
  }),
});

export const documentSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  createdByTheCommittee: z.boolean(),
  publishedOn: calendarDay.optional(),
  updatedOn: calendarDay,
  files: z.array(documentFileSchema).min(1),
}).strict();

export const stateDeadlineSchema = z.object({
  id: z.string(),
  on: calendarDay,
  timing: z.enum(['on-or-before', 'on']),
  updatedOn: calendarDay,
  title: z.string(),
  description: z.string(),
  citation: sourceLink,
});

export const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  updatedOn: calendarDay,
});

export type CommitteeData = z.infer<typeof committeeSchema>;
export type RegularMeetingScheduleData = z.infer<typeof regularMeetingScheduleSchema>;
export type StateDeadlineData = z.infer<typeof stateDeadlineSchema>;
export type DistrictData = z.infer<typeof districtSchema>;
export type MemberData = z.infer<typeof memberSchema>;
export type MeetingData = z.infer<typeof meetingSchema>;
export type PhysicalLocationData = z.infer<typeof physicalLocationSchema>;
export type ElectronicAccessData = z.infer<typeof electronicAccessSchema>;
export type AgendaData = z.infer<typeof agendaSchema>;
export type MinutesData = z.infer<typeof minutesSchema>;
export type RecordingData = z.infer<typeof recordingSchema>;
export type DocumentData = z.infer<typeof documentSchema>;
export type DocumentFileData = z.infer<typeof documentFileSchema>;
export type PageData = z.infer<typeof pageSchema>;
