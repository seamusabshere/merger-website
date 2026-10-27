import { z } from 'astro/zod';

const isoInstant = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/,
    'Write a date, time, and UTC offset, like "2026-11-02T16:00:00-05:00". Vermont is -04:00 in summer and -05:00 in winter.',
  );

const calendarDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Write a date like "2026-11-02".');

const sourceLink = z.object({
  title: z.string(),
  url: z.url(),
});

export const committeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  officialName: z.string(),
  stateGroup: z.string(),
  isAdvisoryBody: z.boolean().nullable(),
  membersUpdatedOn: calendarDay,
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
  city: z.string(),
  website: z.url(),
  act170Page: z.url().optional(),
  boardMeetingsPage: z.url(),
  phone: z.string(),
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
  appointedOn: calendarDay.optional(),
  appointmentSource: sourceLink.optional(),
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

const agendaItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  subitems: z.array(z.string()).default([]),
  proposedExecutiveSession: z.object({ natureOfBusiness: z.string() }).optional(),
  documentIds: z.array(z.string()).default([]),
});

const agendaSchema = z.object({
  postedAt: isoInstant.optional(),
  sourceUrl: z.url().optional(),
  items: z.array(agendaItemSchema),
});

const rollCallEntrySchema = z.object({
  memberId: z.string(),
  vote: z.enum(['yes', 'no', 'abstain', 'absent']),
});

const voteSchema = z.object({
  method: z.enum(['voice', 'roll-call', 'unanimous-consent', 'consensus']),
  yes: z.number().int().optional(),
  no: z.number().int().optional(),
  abstain: z.number().int().optional(),
  rollCall: z.array(rollCallEntrySchema).default([]),
});

const motionSchema = z.object({
  text: z.string(),
  movedByMemberId: z.string().optional(),
  secondedByMemberId: z.string().optional(),
  result: z.enum(['passed', 'failed', 'withdrawn', 'tabled']),
  vote: voteSchema.optional(),
});

const minutesSchema = z.object({
  status: z.enum(['draft', 'approved']),
  postedAt: isoInstant,
  approvedOn: calendarDay.optional(),
  sourceUrl: z.url().optional(),
  membersPresentIds: z.array(z.string()),
  otherParticipants: z.array(z.string()).default([]),
  discussion: z.array(z.object({ topic: z.string(), summary: z.string() })).default([]),
  motions: z.array(motionSchema).default([]),
});

const recordingSchema = z.object({
  url: z.url(),
  host: z.string(),
  postedAt: isoInstant,
  captions: z.enum(['human', 'automatic', 'none']),
});

export const meetingSchema = z.object({
  kind: z.enum(['regular', 'special', 'emergency']),
  startsAt: isoInstant,
  endsAt: isoInstant.optional(),
  updatedOn: calendarDay,
  physicalLocation: physicalLocationSchema,
  electronicAccess: electronicAccessSchema.optional(),
  agenda: agendaSchema.optional(),
  minutes: minutesSchema.optional(),
  recording: recordingSchema.optional(),
  documentIds: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

const documentFileSchema = z.object({
  label: z.string(),
  language: z.string(),
  format: z.enum(['pdf', 'web-page', 'google-doc', 'video']),
  sizeBytes: z.number().int().optional(),
  accessibility: z.enum(['checked-accessible', 'not-accessible', 'not-checked']),
  url: z.url(),
});

export const documentSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  publishedOn: calendarDay.optional(),
  updatedOn: calendarDay,
  summary: z.string(),
  files: z.array(documentFileSchema).min(1),
});

export const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  updatedOn: calendarDay,
});

export type CommitteeData = z.infer<typeof committeeSchema>;
export type DistrictData = z.infer<typeof districtSchema>;
export type MemberData = z.infer<typeof memberSchema>;
export type MeetingData = z.infer<typeof meetingSchema>;
export type PhysicalLocationData = z.infer<typeof physicalLocationSchema>;
export type ElectronicAccessData = z.infer<typeof electronicAccessSchema>;
export type AgendaData = z.infer<typeof agendaSchema>;
export type AgendaItemData = z.infer<typeof agendaItemSchema>;
export type MinutesData = z.infer<typeof minutesSchema>;
export type MotionData = z.infer<typeof motionSchema>;
export type VoteData = z.infer<typeof voteSchema>;
export type RecordingData = z.infer<typeof recordingSchema>;
export type DocumentData = z.infer<typeof documentSchema>;
export type DocumentFileData = z.infer<typeof documentFileSchema>;
export type PageData = z.infer<typeof pageSchema>;
