import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { BoardStore } from '../core/board.store';
import { COLUMN_COLORS, Card, Column, Member } from '../core/models';
import { CardComponent } from './card';

@Component({
  selector: 'app-column',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, CardComponent, FormsModule],
  host: { class: 'column', '[style.--col]': 'column().color' },
  template: `
    <header class="column__header" cdkDragHandle title="Arraste para reordenar a coluna">
      <span class="column__dot"></span>
      <h2 class="column__title">{{ column().title }}</h2>
      <span class="column__count" [class.column__count--over]="overLimit()"
        [title]="overLimit() ? 'Limite WIP excedido' : 'Cards na coluna'">
        {{ total() }}@if (column().limit) {/{{ column().limit }}}
      </span>
      <span class="column__actions" (mousedown)="$event.stopPropagation()">
        <button type="button" class="icon-btn" (click)="startAdd()" aria-label="Adicionar card" title="Adicionar card">+</button>
        <button type="button" class="icon-btn" (click)="editing.set(!editing())" aria-label="Editar coluna" title="Editar coluna">&#9998;</button>
        @if (auth.isAdmin()) {
          <button type="button" class="icon-btn icon-btn--danger" (click)="store.deleteColumn(column().id)"
            aria-label="Excluir coluna" title="Excluir coluna">&times;</button>
        }
      </span>
    </header>

    @if (editing()) {
      <form class="column__edit" (ngSubmit)="saveEdit()">
        <label>Nome <input name="t" [(ngModel)]="editTitle" maxlength="40" required /></label>
        <label>Limite WIP <input name="l" type="number" min="0" [(ngModel)]="editLimit" placeholder="sem limite" /></label>
        <div class="swatches" role="radiogroup" aria-label="Cor">
          @for (c of colors; track c) {
            <button type="button" class="swatch" [class.swatch--on]="editColor === c" [style.background]="c"
              (click)="editColor = c" [attr.aria-label]="'Cor ' + c"></button>
          }
        </div>
        <div class="row">
          <button class="btn btn--primary btn--sm" type="submit">Salvar</button>
          <button class="btn btn--ghost btn--sm" type="button" (click)="editing.set(false)">Cancelar</button>
        </div>
      </form>
    }

    <div class="column__list" cdkDropList [id]="column().id" [cdkDropListData]="column().cards"
      [cdkDropListConnectedTo]="connectedTo()" (cdkDropListDropped)="onDrop($event)">
      @for (card of column().cards; track card.id) {
        <app-card cdkDrag [cdkDragData]="card.id" [card]="card" [members]="members()" [done]="isLast()"
          (cdkDragStarted)="dragging = true" (cdkDragEnded)="endDrag()" (open)="open(card.id)">
          <div *cdkDragPlaceholder class="card card--placeholder"></div>
        </app-card>
      } @empty {
        <p class="column__empty">{{ filtered() ? 'Nenhum card corresponde aos filtros' : 'Arraste cards para cá' }}</p>
      }
    </div>

    @if (adding()) {
      <form class="column__add" (ngSubmit)="submit()">
        <textarea #addInput name="n" rows="2" placeholder="Título do card" maxlength="120" [(ngModel)]="newTitle"
          (keydown.enter)="$event.preventDefault(); submit()" (keydown.escape)="adding.set(false)"></textarea>
        <div class="row">
          <button class="btn btn--primary btn--sm" type="submit">Adicionar</button>
          <button class="btn btn--ghost btn--sm" type="button" (click)="adding.set(false)">Cancelar</button>
        </div>
      </form>
    } @else {
      <button type="button" class="column__add-btn" (click)="startAdd()">+ Adicionar card</button>
    }
  `,
})
export class ColumnComponent {
  protected readonly store = inject(BoardStore);
  protected readonly auth = inject(AuthService);

  /** Coluna já filtrada (visível). */
  readonly column = input.required<Column>();
  readonly members = input<Member[]>([]);
  readonly connectedTo = input<string[]>([]);
  readonly isLast = input(false);
  readonly openCard = output<string>();

  protected readonly colors = COLUMN_COLORS;
  protected readonly adding = signal(false);
  protected readonly editing = signal(false);
  protected newTitle = '';
  protected editTitle = '';
  protected editLimit: number | null = null;
  protected editColor = '';
  private readonly addInput = viewChild<ElementRef<HTMLTextAreaElement>>('addInput');

  /** Total real (sem filtro) para o contador e limite WIP. */
  protected readonly total = computed(
    () => this.store.columns().find((c) => c.id === this.column().id)?.cards.length ?? 0,
  );
  protected readonly overLimit = computed(() => {
    const l = this.column().limit;
    return l !== null && l > 0 && this.total() > l;
  });
  protected readonly filtered = computed(() => this.store.hasActiveFilters());

  constructor() {
    effect(() => this.addInput()?.nativeElement.focus());
    effect(() => {
      if (this.editing()) {
        const c = this.column();
        this.editTitle = c.title;
        this.editLimit = c.limit;
        this.editColor = c.color;
      }
    });
  }

  protected dragging = false;

  protected endDrag(): void {
    setTimeout(() => (this.dragging = false));
  }

  protected open(id: string): void {
    if (!this.dragging) this.openCard.emit(id);
  }

  startAdd(): void {
    this.newTitle = '';
    this.adding.set(true);
  }

  submit(): void {
    if (this.newTitle.trim()) this.store.addCard(this.column().id, { title: this.newTitle });
    this.newTitle = '';
    this.adding.set(false);
  }

  saveEdit(): void {
    const limit = this.editLimit && this.editLimit > 0 ? Math.floor(this.editLimit) : null;
    this.store.updateColumn(this.column().id, { title: this.editTitle, color: this.editColor, limit });
    this.editing.set(false);
  }

  onDrop(event: CdkDragDrop<Card[]>): void {
    const cardId = event.item.data as string;
    const visible = this.column().cards.map((c) => c.id).filter((id) => id !== cardId);
    this.store.moveCard(cardId, this.column().id, visible[event.currentIndex] ?? null);
  }
}
