import type { DistrictData } from './schemas.ts';

export class AverageDailyMembership {
  readonly students: number;
  readonly fiscalYear: string;
  readonly sourceTitle: string;
  readonly sourceUrl: string;

  constructor({ students, fiscalYear, sourceTitle, sourceUrl }: { students: number; fiscalYear: string; sourceTitle: string; sourceUrl: string }) {
    this.students = students;
    this.fiscalYear = fiscalYear;
    this.sourceTitle = sourceTitle;
    this.sourceUrl = sourceUrl;
  }

  describe(): string {
    return `${this.students.toLocaleString('en-US')} students (${this.fiscalYear})`;
  }
}

export class District {
  readonly id: string;
  readonly name: string;
  readonly legalName: string;
  readonly city: string;
  readonly website: string;
  readonly act170Page: string | undefined;
  readonly boardMeetingsPage: string;
  readonly phone: string;
  readonly averageDailyMembership: AverageDailyMembership;

  constructor({ data }: { data: DistrictData }) {
    this.id = data.id;
    this.name = data.name;
    this.legalName = data.legalName;
    this.city = data.city;
    this.website = data.website;
    this.act170Page = data.act170Page;
    this.boardMeetingsPage = data.boardMeetingsPage;
    this.phone = data.phone;
    this.averageDailyMembership = new AverageDailyMembership({
      students: data.averageDailyMembership.students,
      fiscalYear: data.averageDailyMembership.fiscalYear,
      sourceTitle: data.averageDailyMembership.source.title,
      sourceUrl: data.averageDailyMembership.source.url,
    });
  }

  telephoneHref(): string {
    return `tel:+1${this.phone.replace(/\D/g, '')}`;
  }

  compareAlphabetically({ other }: { other: District }): number {
    return this.name.localeCompare(other.name);
  }
}
