import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { BoardStore } from '../core/board.store';
import { COLUMN_COLORS, Column, LABELS, PRIORITIES, Priority } from '../core/models';
import { MEMBERS } from '../core/seed';
import { ThemeService } from '../core/theme.service';
import { CardDialogComponent } from './card-dialog';
import { ColumnComponent } from './column';
import { initials } from './card';

@Component({
  selector: 'app-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, FormsModule, ColumnComponent, CardDialogComponent],
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    <header class="topbar">
      <div class="brand">
        <span class="brand__logo" aria-hidden="true">&#9638;</span>
        <div>
          <h1>Sprint Board</h1>
          <small>{{ store.totalCards() }} cards &middot; {{ store.columns().length }} colunas</small>
        </div>
      </div>

      <div class="toolbar">
        <input class="search" type="search" placeholder="Buscar cards..." aria-label="Buscar cards"
          [ngModel]="store.filters().query" (ngModelChange)="store.setFilters({ query: $event })" />
        <select aria-label="Filtrar por prioridade" [ngModel]="store.filters().priority"
          (ngModelChange)="store.setFilters({ priority: $event })">
          <option value="">Prioridade</option>
          @for (p of priorities; track p.value) {
            <option [value]="p.value">{{ p.label }}</option>
          }
        </select>
        <select aria-label="Filtrar por responsável" [ngModel]="store.filters().assigneeId"
          (ngModelChange)="store.setFilters({ assigneeId: $event })">
          <option value="">Responsável</option>
          <option value="none">Sem responsável</option>
          @for (m of members; track m.id) {
            <option [value]="m.id">{{ m.name }}</option>
          }
        </select>
        <select aria-label="Filtrar por label" [ngModel]="store.filters().label"
          (ngModelChange)="store.setFilters({ label: $event })">
          <option value="">Label</option>
          @for (l of labels; track l.name) {
            <option [value]="l.name">{{ l.name }}</option>
          }
        </select>
        @if (store.hasActiveFilters()) {
          <button type="button" class="btn btn--ghost btn--sm" (click)="store.clearFilters()">Limpar</button>
        }
      </div>

      <div class="userbar">
        <button type="button" class="btn btn--ghost btn--sm" [disabled]="!store.canUndo()" (click)="store.undo()"
          title="Desfazer (Ctrl+Z)">&#8630; Desfazer</button>
        <button type="button" class="icon-btn" (click)="theme.toggle()" [attr.aria-label]="'Alternar tema (atual: ' + theme.theme() + ')'"
          title="Alternar tema">{{ theme.theme() === 'dark' ? '&#9728;' : '&#9790;' }}</button>
        <span class="avatar avatar--lg" [title]="auth.user()?.name + ' (' + auth.user()?.role + ')'">{{ userInitials() }}</span>
        <button type="button" class="btn btn--ghost btn--sm" (click)="logout()">Sair</button>
      </div>
    </header>

    <main class="board-area">
      @switch (store.status()) {
        @case ('loading') {
          <div class="board" aria-busy="true" aria-label="Carregando board">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="column column--skeleton">
                <div class="sk sk--title"></div>
                <div class="sk sk--card"></div>
                <div class="sk sk--card"></div>
              </div>
            }
          </div>
        }
        @case ('error') {
          <div class="state" role="alert">
            <h2>Não foi possível carregar o board</h2>
            <p>{{ store.errorMessage() }}</p>
            <div class="row">
              <button class="btn btn--primary" (click)="store.load()">Tentar novamente</button>
              <button class="btn btn--ghost" (click)="store.reset()">Restaurar dados de exemplo</button>
            </div>
          </div>
        }
        @case ('ready') {
          @if (store.hasActiveFilters()) {
            <p class="filter-info" role="status">
              {{ store.visibleCount() }} de {{ store.totalCards() }} cards correspondem aos filtros.
              @if (store.visibleCount() === 0) { Tente outros termos. }
            </p>
          }
          <div class="board" cdkDropList cdkDropListOrientation="horizontal" [cdkDropListData]="store.columns()"
            (cdkDropListDropped)="onColumnDrop($event)">
            @for (col of store.visibleColumns(); track col.id; let last = $last) {
              <app-column cdkDrag [column]="col" [members]="members" [connectedTo]="columnIds()" [isLast]="last"
                (openCard)="selectedId.set($event)" />
            }

            <div class="column column--new">
              @if (addingColumn()) {
                <form (ngSubmit)="addColumn()">
                  <input name="c" [(ngModel)]="newColumn" placeholder="Nome da coluna" maxlength="40" required />
                  <div class="row">
                    <button class="btn btn--primary btn--sm" type="submit">Criar</button>
                    <button class="btn btn--ghost btn--sm" type="button" (click)="addingColumn.set(false)">Cancelar</button>
                  </div>
                </form>
              } @else {
                <button type="button" class="column__add-btn" (click)="addingColumn.set(true)">+ Nova coluna</button>
              }
            </div>
          </div>
          @if (store.columns().length === 0) {
            <div class="state">
              <h2>Nenhuma coluna ainda</h2>
              <p>Crie sua primeira coluna ou restaure os dados de exemplo.</p>
              <button class="btn btn--ghost" (click)="store.reset()">Restaurar dados de exemplo</button>
            </div>
          }
        }
      }
    </main>

    @if (selectedCard(); as card) {
      <app-card-dialog [card]="card" [members]="members" (close)="selectedId.set(null)"
        (save)="saveCard(card.id, $event)" (remove)="removeCard(card.id)" />
    }

    @if (store.toast(); as t) {
      <div class="toast" role="status" aria-live="polite">
        <span>{{ t.message }}</span>
        @if (t.undoable) {
          <button type="button" class="toast__btn" (click)="store.undo()">Desfazer</button>
        }
        <button type="button" class="toast__x" (click)="store.dismissToast()" aria-label="Fechar aviso">&times;</button>
      </div>
    }
  `,
})
export class BoardPageComponent implements OnInit {
  protected readonly store = inject(BoardStore);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly members = MEMBERS;
  protected readonly labels = LABELS;
  protected readonly priorities: { value: Priority; label: string }[] = PRIORITIES;
  protected readonly selectedId = signal<string | null>(null);
  protected readonly addingColumn = signal(false);
  protected newColumn = '';

  protected readonly columnIds = computed(() => this.store.columns().map((c) => c.id));
  protected readonly userInitials = computed(() => initials(this.auth.user()?.name ?? '?'));
  protected readonly selectedCard = computed(() => {
    const id = this.selectedId();
    return id ? (this.store.columns().flatMap((c) => c.cards).find((c) => c.id === id) ?? null) : null;
  });

  ngOnInit(): void {
    this.store.load(450);
  }

  onColumnDrop(e: CdkDragDrop<Column[]>): void {
    this.store.moveColumn(e.previousIndex, e.currentIndex);
  }

  addColumn(): void {
    const color = COLUMN_COLORS[this.store.columns().length % COLUMN_COLORS.length];
    this.store.addColumn(this.newColumn, color);
    this.newColumn = '';
    this.addingColumn.set(false);
  }

  saveCard(id: string, patch: Parameters<BoardStore['updateCard']>[1]): void {
    this.store.updateCard(id, patch);
    this.selectedId.set(null);
  }

  removeCard(id: string): void {
    this.store.deleteCard(id);
    this.selectedId.set(null);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  onKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) {
      e.preventDefault();
      this.store.undo();
    }
  }
}
