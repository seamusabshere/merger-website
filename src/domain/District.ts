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

export class DistrictLogo {
  readonly path: string;
  readonly width: number;
  readonly height: number;

  constructor({ path, width, height }: { path: string; width: number; height: number }) {
    this.path = path;
    this.width = width;
    this.height = height;
  }
}

export class PageThatLinksHere {
  readonly url: string;
  readonly published: boolean;

  constructor({ url, published }: { url: string; published: boolean }) {
    this.url = url;
    this.published = published;
  }
}

export class District {
  readonly id: string;
  readonly name: string;
  readonly legalName: string;
  readonly abbreviation: string;
  readonly city: string;
  readonly website: string;
  readonly act170Page: string | undefined;
  readonly boardMeetingsPage: string;
  readonly phone: string;
  readonly logo: DistrictLogo;
  readonly pageThatLinksHere: PageThatLinksHere;
  readonly averageDailyMembership: AverageDailyMembership;

  constructor({ data }: { data: DistrictData }) {
    this.id = data.id;
    this.name = data.name;
    this.legalName = data.legalName;
    this.abbreviation = data.abbreviation;
    this.city = data.city;
    this.website = data.website;
    this.act170Page = data.act170Page;
    this.boardMeetingsPage = data.boardMeetingsPage;
    this.phone = data.phone;
    this.logo = new DistrictLogo({ path: data.logo.path, width: data.logo.width, height: data.logo.height });
    this.pageThatLinksHere = new PageThatLinksHere({ url: data.pageThatLinksHere.url, published: data.pageThatLinksHere.published });
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
