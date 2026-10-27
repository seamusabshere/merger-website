import type { PageData } from './schemas.ts';
import { VermontCalendarDay } from './VermontTime.ts';

export class Page<Body> {
  readonly id: string;
  readonly locale: string;
  readonly title: string;
  readonly description: string;
  readonly updatedOn: VermontCalendarDay;
  readonly body: Body;

  constructor({ id, locale, data, body }: { id: string; locale: string; data: PageData; body: Body }) {
    this.id = id;
    this.locale = locale;
    this.title = data.title;
    this.description = data.description;
    this.updatedOn = VermontCalendarDay.parse({ isoDate: data.updatedOn });
    this.body = body;
  }
}
