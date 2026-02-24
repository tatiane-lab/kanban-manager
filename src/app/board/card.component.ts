import {
  Component,
  Input,
  signal,
} from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { Card } from '../store/kanban.store';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CdkDrag],
  template: `
    <div
      class="card"
      [class.is-dragging]="isDragging()"
      [attr.data-priority]="card.priority"
      (mouseenter)="hovered.set(true)"
      (mouseleave)="hovered.set(false)"
    >
      <div class="card-title">{{ card.title }}</div>

      @if (card.description) {
        <p class="card-description">{{ card.description }}</p>
      }

      <div class="card-footer">
        @if (card.assignee) {
          <span class="assignee">{{ card.assignee }}</span>
        }
        @if (card.dueDate) {
          <span class="due-date" [class.overdue]="isOverdue()">
            {{ card.dueDate }}
          </span>
        }
        @for (tag of card.tags; track tag) {
          <span class="tag">{{ tag }}</span>
        }
      </div>

      <div class="priority-indicator" [attr.aria-label]="'Priority: ' + card.priority"></div>
    </div>
  `,
})
export class CardComponent {
  @Input({ required: true }) card!: Card;

  isDragging = signal(false);
  hovered = signal(false);

  isOverdue(): boolean {
    if (!this.card.dueDate) return false;
    return new Date(this.card.dueDate) < new Date();
  }
}
