import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { KanbanStore, Card, Column } from '../store/kanban.store';
import { ColumnComponent } from './column.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [DragDropModule, ColumnComponent],
  template: `
    <div class="board">
      <header class="board-header">
        <h1>{{ boardTitle() }}</h1>
        <span class="card-count">{{ kanbanStore.totalCards() }} cards</span>
        @if (kanbanStore.pendingOperation()) {
          <span class="syncing">Syncing…</span>
        }
      </header>

      @if (kanbanStore.isLoading()) {
        <div class="skeleton-columns">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-column"></div>
          }
        </div>
      } @else {
        <div class="columns" cdkDropListGroup>
          @for (column of kanbanStore.columns(); track column.id) {
            <app-column
              [column]="column"
              [connectedTo]="kanbanStore.columnIds()"
              (cardDropped)="onCardDrop($event, column.id)"
              (cardAdded)="onCardAdd(column.id, $event)"
            />
          }
        </div>
      }

      @if (kanbanStore.error()) {
        <div class="error-banner">{{ kanbanStore.error() }}</div>
      }
    </div>
  `,
})
export class BoardComponent implements OnInit {
  kanbanStore = inject(KanbanStore);
  boardTitle = signal('Sprint Board');

  ngOnInit() {
    this.kanbanStore.loadBoard();
  }

  onCardDrop(event: CdkDragDrop<Card[]>, targetColumnId: string) {
    if (event.previousContainer.id === event.container.id) return;

    const card = event.item.data as Card;
    this.kanbanStore.moveCard(
      card.id,
      event.previousContainer.id,
      targetColumnId,
      event.currentIndex
    );
  }

  onCardAdd(columnId: string, card: Omit<Card, 'id'>) {
    this.kanbanStore.addCard(columnId, card);
  }
}
