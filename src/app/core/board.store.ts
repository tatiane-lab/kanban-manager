import { Injectable, computed, effect, signal } from '@angular/core';
import { Card, Column, EMPTY_FILTERS, Filters } from './models';
import { seedColumns } from './seed';

export const STORAGE_KEY = 'kanban.board.v1';
const HISTORY_LIMIT = 30;

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type CardDraft = Omit<Card, 'id' | 'createdAt'>;

export interface Toast {
  id: number;
  message: string;
  undoable: boolean;
}

/**
 * Estado do board baseado em signals. Toda mutação passa por `commit()`,
 * que empilha um snapshot (imutável) para o undo e persiste no localStorage.
 */
@Injectable({ providedIn: 'root' })
export class BoardStore {
  readonly columns = signal<Column[]>([]);
  readonly status = signal<LoadStatus>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly filters = signal<Filters>({ ...EMPTY_FILTERS });
  readonly toast = signal<Toast | null>(null);
  private readonly history = signal<Column[][]>([]);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private toastSeq = 0;

  readonly canUndo = computed(() => this.history().length > 0);
  readonly totalCards = computed(() => this.columns().reduce((n, c) => n + c.cards.length, 0));
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.query.trim() || f.priority || f.assigneeId || f.label);
  });

  /** Colunas com os cards já filtrados pela busca/filtros. */
  readonly visibleColumns = computed(() => {
    const f = this.filters();
    if (!this.hasActiveFilters()) return this.columns();
    const q = f.query.trim().toLowerCase();
    return this.columns().map((col) => ({
      ...col,
      cards: col.cards.filter(
        (c) =>
          (!q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) &&
          (!f.priority || c.priority === f.priority) &&
          (!f.assigneeId || (f.assigneeId === 'none' ? !c.assigneeId : c.assigneeId === f.assigneeId)) &&
          (!f.label || c.labels.includes(f.label)),
      ),
    }));
  });
  readonly visibleCount = computed(() => this.visibleColumns().reduce((n, c) => n + c.cards.length, 0));

  constructor() {
    effect(() => {
      const cols = this.columns();
      if (this.status() !== 'ready') return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
      } catch {
        this.notify('Não foi possível salvar no navegador (armazenamento indisponível).', false);
      }
    });
  }

  // ---------- carregamento ----------

  load(delayMs = 0): void {
    this.status.set('loading');
    this.errorMessage.set(null);
    const run = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const cols = raw ? this.parse(raw) : seedColumns();
        this.history.set([]);
        this.columns.set(cols);
        this.status.set('ready');
      } catch (e) {
        this.errorMessage.set(e instanceof Error ? e.message : 'Falha ao carregar o board.');
        this.status.set('error');
      }
    };
    if (delayMs > 0) setTimeout(run, delayMs);
    else run();
  }

  /** Descarta os dados salvos e volta ao seed. */
  reset(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    this.history.set([]);
    this.filters.set({ ...EMPTY_FILTERS });
    this.columns.set(seedColumns());
    this.status.set('ready');
    this.errorMessage.set(null);
    this.notify('Board restaurado para os dados de exemplo.', false);
  }

  private parse(raw: string): Column[] {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.some((c) => !c || typeof c.id !== 'string' || !Array.isArray(c.cards))) {
      throw new Error('Os dados salvos estão corrompidos.');
    }
    return data as Column[];
  }

  // ---------- cards ----------

  addCard(columnId: string, draft: Partial<CardDraft> & { title: string }): string | null {
    const title = draft.title.trim();
    if (!title || !this.columns().some((c) => c.id === columnId)) return null;
    const card: Card = {
      title,
      description: draft.description ?? '',
      priority: draft.priority ?? 'medium',
      labels: draft.labels ?? [],
      assigneeId: draft.assigneeId ?? null,
      dueDate: draft.dueDate ?? null,
      id: this.uid('card'),
      createdAt: new Date().toISOString(),
    };
    this.commit(
      this.columns().map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, card] } : c)),
      'Card criado',
    );
    return card.id;
  }

  updateCard(cardId: string, patch: Partial<CardDraft>): void {
    this.commit(
      this.columns().map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
      })),
      'Card atualizado',
    );
  }

  deleteCard(cardId: string): void {
    this.commit(
      this.columns().map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) })),
      'Card excluído',
    );
  }

  /** Move o card para `toColumnId`, antes de `beforeCardId` (ou ao final). */
  moveCard(cardId: string, toColumnId: string, beforeCardId: string | null): void {
    const cols = this.columns();
    const card = cols.flatMap((c) => c.cards).find((c) => c.id === cardId);
    if (!card || !cols.some((c) => c.id === toColumnId)) return;

    const without = cols.map((c) => ({ ...c, cards: c.cards.filter((x) => x.id !== cardId) }));
    const next = without.map((c) => {
      if (c.id !== toColumnId) return c;
      const idx = beforeCardId ? c.cards.findIndex((x) => x.id === beforeCardId) : -1;
      const cards = [...c.cards];
      cards.splice(idx === -1 ? cards.length : idx, 0, card);
      return { ...c, cards };
    });
    const fromCol = cols.find((c) => c.cards.some((x) => x.id === cardId))!;
    const changedColumn = fromCol.id !== toColumnId;
    // evita entrada de undo quando nada mudou de lugar
    if (!changedColumn && JSON.stringify(next) === JSON.stringify(cols)) return;
    this.commit(next, changedColumn ? 'Card movido' : 'Card reordenado');
  }

  // ---------- colunas ----------

  addColumn(title: string, color: string): void {
    const t = title.trim();
    if (!t) return;
    this.commit(
      [...this.columns(), { id: this.uid('col'), title: t, color, limit: null, cards: [] }],
      'Coluna criada',
    );
  }

  updateColumn(columnId: string, patch: Partial<Pick<Column, 'title' | 'color' | 'limit'>>): void {
    if (patch.title !== undefined && !patch.title.trim()) return;
    this.commit(
      this.columns().map((c) =>
        c.id === columnId ? { ...c, ...patch, title: (patch.title ?? c.title).trim() } : c,
      ),
      'Coluna atualizada',
    );
  }

  deleteColumn(columnId: string): void {
    this.commit(
      this.columns().filter((c) => c.id !== columnId),
      'Coluna excluída',
    );
  }

  moveColumn(from: number, to: number): void {
    if (from === to) return;
    const cols = [...this.columns()];
    const [col] = cols.splice(from, 1);
    if (!col) return;
    cols.splice(to, 0, col);
    this.commit(cols, 'Coluna movida');
  }

  // ---------- filtros ----------

  setFilters(patch: Partial<Filters>): void {
    this.filters.update((f) => ({ ...f, ...patch }));
  }

  clearFilters(): void {
    this.filters.set({ ...EMPTY_FILTERS });
  }

  // ---------- undo / toast ----------

  undo(): void {
    const stack = this.history();
    const prev = stack[stack.length - 1];
    if (!prev) return;
    this.history.set(stack.slice(0, -1));
    this.columns.set(prev);
    this.notify('Ação desfeita', false);
  }

  dismissToast(): void {
    clearTimeout(this.toastTimer);
    this.toast.set(null);
  }

  private commit(next: Column[], message: string): void {
    this.history.update((h) => [...h, this.columns()].slice(-HISTORY_LIMIT));
    this.columns.set(next);
    this.notify(message, true);
  }

  private notify(message: string, undoable: boolean): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ id: ++this.toastSeq, message, undoable });
    this.toastTimer = setTimeout(() => this.toast.set(null), 5000);
  }

  private uid(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }
}
