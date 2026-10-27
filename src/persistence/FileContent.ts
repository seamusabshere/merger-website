import { readdir, readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { Committee } from '../domain/Committee.ts';
import { committeeSchema, districtSchema, documentSchema, meetingSchema, memberSchema } from '../domain/schemas.ts';

export class FileContent {
  static async loadCommittee({ contentDirectory }: { contentDirectory: URL }): Promise<Committee> {
    const readYaml = async (relativePath: string): Promise<unknown> =>
      parse(await readFile(new URL(relativePath, contentDirectory), 'utf8'), { merge: true });
    const readFolder = async (folder: string) => {
      const fileNames = (await readdir(new URL(`${folder}/`, contentDirectory))).filter((fileName) => fileName.endsWith('.yaml'));
      return Promise.all(
        fileNames.map(async (fileName) => ({ id: fileName.replace(/\.yaml$/, ''), raw: await readYaml(`${folder}/${fileName}`) })),
      );
    };

    const committeeEntries = committeeSchema.array().length(1).parse(await readYaml('committee.yaml'));
    return new Committee({
      committeeData: committeeEntries[0]!,
      districtsData: districtSchema.array().parse(await readYaml('districts.yaml')),
      membersData: memberSchema.array().parse(await readYaml('members.yaml')),
      meetingsData: (await readFolder('meetings')).map(({ id, raw }) => ({ id, data: meetingSchema.parse(raw) })),
      documentsData: (await readFolder('documents')).map(({ id, raw }) => ({ id, data: documentSchema.parse(raw) })),
    });
  }
}
