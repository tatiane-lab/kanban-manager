import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { KanbanStore, Column } from '../store/kanban.store';
import { BoardService } from './board.service';
import { of, throwError } from 'rxjs';

const mockColumns: Column[] = [
  { id: 'todo', title: 'To Do', color: '#6366f1', cards: [] },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: '#f59e0b',
    cards: [
      {
        id: 'card-1',
        title: 'Implement auth',
        description: '',
        priority: 'high',
        tags: ['backend'],
      },
    ],
  },
  { id: 'done', title: 'Done', color: '#10b981', cards: [] },
];

describe('KanbanStore', () => {
  let store: InstanceType<typeof KanbanStore>;
  let boardService: jest.Mocked<BoardService>;

  beforeEach(() => {
    boardService = {
      getBoard: jest.fn(),
      moveCard: jest.fn(),
      addCard: jest.fn(),
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
    } as unknown as jest.Mocked<BoardService>;

    TestBed.configureTestingModule({
      providers: [
        KanbanStore,
        { provide: BoardService, useValue: boardService },
      ],
    });

    store = TestBed.inject(KanbanStore);
  });

  it('should load board columns', () => {
    boardService.getBoard.mockReturnValue(of(mockColumns));
    store.loadBoard();
    expect(store.columns()).toEqual(mockColumns);
    expect(store.isLoading()).toBe(false);
  });

  it('should perform optimistic update on moveCard', () => {
    boardService.getBoard.mockReturnValue(of(mockColumns));
    boardService.moveCard.mockReturnValue(of(undefined));
    store.loadBoard();

    store.moveCard('card-1', 'in-progress', 'done', 0);

    const doneColumn = store.columns().find((c) => c.id === 'done')!;
    expect(doneColumn.cards).toHaveLength(1);
    expect(doneColumn.cards[0].id).toBe('card-1');
  });

  it('should rollback on moveCard error', () => {
    boardService.getBoard.mockReturnValue(of(mockColumns));
    boardService.moveCard.mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    store.loadBoard();

    const snapshotBefore = store.columns();
    store.moveCard('card-1', 'in-progress', 'done', 0);

    expect(store.columns()).toEqual(snapshotBefore);
    expect(store.error()).toContain('reverted');
  });

  it('should compute totalCards correctly', () => {
    boardService.getBoard.mockReturnValue(of(mockColumns));
    store.loadBoard();
    expect(store.totalCards()).toBe(1);
  });
});
