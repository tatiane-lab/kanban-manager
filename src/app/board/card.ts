import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Card, PRIORITIES, labelColor, Member } from '../core/models';
import { isoDay } from '../core/seed';

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card', '[attr.data-priority]': 'card().priority' },
  template: `
    <button type="button" class="card__body" (click)="open.emit()" [attr.aria-label]="'Abrir card ' + card().title">
      @if (card().labels.length) {
        <span class="card__labels">
          @for (l of card().labels; track l) {
            <span class="chip" [style.--chip]="color(l)">{{ l }}</span>
          }
        </span>
      }
      <span class="card__title">{{ card().title }}</span>
      @if (card().description) {
        <span class="card__desc">{{ card().description }}</span>
      }
      <span class="card__footer">
        <span class="badge badge--{{ card().priority }}">{{ priorityLabel() }}</span>
        @if (dueLabel(); as due) {
          <span class="due" [class.due--overdue]="overdue()" [title]="overdue() ? 'Atrasado' : 'Prazo'">
            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
            {{ due }}
          </span>
        }
        @if (assignee(); as a) {
          <span class="avatar" [style.background]="a.color" [title]="a.name">{{ initialsOf(a.name) }}</span>
        }
      </span>
    </button>
  `,
})
export class CardComponent {
  readonly card = input.required<Card>();
  readonly members = input<Member[]>([]);
  readonly done = input(false);
  readonly open = output<void>();

  protected readonly color = labelColor;
  protected readonly initialsOf = initials;
  protected readonly assignee = computed(() => this.members().find((m) => m.id === this.card().assigneeId));
  protected readonly priorityLabel = computed(
    () => PRIORITIES.find((p) => p.value === this.card().priority)?.label ?? '',
  );
  protected readonly overdue = computed(() => {
    const d = this.card().dueDate;
    return !!d && !this.done() && d < isoDay(0);
  });
  protected readonly dueLabel = computed(() => {
    const d = this.card().dueDate;
    if (!d) return null;
    const [, m, day] = d.split('-');
    return `${day}/${m}`;
  });
}
