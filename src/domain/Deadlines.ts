import type { StateDeadline } from './StateDeadline.ts';
import type { VermontTime } from './VermontTime.ts';

export class Deadlines {
  readonly stateDeadlines: StateDeadline[];

  constructor({ stateDeadlines }: { stateDeadlines: StateDeadline[] }) {
    this.stateDeadlines = [...stateDeadlines].sort((a, b) => a.on.compare({ other: b.on }));
  }

  upcoming({ now }: { now: VermontTime }): Deadlines {
    return new Deadlines({
      stateDeadlines: this.stateDeadlines.filter((stateDeadline) => !stateDeadline.isOver({ now })),
    });
  }
}
