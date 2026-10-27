import type { District } from './District.ts';
import type { MemberData } from './schemas.ts';
import { VermontCalendarDay } from './VermontTime.ts';

export class Member {
  readonly id: string;
  readonly name: string;
  readonly district: District;
  readonly seat: 'member' | 'alternate';
  readonly boardRole: string | undefined;
  readonly email: string | undefined;
  readonly appointedOn: VermontCalendarDay | undefined;
  readonly appointmentSourceTitle: string | undefined;
  readonly appointmentSourceUrl: string | undefined;

  constructor({ data, district }: { data: MemberData; district: District }) {
    this.id = data.id;
    this.name = data.name;
    this.district = district;
    this.seat = data.seat;
    this.boardRole = data.boardRole;
    this.email = data.email;
    this.appointedOn = data.appointedOn ? VermontCalendarDay.parse({ isoDate: data.appointedOn }) : undefined;
    this.appointmentSourceTitle = data.appointmentSource?.title;
    this.appointmentSourceUrl = data.appointmentSource?.url;
  }

  isAlternate(): boolean {
    return this.seat === 'alternate';
  }

  surname(): string {
    return this.name.split(' ').at(-1)!;
  }

  compareBySurname({ other }: { other: Member }): number {
    return this.surname().localeCompare(other.surname()) || this.name.localeCompare(other.name);
  }

  roleDescription(): string {
    const seat = this.isAlternate() ? 'Alternate' : 'Member';
    return this.boardRole ? `${seat}. ${this.boardRole}.` : `${seat}.`;
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
