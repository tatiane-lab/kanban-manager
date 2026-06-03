import { TestBed } from '@angular/core/testing';
import { BoardStore, STORAGE_KEY } from './board.store';

describe('BoardStore', () => {
  let store: BoardStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(BoardStore);
    store.load();
  });

  const col = (id: string) => store.columns().find((c) => c.id === id)!;

  it('loads the seed when storage is empty', () => {
    expect(store.status()).toBe('ready');
    expect(store.totalCards()).toBeGreaterThan(0);
  });

  it('goes to error state on corrupted storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    store.load();
    expect(store.status()).toBe('error');
    store.reset();
    expect(store.status()).toBe('ready');
  });

  it('adds, updates and deletes a card', () => {
    const id = store.addCard('todo', { title: '  Nova tarefa ' })!;
    expect(col('todo').cards.at(-1)?.title).toBe('Nova tarefa');
    store.updateCard(id, { priority: 'urgent' });
    expect(col('todo').cards.at(-1)?.priority).toBe('urgent');
    store.deleteCard(id);
    expect(col('todo').cards.some((c) => c.id === id)).toBe(false);
  });

  it('rejects blank titles', () => {
    expect(store.addCard('todo', { title: '   ' })).toBeNull();
  });

  it('moves a card across columns before a reference card', () => {
    store.moveCard('c1', 'done', 'c11');
    expect(col('backlog').cards.some((c) => c.id === 'c1')).toBe(false);
    expect(col('done').cards.map((c) => c.id)).toEqual(['c10', 'c1', 'c11']);
  });

  it('reorders inside the same column', () => {
    store.moveCard('c3', 'backlog', 'c1');
    expect(col('backlog').cards.map((c) => c.id)).toEqual(['c3', 'c1', 'c2']);
  });

  it('undoes the last action', () => {
    const before = store.totalCards();
    store.addCard('todo', { title: 'x' });
    expect(store.canUndo()).toBe(true);
    store.undo();
    expect(store.totalCards()).toBe(before);
  });

  it('persists to localStorage', () => {
    store.addCard('todo', { title: 'persistida' });
    TestBed.tick();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('persistida');
  });

  it('filters by query and priority', () => {
    store.setFilters({ query: 'refresh' });
    expect(store.visibleCount()).toBe(1);
    store.setFilters({ query: '', priority: 'urgent' });
    expect(store.visibleCount()).toBe(2);
    store.clearFilters();
    expect(store.hasActiveFilters()).toBe(false);
  });

  it('manages columns', () => {
    store.addColumn('QA', '#000');
    expect(store.columns().at(-1)?.title).toBe('QA');
    store.moveColumn(5, 0);
    expect(store.columns()[0].title).toBe('QA');
    store.deleteColumn(store.columns()[0].id);
    expect(store.columns().length).toBe(5);
  });
});
