import type { District } from './District.ts';
import type { MemberData } from './schemas.ts';

export class Member {
  readonly id: string;
  readonly name: string;
  readonly district: District;
  readonly seat: 'member' | 'alternate';
  readonly boardRole: string | undefined;
  readonly email: string | undefined;
  readonly chairsTheCommittee: boolean;

  constructor({ data, district, chairsTheCommittee }: { data: MemberData; district: District; chairsTheCommittee: boolean }) {
    this.id = data.id;
    this.name = data.name;
    this.district = district;
    this.seat = data.seat;
    this.boardRole = data.boardRole;
    this.email = data.email;
    this.chairsTheCommittee = chairsTheCommittee;
  }

  isAlternate(): boolean {
    return this.seat === 'alternate';
  }

  isChair(): boolean {
    return this.chairsTheCommittee;
  }

  chairsTheDistrictBoard(): boolean {
    return this.boardRole?.startsWith('Chair of the') === true;
  }

  surname(): string {
    return this.name.split(' ').at(-1)!;
  }

  compareBySurname({ other }: { other: Member }): number {
    return this.surname().localeCompare(other.surname()) || this.name.localeCompare(other.name);
  }

  contactRole(): string {
    return this.isChair() ? 'chair of the merger committee' : 'committee member';
  }
}

export class Facilitator {
  readonly name: string;
  readonly title: string;
  readonly organization: string;
  readonly organizationUrl: string;
  readonly email: string;
  readonly phone: string;
  readonly sourceTitle: string;
  readonly sourceUrl: string;

  constructor({
    name,
    title,
    organization,
    organizationUrl,
    email,
    phone,
    sourceTitle,
    sourceUrl,
  }: {
    name: string;
    title: string;
    organization: string;
    organizationUrl: string;
    email: string;
    phone: string;
    sourceTitle: string;
    sourceUrl: string;
  }) {
    this.name = name;
    this.title = title;
    this.organization = organization;
    this.organizationUrl = organizationUrl;
    this.email = email;
    this.phone = phone;
    this.sourceTitle = sourceTitle;
    this.sourceUrl = sourceUrl;
  }

  telephoneHref(): string {
    return `tel:+1${this.phone.replace(/\D/g, '')}`;
  }
}
