import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { BoardService } from '../board/board.service';

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  tags: string[];
}

export interface Column {
  id: string;
  title: string;
  color: string;
  cards: Card[];
  limit?: number;
}

interface KanbanState {
  columns: Column[];
  isLoading: boolean;
  error: string | null;
  pendingOperation: boolean;
  selectedCardId: string | null;
}

const initialState: KanbanState = {
  columns: [],
  isLoading: false,
  error: null,
  pendingOperation: false,
  selectedCardId: null,
};

export const KanbanStore = signalStore(
  { providedIn: 'root' },
  withState<KanbanState>(initialState),
  withComputed(({ columns }) => ({
    totalCards: computed(() =>
      columns().reduce((acc, col) => acc + col.cards.length, 0)
    ),
    columnIds: computed(() => columns().map((c) => c.id)),
    overLimitColumns: computed(() =>
      columns().filter((c) => c.limit !== undefined && c.cards.length > c.limit)
    ),
  })),
  withMethods((store, boardService = inject(BoardService)) => ({
    loadBoard() {
      patchState(store, { isLoading: true, error: null });
      boardService.getBoard().subscribe({
        next: (columns) => patchState(store, { columns, isLoading: false }),
        error: (err) =>
          patchState(store, { error: err.message, isLoading: false }),
      });
    },

    moveCard(
      cardId: string,
      fromColumnId: string,
      toColumnId: string,
      newIndex: number
    ) {
      const snapshot = store.columns();

      const updated = snapshot.map((col) => {
        if (col.id === fromColumnId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        if (col.id === toColumnId) {
          const card = snapshot
            .flatMap((c) => c.cards)
            .find((c) => c.id === cardId)!;
          const cards = [...col.cards];
          cards.splice(newIndex, 0, card);
          return { ...col, cards };
        }
        return col;
      });

      patchState(store, { columns: updated, pendingOperation: true });

      boardService.moveCard(cardId, toColumnId, newIndex).subscribe({
        next: () => patchState(store, { pendingOperation: false }),
        error: (err) =>
          patchState(store, {
            columns: snapshot,
            pendingOperation: false,
            error: `Move failed: ${err.message} — changes reverted`,
          }),
      });
    },

    addCard(columnId: string, card: Omit<Card, 'id'>) {
      const tempId = `temp_${Date.now()}`;
      const newCard: Card = { ...card, id: tempId };
      const snapshot = store.columns();

      patchState(store, {
        columns: snapshot.map((col) =>
          col.id === columnId
            ? { ...col, cards: [...col.cards, newCard] }
            : col
        ),
      });

      boardService.addCard(columnId, card).subscribe({
        next: (savedCard) =>
          patchState(store, {
            columns: store.columns().map((col) =>
              col.id === columnId
                ? {
                    ...col,
                    cards: col.cards.map((c) =>
                      c.id === tempId ? savedCard : c
                    ),
                  }
                : col
            ),
          }),
        error: () =>
          patchState(store, {
            columns: snapshot,
            error: 'Failed to save card — changes reverted',
          }),
      });
    },
  }))
);
