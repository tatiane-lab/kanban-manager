import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { Column, Card } from '../store/kanban.store';
import { CardComponent } from './card.component';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [DragDropModule, CardComponent],
  template: `
    <div class="column" [style.--column-color]="column.color">
      <header class="column-header">
        <span class="column-title">{{ column.title }}</span>
        <span class="card-count" [class.over-limit]="isOverLimit()">
          {{ column.cards.length }}
          @if (column.limit) { / {{ column.limit }} }
        </span>
        <button class="add-btn" (click)="showAddCard.set(true)">+</button>
      </header>

      <div
        class="cards-list"
        cdkDropList
        [cdkDropListId]="column.id"
        [cdkDropListData]="column.cards"
        [cdkDropListConnectedTo]="connectedTo"
        (cdkDropListDropped)="onDrop($event)"
      >
        @for (card of column.cards; track card.id) {
          <app-card [card]="card" cdkDrag [cdkDragData]="card" />
        } @empty {
          <div class="empty-column">Drop cards here</div>
        }
      </div>

      @if (showAddCard()) {
        <div class="add-card-form">
          <textarea
            #titleInput
            placeholder="Card title…"
            (keydown.enter)="submitCard(titleInput.value)"
            (keydown.escape)="showAddCard.set(false)"
            autofocus
          ></textarea>
          <div class="form-actions">
            <button (click)="submitCard(titleInput.value)">Add</button>
            <button (click)="showAddCard.set(false)">Cancel</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ColumnComponent {
  @Input({ required: true }) column!: Column;
  @Input() connectedTo: string[] = [];

  @Output() cardDropped = new EventEmitter<CdkDragDrop<Card[]>>();
  @Output() cardAdded = new EventEmitter<Omit<Card, 'id'>>();

  showAddCard = signal(false);

  isOverLimit() {
    return (
      this.column.limit !== undefined &&
      this.column.cards.length > this.column.limit
    );
  }

  onDrop(event: CdkDragDrop<Card[]>) {
    this.cardDropped.emit(event);
  }

  submitCard(title: string) {
    if (!title.trim()) return;
    this.cardAdded.emit({ title: title.trim(), description: '', priority: 'medium', tags: [] });
    this.showAddCard.set(false);
  }
}
