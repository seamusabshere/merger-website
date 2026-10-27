import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import {
  committeeSchema,
  districtSchema,
  documentSchema,
  meetingSchema,
  memberSchema,
  pageSchema,
  stateDeadlineSchema,
} from './domain/schemas.ts';

const committee = defineCollection({
  loader: file('src/content/committee.yaml'),
  schema: committeeSchema,
});

const districts = defineCollection({
  loader: file('src/content/districts.yaml'),
  schema: districtSchema,
});

const members = defineCollection({
  loader: file('src/content/members.yaml'),
  schema: memberSchema,
});

const meetings = defineCollection({
  loader: glob({ base: './src/content/meetings', pattern: '*.yaml' }),
  schema: meetingSchema,
});

const documents = defineCollection({
  loader: glob({ base: './src/content/documents', pattern: '*.yaml' }),
  schema: documentSchema,
});

const stateDeadlines = defineCollection({
  loader: file('src/content/state-deadlines.yaml'),
  schema: stateDeadlineSchema,
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: pageSchema,
});

export const collections = { committee, districts, members, meetings, documents, stateDeadlines, pages };
